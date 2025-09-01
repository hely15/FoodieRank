const passport = require("passport")
const { createError } = require("./errorHandler")
require("../config/jwt") // Inicializar configuración de JWT

// Middleware para requerir autenticación
const requireAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err)
    }

    if (!user) {
      return next(createError(401, "Token de autenticación requerido"))
    }

    req.user = user
    next()
  })(req, res, next)
}

// Middleware para requerir rol de administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(createError(401, "Autenticación requerida"))
  }

  if (req.user.role !== "admin") {
    return next(createError(403, "Acceso denegado. Se requieren permisos de administrador"))
  }

  next()
}

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "Autenticación requerida"))
    }

    if (req.user.role !== role) {
      return next(createError(403, `Acceso denegado. Se requieren permisos de ${role}`))
    }

    next()
  }
}

// Middleware para verificar si el usuario es propietario del recurso o admin
const requireOwnershipOrAdmin = (userIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "Autenticación requerida"))
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField]
    const currentUserId = req.user._id.toString()

    // Permitir si es admin o propietario del recurso
    if (req.user.role === "admin" || currentUserId === resourceUserId) {
      return next()
    }

    return next(createError(403, "No tienes permisos para acceder a este recurso"))
  }
}

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err)
    }

    // Si hay usuario, lo agregamos a req.user, si no, continuamos sin usuario
    if (user) {
      req.user = user
    }

    next()
  })(req, res, next)
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireRole, // Added requireRole to exports
  requireOwnershipOrAdmin,
  optionalAuth,
}
