const express = require('express');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

/**
 * GET /api/employees
 * Fetches all active users
 */
router.get('/', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const snapshot = await db.collection('users').where('isActive', '==', true).get();
    const employees = [];
    
    snapshot.forEach(doc => {
      employees.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json(employees);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:uid
 * Fetches a single user document
 */
router.get('/:uid', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { uid } = req.params;
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/employees/:uid
 * Updates user document with provided fields
 */
router.put('/:uid', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(uid).set(updateData, { merge: true });

    return res.status(200).json({ message: "Updated", uid });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/employees/:uid
 * Soft deletes user document (isActive: false)
 */
router.delete('/:uid', verifyToken, checkRole('admin'), async (req, res, next) => {
  try {
    const { uid } = req.params;

    await db.collection('users').doc(uid).set({ 
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({ message: "Deactivated", uid });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:uid/summary
 * Fetches user doc + last 30 attendance + last 3 performance + current month leave count
 */
router.get('/:uid/summary', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    // 1. Fetch User Document
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const userData = { id: userDoc.id, ...userDoc.data() };

    // 2. Fetch Last 30 Attendance Records
    const attendanceSnapshot = await db.collection('attendance')
      .where('userId', '==', uid)
      .orderBy('date', 'desc')
      .limit(30)
      .get();
    
    const attendanceRecords = [];
    attendanceSnapshot.forEach(doc => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });

    // 3. Fetch Last 3 Performance Records
    const performanceSnapshot = await db.collection('performance')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();
      
    const performanceRecords = [];
    performanceSnapshot.forEach(doc => {
      performanceRecords.push({ id: doc.id, ...doc.data() });
    });

    // 4. Fetch Current Month Leave Count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const leavesSnapshot = await db.collection('leaves')
      .where('userId', '==', uid)
      .where('status', '==', 'approved')
      .where('startDate', '<=', admin.firestore.Timestamp.fromDate(endOfMonth))
      .get();
      
    let currentMonthLeaveCount = 0;
    
    // Since we cannot do multiple inequality filters across different fields cleanly in simple Firestore without composite indexing constraints,
    // we fetch approved leaves that started before endOfMonth and filter in memory to ensure they overlap with current month.
    leavesSnapshot.forEach(doc => {
      const leave = doc.data();
      const startDate = leave.startDate.toDate();
      const endDate = leave.endDate.toDate();
      
      // Check if the leave overlaps with the current month
      if (startDate <= endOfMonth && endDate >= startOfMonth) {
        currentMonthLeaveCount++;
      }
    });

    return res.status(200).json({
      employee: userData,
      attendance: attendanceRecords,
      performance: performanceRecords,
      currentMonthLeaveCount
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
