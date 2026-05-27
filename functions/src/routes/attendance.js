const express = require('express');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

/**
 * Helper to get date boundaries
 */
function getDayBoundaries(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

function getMonthBoundaries(monthStr, yearStr) {
  const now = new Date();
  const month = monthStr ? parseInt(monthStr, 10) - 1 : now.getMonth();
  const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
  
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * POST /api/attendance/checkin
 */
router.post('/checkin', verifyToken, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { start, end } = getDayBoundaries();

    // Check for duplicate
    const existingSnapshot = await db.collection('attendance')
      .where('userId', '==', uid)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({ error: 'Already checked in for today' });
    }

    const newRecordRef = db.collection('attendance').doc();
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
    
    await newRecordRef.set({
      userId: uid,
      date: serverTimestamp,
      checkIn: serverTimestamp,
      status: "present",
      flagged: false
    });

    return res.status(201).json({ message: "Checked in", recordId: newRecordRef.id });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/attendance/checkout
 */
router.post('/checkout', verifyToken, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { start, end } = getDayBoundaries();

    const snapshot = await db.collection('attendance')
      .where('userId', '==', uid)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No active check-in found for today' });
    }

    const recordDoc = snapshot.docs[0];
    const recordData = recordDoc.data();
    
    if (recordData.checkOut) {
      return res.status(400).json({ error: 'Already checked out for today' });
    }

    const checkInTime = recordData.checkIn.toDate();
    const checkOutTime = new Date();
    
    // Calculate hours worked
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const hoursWorked = diffMs / (1000 * 60 * 60);

    const updateData = {
      checkOut: admin.firestore.Timestamp.fromDate(checkOutTime),
      hoursWorked: Number(hoursWorked.toFixed(2))
    };

    if (hoursWorked < 4) {
      updateData.status = "half-day";
      updateData.flagged = true;
    }

    await recordDoc.ref.update(updateData);

    return res.status(200).json({ message: "Checked out", hoursWorked: updateData.hoursWorked });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/my
 */
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { month, year } = req.query;
    const { start, end } = getMonthBoundaries(month, year);

    const snapshot = await db.collection('attendance')
      .where('userId', '==', uid)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
      .orderBy('date', 'asc')
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
 * GET /api/attendance/team
 */
router.get('/team', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { month, year, department } = req.query;
    const { start, end } = getMonthBoundaries(month, year);

    let usersQuery = db.collection('users');
    if (department) {
      usersQuery = usersQuery.where('department', '==', department);
    }
    
    const usersSnapshot = await usersQuery.get();
    const targetUserIds = new Set();
    usersSnapshot.forEach(doc => targetUserIds.add(doc.id));

    if (targetUserIds.size === 0) {
      return res.status(200).json({});
    }

    const attendanceSnapshot = await db.collection('attendance')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
      .get();

    const groupedRecords = {};
    
    attendanceSnapshot.forEach(doc => {
      const data = doc.data();
      // Filter by department if targetUserIds exists
      if (department && !targetUserIds.has(data.userId)) {
        return;
      }
      
      if (!groupedRecords[data.userId]) {
        groupedRecords[data.userId] = [];
      }
      groupedRecords[data.userId].push({ id: doc.id, ...data });
    });

    return res.status(200).json(groupedRecords);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/stats/:uid
 */
router.get('/stats/:uid', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { uid } = req.params;
    const { month, year } = req.query;
    const { start, end } = getMonthBoundaries(month, year);

    const snapshot = await db.collection('attendance')
      .where('userId', '==', uid)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
      .get();

    const stats = {
      present: 0,
      absent: 0,
      halfDay: 0,
      wfh: 0,
      total: 0,
      percentage: 0
    };

    snapshot.forEach(doc => {
      const status = doc.data().status;
      stats.total++;
      if (status === 'present') stats.present++;
      else if (status === 'absent') stats.absent++;
      else if (status === 'half-day') stats.halfDay++;
      else if (status === 'wfh') stats.wfh++;
    });

    if (stats.total > 0) {
      // Treating present, wfh, and half-day as "present" for calculation
      const presentCount = stats.present + stats.wfh + (stats.halfDay * 0.5);
      stats.percentage = Number(((presentCount / stats.total) * 100).toFixed(1));
    }

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
