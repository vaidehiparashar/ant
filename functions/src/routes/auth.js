const express = require('express');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const db = admin.firestore();

/**
 * POST /api/auth/set-role
 * Protected: verifyToken, checkRole('admin')
 * Sets custom claim on Firebase user and updates Firestore doc
 */
router.post('/set-role', verifyToken, checkRole('admin'), async (req, res, next) => {
  try {
    const { uid, role } = req.body;

    if (!uid || !role) {
      return res.status(400).json({ error: 'Missing uid or role' });
    }

    // Set custom claim in Firebase Auth
    await admin.auth().setCustomUserClaims(uid, { role });

    // Update role in Firestore
    await db.collection('users').doc(uid).set({ role }, { merge: true });

    return res.status(200).json({ message: "Role set successfully" });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Public route
 * Creates user document in Firestore with provided profile details
 */
router.post('/register', async (req, res, next) => {
  try {
    const { uid, name, email, role, department, designation, joinDate, phone } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing required fields: uid, email' });
    }

    const userData = {
      uid,
      name: name || '',
      email,
      role: role || 'employee',
      department: department || '',
      designation: designation || '',
      joinDate: joinDate || null,
      phone: phone || '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(uid).set(userData);

    return res.status(201).json({ message: "User registered", uid });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Protected: verifyToken
 * Returns the full user document for the authenticated user
 */
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found in database' });
    }

    return res.status(200).json(userDoc.data());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
