// tempo/backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient'); // We can still use supabase client for a simple user check

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
    
    // Verify the token and get the user's ID from it
    const payload = jwt.verify(token, JWT_SECRET); 

    // THE FIX IS HERE: We only select user_id because 'role' does not exist on the user_profile table.
    // Roles are specific to communities.
    const { data: user, error: dbError } = await supabase 
      .from('user_profile')  
      .select('user_id') // Correctly select only user_id
      .eq('user_id', payload.userId)  
      .single();

    if (dbError || !user) {
      console.error('Token validation error or user not found in user_profile:', dbError);
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // Attach the user's ID to the request object for later use in other routes.
    req.userId = user.user_id; 
    
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

// NOTE: This function is now deprecated because there is no global role.
// Role checks must be done inside specific routes by checking the community_membership table.
function requireRole(requiredRole) {
  return (req, res, next) => {
    console.warn("DEPRECATION WARNING: requireRole middleware is used but global roles are not supported.");
    return res.status(500).json({ error: "Server configuration error: Global role check is not supported." });
  };
}

module.exports = { checkJwtMiddleware, requireRole };
