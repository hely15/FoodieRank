const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/errorHandler');
const {
  validateRegister,
  validateLogin,
  validateUserUpdate,
  validatePasswordChange
} = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para autenticación y gestión de sesiones
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Autenticación]
 *     summary: Registrar nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@email.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "Password123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación o email ya registrado
 */
router.post('/register', validateRegister, handleValidationErrors, authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@email.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validateLogin, handleValidationErrors, authController.login);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     tags: [Autenticación]
 *     summary: Obtener perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: Token de autenticación requerido
 */
router.get('/profile', requireAuth, authController.getProfile);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     tags: [Autenticación]
 *     summary: Actualizar perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Carlos Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juancarlos@email.com"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Token de autenticación requerido
 */
router.put('/profile', requireAuth, validateUserUpdate, handleValidationErrors, authController.updateProfile);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     tags: [Autenticación]
 *     summary: Cambiar contraseña del usuario actual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "PasswordActual123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "NuevoPassword123"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Contraseña actual incorrecta o nueva contraseña inválida
 *       401:
 *         description: Token de autenticación requerido
 */
router.put('/change-password', requireAuth, validatePasswordChange, handleValidationErrors, authController.changePassword);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Autenticación]
 *     summary: Renovar token de autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *       401:
 *         description: Token de autenticación requerido
 */
router.post('/refresh', requireAuth, authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cerrar sesión
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
