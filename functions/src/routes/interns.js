const express = require('express');
const admin = require('firebase-admin');
const { Anthropic } = require('@anthropic-ai/sdk');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

const VALID_STAGES = ['applied', 'screening', 'interview', 'offer', 'onboarded', 'rejected'];

/**
 * GET /api/interns
 */
router.get('/', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const snapshot = await db.collection('interns').orderBy('createdAt', 'desc').get();
    const interns = [];

    snapshot.forEach(doc => {
      interns.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json(interns);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/interns
 */
router.post('/', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { name, email, phone, college, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const internData = {
      name,
      email,
      phone: phone || '',
      college: college || '',
      role: role || 'Intern',
      stage: 'applied',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('interns').add(internData);

    return res.status(201).json({ message: "Intern added", internId: docRef.id });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/interns/:internId/stage
 */
router.put('/:internId/stage', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { internId } = req.params;
    const { stage } = req.body;

    if (!VALID_STAGES.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` });
    }

    const internRef = db.collection('interns').doc(internId);
    const internDoc = await internRef.get();

    if (!internDoc.exists) {
      return res.status(404).json({ error: 'Intern not found' });
    }

    const intern = internDoc.data();

    // Call Anthropic API to generate email draft
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let promptContent = `Write an email to an intern candidate named ${intern.name} (${intern.email}) applying for ${intern.role}. They have been moved to the "${stage}" stage. `;
    
    if (stage === 'screening') {
      promptContent += "Mention that their application is under review and we will contact them soon for a screening call.";
    } else if (stage === 'interview') {
      promptContent += "Invite them to an interview and mention we will send a calendar link shortly.";
    } else if (stage === 'offer') {
      promptContent += "Offer them the position enthusiastically and mention offer letter details will follow.";
    } else if (stage === 'onboarded') {
      promptContent += "Welcome them aboard and mention onboarding details.";
    } else if (stage === 'rejected') {
      promptContent += "Empathize, thank them for applying, and mention we will not be moving forward at this time but wish them the best.";
    } else {
      promptContent += "Keep it professional and informative.";
    }

    promptContent += `\n\nOutput ONLY a valid JSON object with strictly two keys: "subject" and "body". Do not include markdown formatting like \`\`\`json. The body should use \\n for new lines.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: "You are an expert HR recruiter. Draft professional, empathetic applicant tracking emails.",
      messages: [
        { role: 'user', content: promptContent }
      ]
    });

    let responseText = response.content[0].text;
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let emailDraft;
    try {
      emailDraft = JSON.parse(responseText);
    } catch (e) {
      // Fallback if parsing fails
      emailDraft = {
        subject: `Update regarding your application for ${intern.role}`,
        body: `Dear ${intern.name},\n\nYour application has been moved to the ${stage} stage.\n\nBest regards,\nHR Team`
      };
    }

    // Update the stage and save the draft
    await internRef.update({
      stage,
      pendingEmailDraft: emailDraft,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ 
      message: "Stage updated", 
      emailDraft 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/interns/:internId
 */
router.put('/:internId', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { internId } = req.params;
    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    // Prevent direct stage updates via this generic PUT
    if (updateData.stage) {
      delete updateData.stage;
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const internRef = db.collection('interns').doc(internId);
    await internRef.set(updateData, { merge: true });

    return res.status(200).json({ message: "Updated" });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/interns/:internId
 */
router.delete('/:internId', verifyToken, checkRole('admin'), async (req, res, next) => {
  try {
    const { internId } = req.params;

    const internRef = db.collection('interns').doc(internId);
    await internRef.delete();

    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
