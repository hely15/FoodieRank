const express = require("express")
const { requireAuth, requireRole } = require("../middlewares/auth")
const { validateUserUpdate } = require("../middlewares/validators")
const { asyncHandler } = require("../middlewares/errorHandler")
const User = require("../models/User")

const router = express.Router()

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Obtener lista de usuarios (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 */
router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role } = req.query
    const filter = role ? { role } : {}

    const users = await User.findAll(filter, {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
    })

    res.json({
      success: true,
      data: users,
      message: "Usuarios obtenidos exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Solo admin o el mismo usuario pueden ver el perfil
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver este perfil",
      })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      })
    }

    res.json({
      success: true,
      data: user,
      message: "Usuario obtenido exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               profile:
 *                 type: object
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 */
router.put(
  "/:id",
  requireAuth,
  validateUserUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Solo admin o el mismo usuario pueden actualizar el perfil
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar este perfil",
      })
    }

    const updatedUser = await User.update(id, req.body)

    res.json({
      success: true,
      data: updatedUser,
      message: "Usuario actualizado exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Eliminar usuario (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    await User.delete(id)

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    })
  }),
)

module.exports = router
