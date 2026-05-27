const express = require('express');
const admin = require('firebase-admin');
const { Anthropic } = require('@anthropic-ai/sdk');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

/**
 * GET /api/performance/:uid
 */
router.get('/:uid', verifyToken, async (req, res, next) => {
  try {
    const { uid } = req.params;

    if (req.user.uid !== uid && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const snapshot = await db.collection('performance')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const records = [];
    snapshot.forEach(doc => {
      records.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json(records);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/performance/calculate/:uid
 */
router.post('/calculate/:uid', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { uid } = req.params;
    const { taskScore } = req.body;

    if (taskScore === undefined || taskScore < 0 || taskScore > 100) {
      return res.status(400).json({ error: 'Valid taskScore (0-100) is required' });
    }

    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // 1. Fetch last 30 days attendance rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceSnapshot = await db.collection('attendance')
      .where('userId', '==', uid)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    let presentCount = 0;
    let totalAttendance = 0;
    
    attendanceSnapshot.forEach(doc => {
      const status = doc.data().status;
      totalAttendance++;
      if (['present', 'wfh'].includes(status)) presentCount += 1;
      else if (status === 'half-day') presentCount += 0.5;
    });

    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100; // Default to 100% if no records

    // 2. Fetch recognition count for uid this month
    const startOfMonth = new Date(year, month - 1, 1);
    const recognitionsSnapshot = await db.collection('recognitions')
      .where('recipientId', '==', uid)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
      .get();
      
    const recognitionCount = recognitionsSnapshot.size;

    // 3. Calculate composite score
    // score = (attendanceRate * 0.4) + (taskScore * 0.4) + (min(recognitionCount * 10, 100) * 0.2)
    const attendanceComponent = attendanceRate * 0.4;
    const taskComponent = taskScore * 0.4;
    const recognitionComponent = Math.min(recognitionCount * 10, 100) * 0.2;
    
    const compositeScore = Number((attendanceComponent + taskComponent + recognitionComponent).toFixed(1));

    const breakdown = {
      attendanceRate: Number(attendanceRate.toFixed(1)),
      taskScore: Number(taskScore),
      recognitionCount,
      components: {
        attendance: Number(attendanceComponent.toFixed(1)),
        task: Number(taskComponent.toFixed(1)),
        recognition: Number(recognitionComponent.toFixed(1))
      }
    };

    // 4. Save to /performance/{uid}_{month}_{year}
    const recordId = `${uid}_${month}_${year}`;
    const recordRef = db.collection('performance').doc(recordId);

    const recordData = {
      userId: uid,
      month,
      year,
      score: compositeScore,
      breakdown,
      status: 'draft',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await recordRef.set(recordData, { merge: true });

    return res.status(200).json({ score: compositeScore, breakdown });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/performance/ai-review/:uid
 */
router.post('/ai-review/:uid', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const recordId = `${uid}_${month}_${year}`;
    
    // Fetch employee data
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const employee = userDoc.data();

    // Fetch last 3 months performance
    const performanceSnapshot = await db.collection('performance')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();
      
    const recentPerformances = [];
    performanceSnapshot.forEach(doc => recentPerformances.push(doc.data()));

    // Fetch attendance summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceSnapshot = await db.collection('attendance')
      .where('userId', '==', uid)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();
      
    let presentCount = 0;
    let totalCount = 0;
    attendanceSnapshot.forEach(doc => {
      totalCount++;
      if (['present', 'wfh', 'half-day'].includes(doc.data().status)) presentCount++;
    });

    const context = `
      Employee Name: ${employee.name || employee.email}
      Role: ${employee.role}, Designation: ${employee.designation || 'N/A'}
      Recent Attendance: ${presentCount} days present out of ${totalCount} recorded days in the last month.
      Last 3 Performance Scores: ${recentPerformances.map(p => `${p.score}/100 (${p.month}/${p.year})`).join(', ') || 'No prior records'}
    `;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: "You are an expert HR manager. Generate a professional, constructive 3-paragraph performance review based on the provided metrics. Tone should be objective and encouraging. Output ONLY the review text.",
      messages: [
        { role: 'user', content: `Please generate a performance review based on this data:\n${context}` }
      ]
    });

    const draft = response.content[0].text.trim();

    // Save aiReviewDraft to the performance record
    const recordRef = db.collection('performance').doc(recordId);
    
    // Ensure the record exists; if not, create a placeholder
    const recordDoc = await recordRef.get();
    if (recordDoc.exists) {
      await recordRef.update({ aiReviewDraft: draft, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      await recordRef.set({
        userId: uid,
        month,
        year,
        status: 'draft',
        aiReviewDraft: draft,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return res.status(200).json({ draft });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/performance/:recordId/publish
 */
router.put('/:recordId/publish', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const { finalReview } = req.body;

    if (!finalReview) {
      return res.status(400).json({ error: 'finalReview content is required' });
    }

    const recordRef = db.collection('performance').doc(recordId);
    const doc = await recordRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Performance record not found' });
    }

    await recordRef.update({
      finalReview,
      reviewedBy: req.user.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "published"
    });

    return res.status(200).json({ message: "Review published" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
