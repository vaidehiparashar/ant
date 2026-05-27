const express = require('express');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

const BASE_LEAVES = {
  casual: 12,
  sick: 8,
  earned: 15
};

/**
 * POST /api/leaves/apply
 */
router.post('/apply', verifyToken, async (req, res, next) => {
  try {
    const { type, fromDate, toDate, days, reason } = req.body;
    const uid = req.user.uid;

    if (!type || !fromDate || !toDate || !days || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const leaveData = {
      userId: uid,
      type,
      startDate: admin.firestore.Timestamp.fromDate(new Date(fromDate)),
      endDate: admin.firestore.Timestamp.fromDate(new Date(toDate)),
      days: Number(days),
      reason,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const leaveRef = await db.collection('leaves').add(leaveData);

    // Send notifications to all HR users
    const hrUsersSnapshot = await db.collection('users')
      .where('role', '==', 'hr')
      .where('isActive', '==', true)
      .get();
      
    const batch = db.batch();
    
    // Attempt to get applicator name
    const applicantDoc = await db.collection('users').doc(uid).get();
    const applicantName = applicantDoc.exists ? applicantDoc.data().name : req.user.email;

    hrUsersSnapshot.forEach(doc => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: doc.id,
        title: 'New Leave Request',
        message: `${applicantName} has applied for ${days} day(s) of ${type} leave.`,
        isRead: false,
        link: `/hr/leaves`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    return res.status(201).json({ message: "Leave applied", leaveId: leaveRef.id });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leaves/my
 */
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db.collection('leaves')
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
 * GET /api/leaves/pending
 */
router.get('/pending', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const snapshot = await db.collection('leaves')
      .where('status', '==', 'pending')
      .get();

    const leaves = [];
    snapshot.forEach(doc => {
      leaves.push({ id: doc.id, ...doc.data() });
    });

    // Populate user name and email via join
    for (let i = 0; i < leaves.length; i++) {
      const userDoc = await db.collection('users').doc(leaves[i].userId).get();
      if (userDoc.exists) {
        leaves[i].userName = userDoc.data().name || 'Unknown';
        leaves[i].userEmail = userDoc.data().email || 'Unknown';
      }
    }

    // Sort manually since we didn't index status + createdAt
    leaves.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.toDate() : 0;
      const dateB = b.createdAt ? b.createdAt.toDate() : 0;
      return dateB - dateA;
    });

    return res.status(200).json(leaves);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/leaves/:leaveId/approve
 */
router.put('/:leaveId/approve', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    
    const leaveRef = db.collection('leaves').doc(leaveId);
    const leaveDoc = await leaveRef.get();
    
    if (!leaveDoc.exists) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const leaveData = leaveDoc.data();
    if (leaveData.status !== 'pending') {
      return res.status(400).json({ error: 'Leave is not in a pending state' });
    }

    const batch = db.batch();

    // 1. Update leave status
    batch.update(leaveRef, {
      status: 'approved',
      approvedBy: req.user.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. We skip explicitly updating balances in the user document here if we dynamically 
    // calculate them in the balance endpoint. However, if the prompt "deducts days from employee's leave balance in /users/{uid}" 
    // means we strictly store balance fields on the user doc, we do it here:
    
    const userRef = db.collection('users').doc(leaveData.userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists && leaveData.type !== 'unpaid') {
      const currentBalances = userDoc.data().leaveBalances || { ...BASE_LEAVES };
      const currentTypeBalance = currentBalances[leaveData.type] ?? BASE_LEAVES[leaveData.type] ?? 0;
      
      const newBalances = {
        ...currentBalances,
        [leaveData.type]: Math.max(0, currentTypeBalance - leaveData.days)
      };
      
      batch.update(userRef, { leaveBalances: newBalances });
    }

    await batch.commit();

    return res.status(200).json({ message: "Leave approved" });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/leaves/:leaveId/reject
 */
router.put('/:leaveId/reject', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    const { reason } = req.body;

    const leaveRef = db.collection('leaves').doc(leaveId);
    
    await leaveRef.update({
      status: 'rejected',
      rejectionReason: reason || 'No reason provided',
      rejectedBy: req.user.uid,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ message: "Leave rejected" });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leaves/balance/:uid
 */
router.get('/balance/:uid', verifyToken, async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    // Security check: only HR/Admin or the user themselves can view balances
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.uid !== uid) {
      return res.status(403).json({ error: 'Unauthorized to view this balance' });
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    const snapshot = await db.collection('leaves')
      .where('userId', '==', uid)
      .where('status', '==', 'approved')
      .where('startDate', '>=', admin.firestore.Timestamp.fromDate(startOfYear))
      .get();

    let usedCasual = 0;
    let usedSick = 0;
    let usedEarned = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'casual') usedCasual += data.days;
      else if (data.type === 'sick') usedSick += data.days;
      else if (data.type === 'earned') usedEarned += data.days;
    });

    const balances = {
      casual: Math.max(0, BASE_LEAVES.casual - usedCasual),
      sick: Math.max(0, BASE_LEAVES.sick - usedSick),
      earned: Math.max(0, BASE_LEAVES.earned - usedEarned),
      unpaid: "unlimited"
    };

    return res.status(200).json(balances);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
