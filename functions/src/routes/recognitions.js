const express = require('express');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

const VALID_BADGES = ['team-player', 'innovator', 'mentor', 'fast-learner', 'reliable'];

/**
 * POST /api/recognitions
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { toUserId, badge, message } = req.body;
    const fromUserId = req.user.uid;

    if (!toUserId || !badge || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!VALID_BADGES.includes(badge)) {
      return res.status(400).json({ error: `Invalid badge. Must be one of: ${VALID_BADGES.join(', ')}` });
    }

    if (toUserId === fromUserId) {
      return res.status(400).json({ error: 'You cannot send a recognition to yourself' });
    }

    const recognitionData = {
      fromUserId,
      recipientId: toUserId,
      badge,
      message,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('recognitions').add(recognitionData);

    return res.status(201).json({ message: "Recognition sent" });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recognitions/leaderboard
 */
router.get('/leaderboard', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const snapshot = await db.collection('recognitions')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endOfMonth))
      .get();

    const counts = {};

    snapshot.forEach(doc => {
      const recipientId = doc.data().recipientId;
      if (!counts[recipientId]) counts[recipientId] = 0;
      counts[recipientId]++;
    });

    // Convert to array and sort
    const leaderboardArray = Object.keys(counts).map(uid => ({
      uid,
      count: counts[uid]
    }));

    leaderboardArray.sort((a, b) => b.count - a.count);

    // Take top 10
    const top10 = leaderboardArray.slice(0, 10);

    // Join with user data
    for (let i = 0; i < top10.length; i++) {
      const userDoc = await db.collection('users').doc(top10[i].uid).get();
      if (userDoc.exists) {
        top10[i].name = userDoc.data().name || 'Unknown';
        top10[i].avatar = userDoc.data().avatar || null;
        top10[i].designation = userDoc.data().designation || '';
      }
    }

    return res.status(200).json(top10);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recognitions/my
 */
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db.collection('recognitions')
      .where('recipientId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const recognitions = [];
    snapshot.forEach(doc => {
      recognitions.push({ id: doc.id, ...doc.data() });
    });

    // Join with sender name
    for (let i = 0; i < recognitions.length; i++) {
      const senderDoc = await db.collection('users').doc(recognitions[i].fromUserId).get();
      if (senderDoc.exists) {
        recognitions[i].senderName = senderDoc.data().name || 'Unknown';
      } else {
        recognitions[i].senderName = 'Unknown';
      }
    }

    return res.status(200).json(recognitions);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
