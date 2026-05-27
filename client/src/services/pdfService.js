import { jsPDF } from 'jspdf';
import { format, endOfMonth, parseISO } from 'date-fns';

function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  
  if (num === 0) return 'Zero';
  if ((num = num.toString()).length > 9) return 'overflow';
  
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  
  return str.trim();
}

function formatCurrency(amount) {
  return 'Rs ' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function generatePayslip(employee, payroll) {
  // Setup A4 Document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // --- HEADER SECTION ---
  // Left: "antHR" in large bold 28px, indigo color
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(99, 102, 241); // #6366F1
  doc.text('antHR', margin, margin + 10);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136); // Gray
  doc.text('Enterprise HR Platform', margin, margin + 15);

  // Right: "SALARY PAYSLIP"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0); // Black
  doc.text('SALARY PAYSLIP', pageWidth - margin, margin + 8, { align: 'right' });

  // Month Year
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136); // Gray
  const monthYear = `${payroll.month} ${payroll.year}`;
  doc.text(monthYear, pageWidth - margin, margin + 13, { align: 'right' });

  // Full width horizontal line below header
  doc.setDrawColor(220, 220, 220); // Light gray line
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 20, pageWidth - margin, margin + 20);

  let currentY = margin + 26;

  // --- EMPLOYEE DETAILS BOX ---
  // Light gray background box
  doc.setFillColor(248, 249, 250); // #F8F9FA
  doc.rect(margin, currentY, pageWidth - (margin * 2), 35, 'F');

  // Text inside box
  const boxInnerMargin = margin + 5;
  const boxRightCol = pageWidth / 2 + 5;
  let textY = currentY + 7;

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(employee.name, boxInnerMargin, textY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Designation: ${employee.designation}`, boxInnerMargin, textY + 8);
  doc.text(`Department: ${employee.department}`, boxInnerMargin, textY + 16);
  
  // Right column
  doc.text(`Employee ID: ${employee.employeeId}`, boxRightCol, textY);
  
  let formattedJoinDate = employee.joinDate;
  if (employee.joinDate && employee.joinDate.includes('T')) {
    formattedJoinDate = format(parseISO(employee.joinDate), 'dd MMM yyyy');
  }
  doc.text(`Join Date: ${formattedJoinDate}`, boxRightCol, textY + 8);
  doc.text(`Phone: ${employee.phone || 'N/A'}`, boxRightCol, textY + 16);
  doc.text(`Email: ${employee.email}`, boxRightCol, textY + 24);

  currentY += 45;

  // --- PAY PERIOD BOX ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Generate accurate last day of month
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = monthNames.findIndex(m => m === payroll.month);
  let lastDay = "30";
  let payPeriodStr = `Pay Period: 01 ${payroll.month} ${payroll.year} — ${lastDay} ${payroll.month} ${payroll.year}`;
  
  if (monthIndex >= 0) {
    const d = new Date(payroll.year, monthIndex, 1);
    const lastD = endOfMonth(d);
    payPeriodStr = `Pay Period: 01 ${payroll.month} ${payroll.year} — ${format(lastD, 'dd MMM yyyy')}`;
  }

  let paymentDate = payroll.paidAt;
  if (paymentDate && paymentDate.includes('T')) {
    paymentDate = format(parseISO(paymentDate), 'dd MMM yyyy');
  }

  doc.text(payPeriodStr, margin, currentY);
  doc.text(`Payment Date: ${paymentDate || 'Pending'}`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 15;

  // --- EARNINGS TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  
  // Header row
  doc.text('EARNINGS', margin, currentY);
  doc.text('AMOUNT', pageWidth - margin, currentY, { align: 'right' });
  
  currentY += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  currentY += 8;
  
  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const earnings = [
    { label: 'Basic Salary', amount: payroll.basicSalary },
    { label: 'House Rent Allowance', amount: payroll.hra },
    { label: 'Other Allowances', amount: payroll.allowances }
  ];

  let grossPay = 0;
  earnings.forEach(item => {
    const amt = Number(item.amount) || 0;
    grossPay += amt;
    doc.text(item.label, margin, currentY);
    doc.text(formatCurrency(amt), pageWidth - margin, currentY, { align: 'right' });
    currentY += 8;
  });

  currentY += 2;
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Gross Pay', margin, currentY);
  doc.text(formatCurrency(grossPay), pageWidth - margin, currentY, { align: 'right' });


  currentY += 20;

  // --- DEDUCTIONS TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  
  // Header row
  doc.text('DEDUCTIONS', margin, currentY);
  doc.text('AMOUNT', pageWidth - margin, currentY, { align: 'right' });
  
  currentY += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  currentY += 8;
  
  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const pfDeduction = 0; // Or calculate if needed, but not specified in payroll object
  const incomeTax = Number(payroll.tax) || 0;
  const otherDeductions = (Number(payroll.deductions) || 0) - incomeTax - pfDeduction;

  const deductions = [
    { label: 'Provident Fund', amount: pfDeduction },
    { label: 'Income Tax', amount: incomeTax },
    { label: 'Other Deductions', amount: otherDeductions > 0 ? otherDeductions : 0 }
  ];

  let totalDeductions = 0;
  deductions.forEach(item => {
    const amt = Number(item.amount) || 0;
    if (amt > 0) {
      totalDeductions += amt;
      doc.text(item.label, margin, currentY);
      doc.text(formatCurrency(amt), pageWidth - margin, currentY, { align: 'right' });
      currentY += 8;
    }
  });
  
  // Handle case where all deductions are 0
  if (totalDeductions === 0) {
    doc.text('No Deductions', margin, currentY);
    doc.text(formatCurrency(0), pageWidth - margin, currentY, { align: 'right' });
    currentY += 8;
  }

  currentY += 2;
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Deductions', margin, currentY);
  doc.text(formatCurrency(totalDeductions), pageWidth - margin, currentY, { align: 'right' });

  currentY += 25;

  // --- NET PAY BOX ---
  // Dark background (#111118)
  doc.setFillColor(17, 17, 24);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 25, 'F');
  
  const netPay = Number(payroll.netPay) || (grossPay - totalDeductions);
  
  // White text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  
  const netPayY = currentY + 16;
  doc.text('NET PAY', margin + 10, netPayY);
  
  doc.setFontSize(18);
  doc.text(formatCurrency(netPay), pageWidth - margin - 10, netPayY, { align: 'right' });
  
  currentY += 35;
  
  // Amount in words
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const amountInWords = numberToWords(Math.round(netPay));
  doc.text(`Amount in words: Rupees ${amountInWords} Only`, margin, currentY);

  // --- FOOTER ---
  const footerY = pageHeight - 30;
  
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a system generated payslip and does not require a signature.', margin, footerY);
  doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy HH:mm:ss')} by antHR Platform`, margin, footerY + 5);

  // --- OUTPUT ---
  const fileName = `payslip_${employee.name.replace(/\s+/g, '_')}_${payroll.month}_${payroll.year}.pdf`;
  
  // Trigger browser download
  doc.save(fileName);
  
  // Return the PDF blob
  return doc.output('blob');
}
