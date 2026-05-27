/**
 * Role-based access control middleware factory.
 * @param  {...string} allowedRoles - List of roles that are permitted to access the route
 * @returns Express middleware function
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    // req.user must be populated by the verifyToken middleware first
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: {
          message: 'Forbidden: Insufficient permissions (No role attached)',
          status: 403
        }
      });
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: {
        message: 'Forbidden: Insufficient permissions',
        status: 403
      }
    });
  };
}

module.exports = checkRole;
