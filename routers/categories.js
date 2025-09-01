const express = require("express")
const { requireAuth, requireRole } = require("../middlewares/auth")
const { validateCategory, validateUpdateCategory } = require("../middlewares/validators")
const { asyncHandler } = require("../middlewares/errorHandler")
const { Category } = require("../models/Category")

const router = express.Router()

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Obtener lista de categorías
 *     tags: [Categories]
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
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida exitosamente
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, active } = req.query

    const filter = {}
    if (active !== undefined) filter.active = active === "true"

    const categories = await Category.findAll(filter, {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
    })

    res.json({
      success: true,
      data: categories,
      message: "Categorías obtenidas exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/categories/active:
 *   get:
 *     summary: Obtener solo categorías activas
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categorías activas obtenidas exitosamente
 */
router.get(
  "/active",
  asyncHandler(async (req, res) => {
    const categories = await Category.findActive()

    res.json({
      success: true,
      data: categories,
      message: "Categorías activas obtenidas exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Crear nueva categoría (solo admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 */
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validateCategory,
  asyncHandler(async (req, res) => {
    const categoryData = {
      ...req.body,
      createdBy: req.user.id,
    }

    const category = await Category.create(categoryData)

    res.status(201).json({
      success: true,
      data: category,
      message: "Categoría creada exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría obtenida exitosamente
 *       404:
 *         description: Categoría no encontrada
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      })
    }

    res.json({
      success: true,
      data: category,
      message: "Categoría obtenida exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Actualizar categoría (solo admin)
 *     tags: [Categories]
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
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 */
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateUpdateCategory,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const updatedCategory = await Category.update(id, req.body)

    res.json({
      success: true,
      data: updatedCategory,
      message: "Categoría actualizada exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Eliminar categoría (solo admin)
 *     tags: [Categories]
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
 *         description: Categoría eliminada exitosamente
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    await Category.delete(id)

    res.json({
      success: true,
      message: "Categoría eliminada exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/categories/{id}/restaurants:
 *   get:
 *     summary: Obtener restaurantes de una categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Restaurantes de la categoría obtenidos exitosamente
 */
router.get(
  "/:id/restaurants",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { page = 1, limit = 10 } = req.query

    const restaurants = await Category.getRestaurants(id, {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
    })

    res.json({
      success: true,
      data: restaurants,
      message: "Restaurantes de la categoría obtenidos exitosamente",
    })
  }),
)

module.exports = router
