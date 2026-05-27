const express = require('express');
const admin = require('firebase-admin');
const { Anthropic } = require('@anthropic-ai/sdk');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

/**
 * POST /api/ai/compose-email
 */
router.post('/compose-email', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { type, recipientName, recipientRole, context } = req.body;

    if (!type || !recipientName || !recipientRole) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let instructions = '';
    switch (type) {
      case 'congratulations':
        instructions = `Write a warm, celebratory email to ${recipientName} (${recipientRole}) congratulating them. Mention their role.`;
        break;
      case 'rejection':
        instructions = `Write an empathetic, encouraging rejection email to ${recipientName} (${recipientRole}) leaving the door open for future opportunities.`;
        break;
      case 'meeting':
        instructions = `Write a professional meeting invite email to ${recipientName} (${recipientRole}) with a clear agenda and time placeholder [TIME].`;
        break;
      case 'offer':
        instructions = `Write a formal, excited offer letter email to ${recipientName} (${recipientRole}). Mention the role clearly and the next onboarding steps.`;
        break;
      case 'check-in':
        instructions = `Write a casual, caring check-in email to ${recipientName} (${recipientRole}) asking how they are doing.`;
        break;
      default:
        instructions = `Write a professional HR email to ${recipientName} (${recipientRole}).`;
        break;
    }

    if (context) {
      instructions += `\nAdditional Context to include: ${context}`;
    }

    instructions += `\n\nOutput ONLY a valid JSON object with strictly two keys: "subject" and "body". Do not include markdown formatting like ```json. The body should use \\n for new lines.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: "You are an expert HR assistant. You draft highly professional, context-aware emails for an ERP system. Always output exactly in JSON format.",
      messages: [
        { role: 'user', content: instructions }
      ]
    });

    let responseText = response.content[0].text;
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedEmail = JSON.parse(responseText);

    // Log to /emailLogs
    await db.collection('emailLogs').add({
      type,
      recipientName,
      recipientRole,
      subject: parsedEmail.subject,
      body: parsedEmail.body,
      status: 'draft',
      generatedBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json(parsedEmail);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/performance-review
 */
router.post('/performance-review', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { employeeData, attendanceData, performanceHistory } = req.body;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const context = `
      Employee Data: ${JSON.stringify(employeeData)}
      Attendance Data: ${JSON.stringify(attendanceData)}
      Performance History: ${JSON.stringify(performanceHistory)}
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: "You are an expert HR manager. Generate a professional, constructive 3-paragraph performance review based on the provided metrics. Tone should be objective and encouraging. Output ONLY the review text.",
      messages: [
        { role: 'user', content: `Please generate a performance review based on this data:\n${context}` }
      ]
    });

    const draft = response.content[0].text.trim();

    return res.status(200).json({ draft });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/org-health-insight
 */
router.post('/org-health-insight', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { avgAttendance, avgPerformance, leaveRate, internConversionRate } = req.body;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const contextData = `
      Average Attendance Rate: ${avgAttendance}%
      Average Performance Score: ${avgPerformance}%
      Leave Rate Optimization: ${leaveRate}%
      Intern Conversion Rate: ${internConversionRate}%
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: "You are an HR analytics AI. Write a professional 3-sentence organizational health insight based on this data. Tone: analytical but human. Include a highlight, a minor concern, and one recommendation. Do not use markdown.",
      messages: [
        { role: 'user', content: `Data context: ${contextData}` }
      ]
    });

    const insight = response.content[0].text.trim();

    // Cache result in /orgHealth/{currentMonthKey}
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const currentMonthKey = `${year}-${month}`;

    await db.collection('orgHealth').doc(currentMonthKey).set({
      aiInsight: insight,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({ insight });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/nl-search
 */
router.post('/nl-search', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { query, employeeData } = req.body;

    if (!query || !employeeData) {
      return res.status(400).json({ error: 'Query and employeeData are required' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const instructions = `
      You are an AI assistant parsing an employee database.
      Query: "${query}"
      
      Dataset:
      ${JSON.stringify(employeeData)}
      
      Return ONLY a JSON array containing the exact employee objects from the Dataset that match the query.
      If none match, return an empty array [].
      Do not include markdown blocks like ```json. Return pure JSON.
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: "You are a JSON filtering engine. You strictly return JSON arrays matching a user's natural language criteria against provided data.",
      messages: [
        { role: 'user', content: instructions }
      ]
    });

    let responseText = response.content[0].text;
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let filteredArray = [];
    try {
      filteredArray = JSON.parse(responseText);
    } catch (e) {
      console.error("AI returned invalid JSON for NL search:", e);
      // Fallback
    }

    return res.status(200).json(filteredArray);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
