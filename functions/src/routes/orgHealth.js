const express = require('express');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

/**
 * Helper to calculate live Org Health stats
 */
async function calculateOrgHealth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const monthString = month.toString().padStart(2, '0');
  const monthKey = `${year}-${monthString}`;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  
  const startOfDay = new Date(year, month - 1, now.getDate());
  const endOfDay = new Date(year, month - 1, now.getDate(), 23, 59, 59, 999);

  // 1. Calculate avgAttendance
  const attendanceSnapshot = await db.collection('attendance')
    .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
    .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfMonth))
    .get();

  let presentCount = 0;
  let totalAttendance = 0;
  attendanceSnapshot.forEach(doc => {
    totalAttendance++;
    const status = doc.data().status;
    if (['present', 'wfh'].includes(status)) presentCount += 1;
    else if (status === 'half-day') presentCount += 0.5;
  });
  
  const avgAttendance = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

  // 2. Calculate avgPerformance
  const performanceSnapshot = await db.collection('performance')
    .where('month', '==', month)
    .where('year', '==', year)
    .get();

  let totalScore = 0;
  let performanceCount = 0;
  performanceSnapshot.forEach(doc => {
    totalScore += (doc.data().score || 0);
    performanceCount++;
  });
  
  const avgPerformance = performanceCount > 0 ? (totalScore / performanceCount) : 100;

  // 3. Calculate leaveRate
  const usersSnapshot = await db.collection('users').where('isActive', '==', true).get();
  const totalEmployees = usersSnapshot.size;

  const leavesSnapshot = await db.collection('leaves')
    .where('status', '==', 'approved')
    .where('startDate', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
    .get();

  let employeesOnLeaveToday = 0;
  leavesSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.endDate.toDate() >= startOfDay) {
      employeesOnLeaveToday++;
    }
  });

  const leaveRate = totalEmployees > 0 ? (employeesOnLeaveToday / totalEmployees) * 100 : 0;

  // 4. Calculate internConversionRate
  const internsSnapshot = await db.collection('interns').get();
  let totalInterns = 0;
  let onboardedInterns = 0;
  
  internsSnapshot.forEach(doc => {
    totalInterns++;
    if (doc.data().stage === 'onboarded') {
      onboardedInterns++;
    }
  });

  const internConversionRate = totalInterns > 0 ? (onboardedInterns / totalInterns) * 100 : 100;

  // 5. Calculate overall healthScore
  // We use inverted leaveRate (100 - leaveRate) because lower leave rate is better for the health score
  const attendanceWeight = 0.35;
  const performanceWeight = 0.35;
  const leaveWeight = 0.15;
  const internWeight = 0.15;

  const healthScore = (avgAttendance * attendanceWeight) + 
                      (avgPerformance * performanceWeight) + 
                      (Math.max(0, 100 - leaveRate) * leaveWeight) + 
                      (internConversionRate * internWeight);

  const orgHealthData = {
    monthKey,
    avgAttendance: Number(avgAttendance.toFixed(1)),
    avgPerformance: Number(avgPerformance.toFixed(1)),
    leaveRate: Number(leaveRate.toFixed(1)),
    internConversionRate: Number(internConversionRate.toFixed(1)),
    healthScore: Number(healthScore.toFixed(1)),
    calculatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  return { monthKey, orgHealthData };
}

/**
 * GET /api/org-health/current
 */
router.get('/current', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const docRef = db.collection('orgHealth').doc(monthKey);
    const doc = await docRef.get();

    if (doc.exists) {
      return res.status(200).json(doc.data());
    }

    // If it doesn't exist, calculate live
    const { orgHealthData } = await calculateOrgHealth();
    
    // Save the freshly calculated data
    await docRef.set(orgHealthData, { merge: true });

    return res.status(200).json(orgHealthData);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/org-health/calculate
 */
router.post('/calculate', verifyToken, checkRole('admin'), async (req, res, next) => {
  try {
    const { monthKey, orgHealthData } = await calculateOrgHealth();

    const docRef = db.collection('orgHealth').doc(monthKey);
    await docRef.set(orgHealthData, { merge: true });

    return res.status(200).json(orgHealthData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
