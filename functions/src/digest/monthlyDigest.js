const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { Anthropic } = require('@anthropic-ai/sdk');
const sgMail = require('@sendgrid/mail');

exports.generateMonthlyDigest = onSchedule('0 8 1 * *', async (event) => {
  const db = admin.firestore();
  
  // Set up SendGrid
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    const now = new Date();
    // Calculate last month
    let lastMonth = now.getMonth(); // 1-12 scale when adjusted
    let year = now.getFullYear();
    if (lastMonth === 0) {
      lastMonth = 12;
      year -= 1;
    }

    // JS Date is 0-indexed for month
    const startOfLastMonth = new Date(year, lastMonth - 1, 1);
    const endOfLastMonth = new Date(year, lastMonth, 0, 23, 59, 59, 999);
    
    const startTimestamp = admin.firestore.Timestamp.fromDate(startOfLastMonth);
    const endTimestamp = admin.firestore.Timestamp.fromDate(endOfLastMonth);

    // 1. Average attendance rate across all employees last month
    const attendanceSnapshot = await db.collection('attendance')
      .where('date', '>=', startTimestamp)
      .where('date', '<=', endTimestamp)
      .get();
      
    let totalRecords = 0;
    let presentRecords = 0;
    let flaggedCount = 0;

    attendanceSnapshot.forEach(doc => {
      totalRecords++;
      const data = doc.data();
      const status = data.status;
      if (status === 'present' || status === 'wfh' || status === 'half-day') {
        presentRecords++;
      }
      if (data.flagged === true) {
        flaggedCount++; // 3. Count of flagged attendance records
      }
    });

    const avgAttendanceRate = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : 0;

    // 2. Top 3 performers by score
    // Assuming performance has createdAt or we just fetch top 3 overall if month is not tracked strictly in the schema.
    // The schema says `period (monthly|quarterly)`. We'll just fetch all and sort by score.
    const performanceSnapshot = await db.collection('performance')
      .orderBy('score', 'desc')
      .limit(10)
      .get();
    
    const topPerformers = [];
    performanceSnapshot.forEach(doc => {
      if (topPerformers.length < 3) {
        const data = doc.data();
        // optionally filter by date here if needed
        topPerformers.push({ userId: data.userId, score: data.score });
      }
    });

    // Resolve user names for top performers
    const topPerformerNames = [];
    for (const p of topPerformers) {
      const userDoc = await db.collection('users').doc(p.userId).get();
      if (userDoc.exists) {
        topPerformerNames.push(`${userDoc.data().name || userDoc.data().email} (${p.score}/100)`);
      }
    }

    // 4. Count of interns who changed stage last month
    // We will assume interns have an updatedAt field. If not, we fall back to 0.
    const internsSnapshot = await db.collection('interns').get();
    let internStageChanges = 0;
    internsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.updatedAt && data.updatedAt.toDate() >= startOfLastMonth && data.updatedAt.toDate() <= endOfLastMonth) {
        internStageChanges++;
      }
    });

    // 5. Total payroll amount from last month
    const payrollSnapshot = await db.collection('payroll')
      .where('month', '==', lastMonth)
      .where('year', '==', year)
      .get();

    let totalPayroll = 0;
    payrollSnapshot.forEach(doc => {
      totalPayroll += (doc.data().netPay || 0);
    });

    // Build Context String
    const contextData = `
      - Month/Year: ${lastMonth}/${year}
      - Average Attendance Rate: ${avgAttendanceRate}%
      - Flagged Attendance Records: ${flaggedCount}
      - Top Performers: ${topPerformerNames.join(', ') || 'None recorded'}
      - Intern Stage Changes: ${internStageChanges}
      - Total Payroll Amount: $${totalPayroll.toLocaleString()}
    `;

    // Call Anthropic API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: "You are an HR analytics AI. Write a professional 5-paragraph monthly digest email for HR leadership based on this data. Tone: analytical but human. Include highlights, concerns, and one recommendation. Do not include markdown code blocks or placeholders.",
      messages: [
        { role: 'user', content: `Data context: ${contextData}` }
      ]
    });

    const aiDigest = response.content[0].text.trim();

    // Fetch HR and Admin users
    const hrAdminSnapshot = await db.collection('users')
      .where('role', 'in', ['hr', 'admin'])
      .where('isActive', '==', true)
      .get();

    const recipientEmails = [];
    hrAdminSnapshot.forEach(doc => {
      if (doc.data().email) {
        recipientEmails.push(doc.data().email);
      }
    });

    // Send Emails via SendGrid
    if (recipientEmails.length > 0) {
      const msg = {
        to: recipientEmails,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@anthr.app',
        subject: `Monthly HR AI Digest - ${lastMonth}/${year}`,
        text: aiDigest,
      };

      await sgMail.sendMultiple(msg);
      console.log(`Sent monthly digest to ${recipientEmails.length} leaders.`);
    }

    // Save digest text to Firestore
    const monthKey = `${year}-${lastMonth.toString().padStart(2, '0')}`;
    // Use set with merge: true in case orgHealth already has stats
    await db.collection('orgHealth').doc(monthKey).set({
      aiDigest: aiDigest,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Successfully generated and saved monthly digest for ${monthKey}.`);

  } catch (error) {
    console.error('Error generating monthly digest:', error);
  }
});
