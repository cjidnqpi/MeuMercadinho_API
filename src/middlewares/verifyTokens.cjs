const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET; // stocke ta clé secrète dans un .env
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // pour récupérer les infos plus tard
    next(); // autorisé
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
}

module.exports = verifyToken;
