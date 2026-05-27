const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Import routers
const authRouter = require('./routes/auth');
const employeesRouter = require('./routes/employees');
const attendanceRouter = require('./routes/attendance');
const leavesRouter = require('./routes/leaves');
const payrollRouter = require('./routes/payroll');
const performanceRouter = require('./routes/performance');
const internsRouter = require('./routes/interns');
const aiRouter = require('./routes/ai');
const recognitionsRouter = require('./routes/recognitions');
const orgHealthRouter = require('./routes/orgHealth');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());
app.use(morgan('dev')); // Request logging

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/interns', internsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/recognitions', recognitionsRouter);
app.use('/api/org-health', orgHealthRouter);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
