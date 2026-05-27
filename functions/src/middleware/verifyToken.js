const admin = require('firebase-admin');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Unauthorized: Missing or improperly formatted Bearer token',
        status: 401
      }
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'employee' // default fallback if claim not set
    };
    
    return next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({
      error: {
        message: 'Forbidden: Invalid or expired token',
        status: 403
      }
    });
  }
}

module.exports = verifyToken;
