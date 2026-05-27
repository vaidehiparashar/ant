const express = require('express');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

/**
 * GET /api/payroll/all
 */
router.get('/all', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Missing month or year query parameters' });
    }

    const snapshot = await db.collection('payroll')
      .where('month', '==', parseInt(month, 10))
      .where('year', '==', parseInt(year, 10))
      .get();

    const payrolls = [];
    snapshot.forEach(doc => {
      payrolls.push({ id: doc.id, ...doc.data() });
    });

    // Populate employee name and designation via join
    for (let i = 0; i < payrolls.length; i++) {
      const userDoc = await db.collection('users').doc(payrolls[i].userId).get();
      if (userDoc.exists) {
        payrolls[i].userName = userDoc.data().name || 'Unknown';
        payrolls[i].designation = userDoc.data().designation || 'Unknown';
      }
    }

    return res.status(200).json(payrolls);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payroll/my
 */
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { month, year } = req.query;
    let query = db.collection('payroll').where('userId', '==', uid);

    if (month && year) {
      query = query.where('month', '==', parseInt(month, 10))
                   .where('year', '==', parseInt(year, 10));
    } else {
      // If no specific month/year is provided, fetch the most recent ones (simulating last 6 months)
      // Since we don't have a direct date field index natively set up here, we sort by year/month or ID if formatted nicely.
      // Assuming 'generatedAt' exists, we'll sort by it.
      query = query.orderBy('generatedAt', 'desc').limit(6);
    }

    const snapshot = await query.get();

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
 * POST /api/payroll/generate/:uid
 */
router.post('/generate/:uid', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { uid } = req.params;
    const now = new Date();
    // 1-based month
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = userDoc.data();

    const basicSalary = employee.basicSalary || 0;
    const hra = employee.hra || 0;
    const allowances = employee.allowances || 0;
    const deductions = employee.deductions || 0;

    const gross = basicSalary + hra + allowances;
    const tax = gross * 0.10;
    const net = gross - deductions - tax;

    const payrollId = `${uid}_${month}_${year}`;
    const payrollRef = db.collection('payroll').doc(payrollId);

    const payrollData = {
      userId: uid,
      month,
      year,
      basicSalary,
      hra,
      allowances,
      deductions,
      tax,
      netPay: net,
      status: "processed",
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await payrollRef.set(payrollData);

    return res.status(201).json({ id: payrollId, ...payrollData });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/payroll/:payrollId/mark-paid
 */
router.put('/:payrollId/mark-paid', verifyToken, checkRole('admin', 'hr'), async (req, res, next) => {
  try {
    const { payrollId } = req.params;

    const payrollRef = db.collection('payroll').doc(payrollId);
    const payrollDoc = await payrollRef.get();

    if (!payrollDoc.exists) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    const data = payrollDoc.data();

    await payrollRef.update({
      status: 'paid',
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send email notification via SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Fetch user's email
    const userDoc = await db.collection('users').doc(data.userId).get();
    
    if (userDoc.exists && userDoc.data().email) {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = monthNames[data.month - 1] || data.month;
      
      const msg = {
        to: userDoc.data().email,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@anthr.app',
        subject: `Salary Credited - ${monthName} ${data.year}`,
        text: `Hello ${userDoc.data().name || 'Employee'},\n\nYour salary for ${monthName} ${data.year} has been credited to your account.\n\nBest regards,\nHR Team`,
      };

      try {
        await sgMail.send(msg);
      } catch (sgError) {
        console.error('SendGrid error:', sgError);
        // Do not fail the API response if the email fails, since DB is updated.
      }
    }

    return res.status(200).json({ message: "Marked as paid" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
