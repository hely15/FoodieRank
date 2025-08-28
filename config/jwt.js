const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const { getDB } = require('./database');
const { ObjectId } = require('mongodb');

// Configuración de la estrategia JWT para Passport
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback_secret_key'
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(payload.userId) },
      { projection: { password: 0 } }
    );

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));

// Función para generar JWT token
const generateToken = (userId, role) => {
  const payload = {
    userId: userId.toString(),
    role: role,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token válido por 7 días
  });
};

// Función para verificar JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  jwtOptions
};