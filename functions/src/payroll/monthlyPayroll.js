const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

exports.calculateMonthlyPayroll = onSchedule('0 9 28 * *', async (event) => {
  const db = admin.firestore();
  
  try {
    // 1. Fetch all active employees (role = "employee" or "hr")
    const usersSnapshot = await db.collection('users')
      .where('isActive', '==', true)
      .where('role', 'in', ['employee', 'hr'])
      .get();
      
    const activeEmployees = [];
    usersSnapshot.forEach(doc => {
      activeEmployees.push({ id: doc.id, ...doc.data() });
    });

    const now = new Date();
    // Use 1-based month for readability (1 = Jan, 12 = Dec)
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let totalPayrollAmount = 0;
    const batch = db.batch();

    for (const employee of activeEmployees) {
      // 2. Extract salary components (defaulting to 0 if not set)
      const basicSalary = employee.basicSalary || 0;
      const hra = employee.hra || 0;
      const allowances = employee.allowances || 0;
      const deductions = employee.deductions || 0;

      // 3. Calculate grossPay
      const grossPay = basicSalary + hra + allowances;

      // 4. Calculate tax (10% flat bracket)
      const tax = grossPay * 0.10;

      // 5. Calculate netPay
      const netPay = grossPay - deductions - tax;
      
      // Accumulate total for the system log
      totalPayrollAmount += netPay;

      // 6. Write a new document to /payroll
      const payrollId = `${employee.id}_${month}_${year}`;
      const payrollRef = db.collection('payroll').doc(payrollId);
      
      batch.set(payrollRef, {
        userId: employee.id,
        month,
        year,
        basicSalary,
        hra,
        allowances,
        deductions,
        tax,
        netPay,
        status: "draft",
        generatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 7. Log total payroll amount to /systemLogs
    const logRef = db.collection('systemLogs').doc();
    batch.set(logRef, {
      type: 'payroll_generation',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      month,
      year,
      employeeCount: activeEmployees.length,
      totalPayrollAmount,
      message: `Monthly payroll processed for ${activeEmployees.length} employees. Total Net Pay: ${totalPayrollAmount}`
    });

    await batch.commit();
    console.log(`Successfully generated payroll for ${month}/${year}. Total Net Pay: ${totalPayrollAmount}`);

  } catch (error) {
    console.error('Error generating monthly payroll:', error);
  }
});
