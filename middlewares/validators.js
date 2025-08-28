const { body, param, query } = require('express-validator');

// Validaciones para autenticación
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número')
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Validaciones para restaurantes
const validateRestaurant = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La descripción debe tener entre 10 y 500 caracteres'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('La categoría es requerida'),
  
  body('location.address')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('La dirección debe tener entre 10 y 200 caracteres'),
  
  body('location.coordinates.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Las coordenadas deben ser un array con longitud y latitud'),
  
  body('location.coordinates.coordinates.*')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Las coordenadas deben ser números válidos'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('La imagen debe ser una URL válida')
];

// Validaciones para platos
const validateDish = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('La descripción debe tener entre 10 y 300 caracteres'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  
  body('restaurantId')
    .isMongoId()
    .withMessage('ID de restaurante inválido'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('La imagen debe ser una URL válida')
];

// Validaciones para reseñas
const validateReview = [
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('El comentario debe tener entre 10 y 500 caracteres'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser un número entero entre 1 y 5'),
  
  body('restaurantId')
    .isMongoId()
    .withMessage('ID de restaurante inválido')
];

// Validaciones para categorías
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('La descripción debe tener entre 10 y 200 caracteres')
];

// Validaciones para parámetros de ID
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} debe ser un ID válido`)
];

// Validaciones para consultas de paginación
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'rating', 'createdAt', 'reviewCount'])
    .withMessage('Campo de ordenamiento inválido'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc')
];

// Validaciones para filtros de restaurantes
const validateRestaurantFilters = [
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Categoría inválida'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Búsqueda debe tener entre 2 y 100 caracteres'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Calificación mínima debe ser entre 1 y 5'),
  
  query('approved')
    .optional()
    .isBoolean()
    .withMessage('Aprobado debe ser true o false')
];

// Validación para reacciones a reseñas
const validateReviewReaction = [
  body('type')
    .isIn(['like', 'dislike'])
    .withMessage('El tipo debe ser like o dislike'),
  
  param('reviewId')
    .isMongoId()
    .withMessage('ID de reseña inválido')
];

// Validación para actualización de usuario
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido')
];

// Validación para cambio de contraseña
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateRestaurant,
  validateDish,
  validateReview,
  validateCategory,
  validateObjectId,
  validatePagination,
  validateRestaurantFilters,
  validateReviewReaction,
  validateUserUpdate,
  validatePasswordChange
};