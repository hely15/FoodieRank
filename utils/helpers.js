/**
 * Utilidades generales para el backend de FoodieRank
 */

/**
 * Formatea una fecha a string legible en español
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date) {
  if (!date) return null

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  }

  return new Date(date).toLocaleDateString("es-MX", options)
}

/**
 * Formatea un precio a moneda mexicana
 * @param {number} price - Precio a formatear
 * @returns {string} Precio formateado
 */
function formatPrice(price) {
  if (typeof price !== "number") return "$0.00"

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price)
}

/**
 * Genera un slug a partir de un string
 * @param {string} text - Texto a convertir en slug
 * @returns {string} Slug generado
 */
function generateSlug(text) {
  if (!text) return ""

  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäâã]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöôõ]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lon1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lon2 - Longitud del segundo punto
 * @returns {number} Distancia en kilómetros
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radio de la Tierra en kilómetros
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convierte grados a radianes
 * @param {number} degrees - Grados a convertir
 * @returns {number} Radianes
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida si una contraseña cumple los requisitos mínimos
 * @param {string} password - Contraseña a validar
 * @returns {object} Objeto con resultado y errores
 */
function validatePassword(password) {
  const errors = []

  if (!password || password.length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres")
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra minúscula")
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra mayúscula")
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("La contraseña debe contener al menos un número")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitiza un string removiendo caracteres peligrosos
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
function sanitizeString(str) {
  if (typeof str !== "string") return ""

  return str
    .trim()
    .replace(/[<>]/g, "") // Remover < y >
    .replace(/javascript:/gi, "") // Remover javascript:
    .replace(/on\w+=/gi, "") // Remover event handlers
}

/**
 * Genera un código aleatorio alfanumérico
 * @param {number} length - Longitud del código
 * @returns {string} Código generado
 */
function generateRandomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

/**
 * Calcula el promedio de calificaciones
 * @param {Array} ratings - Array de calificaciones
 * @returns {number} Promedio redondeado a 1 decimal
 */
function calculateAverageRating(ratings) {
  if (!Array.isArray(ratings) || ratings.length === 0) return 0

  const sum = ratings.reduce((acc, rating) => acc + rating, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

/**
 * Pagina resultados de una consulta
 * @param {number} page - Página actual
 * @param {number} limit - Elementos por página
 * @param {number} total - Total de elementos
 * @returns {object} Información de paginación
 */
function getPaginationInfo(page, limit, total) {
  const totalPages = Math.ceil(total / limit)

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  }
}

module.exports = {
  formatDate,
  formatPrice,
  generateSlug,
  calculateDistance,
  isValidEmail,
  validatePassword,
  sanitizeString,
  generateRandomCode,
  calculateAverageRating,
  getPaginationInfo,
}
