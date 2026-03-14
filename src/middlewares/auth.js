const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  let token;
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
      } else {
          return res.status(401).json({ error: 'Formato de token inválido' });
      }
  } else if (req.body && req.body.token) {
      token = req.body.token;
  } else if (req.query.token) {
      token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = authenticate;



