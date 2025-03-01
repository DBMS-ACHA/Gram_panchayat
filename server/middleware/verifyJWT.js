const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // First check authorization header
    const bearerHeader = req.headers['authorization'];

    // Then check cookies
    const cookieToken = req.cookies.token;

    // Use either the bearer token or cookie token
    const token = bearerHeader ? bearerHeader.split(' ')[1] : cookieToken;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = verifyToken;