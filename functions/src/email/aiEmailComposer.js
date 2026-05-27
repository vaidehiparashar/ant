const express = require('express');
const cors = require('cors');
const { Anthropic } = require('@anthropic-ai/sdk');

const router = express.Router();

router.post('/compose-email', async (req, res) => {
  try {
    const { type, recipientName, recipientRole, context } = req.body;

    if (!type || !recipientName || !recipientRole) {
      return res.status(400).json({ error: 'Missing required fields: type, recipientName, recipientRole' });
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
      system: "You are an expert HR assistant. You draft highly professional, context-aware emails for an ERP system. Always output exactly in JSON format as requested without any surrounding text.",
      messages: [
        { role: 'user', content: instructions }
      ]
    });

    let responseText = response.content[0].text;
    
    // In case the model includes markdown code blocks despite instructions
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedEmail = JSON.parse(responseText);

    return res.status(200).json(parsedEmail);
  } catch (error) {
    console.error('Error generating AI email:', error);
    return res.status(500).json({ error: 'Failed to generate email content.' });
  }
});

// To be mounted as an Express app in index.js
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use('/api', router);

module.exports = app;
