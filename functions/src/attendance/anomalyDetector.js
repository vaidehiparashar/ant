const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

exports.detectAttendanceAnomalies = onSchedule('59 23 * * *', async (event) => {
  const db = admin.firestore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // 1. Fetch all attendance records for today
    const todayRecordsSnapshot = await db.collection('attendance')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
      .get();
    
    const todayRecordsMap = new Map();
    todayRecordsSnapshot.forEach(doc => {
      todayRecordsMap.set(doc.data().userId, { id: doc.id, ...doc.data() });
    });

    // 2. Fetch all active users
    const usersSnapshot = await db.collection('users').where('isActive', '==', true).get();
    const activeUsers = [];
    usersSnapshot.forEach(doc => {
      activeUsers.push({ id: doc.id, ...doc.data() });
    });

    let flaggedCount = 0;
    const batch = db.batch();

    // Calculate dates for 90-day and 30-day windows
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const user of activeUsers) {
      let isFlagged = false;
      let userTodayRecord = todayRecordsMap.get(user.id);
      
      // 3. Create missing records as absent and flagged
      if (!userTodayRecord) {
        const newRecordRef = db.collection('attendance').doc();
        const newRecord = {
          userId: user.id,
          date: admin.firestore.Timestamp.fromDate(new Date()),
          status: 'absent',
          flagged: true,
          hoursWorked: 0,
        };
        batch.set(newRecordRef, newRecord);
        userTodayRecord = newRecord;
        isFlagged = true;
      }

      // 4. Calculate attendance rate over last 90 days (and 30 days to compare)
      const pastRecordsSnapshot = await db.collection('attendance')
        .where('userId', '==', user.id)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
        .get();

      let present90 = 0;
      let total90 = 0;
      let present30 = 0;
      let total30 = 0;

      pastRecordsSnapshot.forEach(doc => {
        const data = doc.data();
        const recordDate = data.date.toDate();
        const isPresent = data.status === 'present' || data.status === 'wfh' || data.status === 'half-day';
        
        total90++;
        if (isPresent) present90++;

        if (recordDate >= thirtyDaysAgo) {
          total30++;
          if (isPresent) present30++;
        }
      });

      // Include today's record in the calculation if not already fetched in the past records
      // (Depends on if today's record was just created or already existed)
      const rate90 = total90 > 0 ? (present90 / total90) * 100 : 100;
      const rate30 = total30 > 0 ? (present30 / total30) * 100 : rate90; // "today's rate" approx by last 30 days

      // 5. If today's rate (30-day avg) is 20% lower than 90-day average
      if (rate30 <= rate90 - 20) {
        isFlagged = true;
      }

      if (isFlagged) {
        flaggedCount++;
        // Update user alert
        const userRef = db.collection('users').doc(user.id);
        batch.update(userRef, { attendanceAlert: true });

        // Update attendance record if it existed but needs flagging
        if (userTodayRecord.id && !userTodayRecord.flagged) {
          const recordRef = db.collection('attendance').doc(userTodayRecord.id);
          batch.update(recordRef, { flagged: true });
        }
      }
    }

    // 6. Log a summary of how many users were flagged
    const logRef = db.collection('systemLogs').doc();
    batch.set(logRef, {
      type: 'attendance_anomaly',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      flaggedUsersCount: flaggedCount,
      message: `Completed daily attendance check. Flagged ${flaggedCount} users for anomalies or absence.`
    });

    await batch.commit();
    console.log(`Successfully completed daily attendance check. Flagged ${flaggedCount} users.`);
    
  } catch (error) {
    console.error('Error running anomaly detector:', error);
  }
});
