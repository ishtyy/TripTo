    // backend/src/middleware/authMiddleware.js
    const jwt = require('jsonwebtoken');
    const supabase = require('../config/supabaseClient');

    const JWT_SECRET = process.env.JWT_SECRET;

    async function checkJwtMiddleware(req, res, next) {
      try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing or malformed Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Missing token in Authorization header' });
        }
        
        // Verify the token and decode its payload
        // Ensure JWT_SECRET is correctly set in your .env file!
        const payload = jwt.verify(token, JWT_SECRET); 

        const { data: user, error: dbError } = await supabase
          .from('user_profile') 
          .select('user_id, role')  // Fetches the global role from user_profile
          .eq('user_id', payload.userId) 
          .single();

        if (dbError || !user) {
          console.error('Token validation error or user not found in user_profile:', dbError);
          return res.status(401).json({ error: 'Invalid token or user not found' });
        }

        req.userId = user.user_id; 
        req.role = user.role; // Sets the global role on the request object
        
        next();
      } catch (err) {
        console.error('checkJwtMiddleware Error:', err.name, err.message);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: `Unauthorized: Invalid token - ${err.message}` });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Unauthorized: Token expired' });
        }
        return res.status(401).json({ error: 'Unauthorized (Middleware)' });
      }
    }

    function requireRole(requiredRole) {
      return (req, res, next) => {
        const userRole = req.role; // This is the global role from user_profile

        if (userRole === requiredRole || (Array.isArray(requiredRole) && requiredRole.includes(userRole))) {
          next();
        } else {
          // If userRole is null or undefined, this will also correctly forbid access.
          return res.status(403).json({ 
            error: `Forbidden: Insufficient privileges. Required role: ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}, User role: ${userRole || 'N/A'}` 
          });
        }
      };
    }

    module.exports = { checkJwtMiddleware, requireRole };
    