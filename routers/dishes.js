const express = require("express")
const { requireAuth, requireRole } = require("../middlewares/auth")
const { validateDish, validateUpdateDish } = require("../middlewares/validators")
const { asyncHandler } = require("../middlewares/errorHandler")
const Dish = require("../models/Dish")

const router = express.Router()

/**
 * @swagger
 * /api/v1/dishes:
 *   get:
 *     summary: Obtener lista de platos
 *     tags: [Dishes]
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
 *         name: restaurant
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lista de platos obtenida exitosamente
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, restaurant, category, available, search, minPrice, maxPrice } = req.query

    const options = {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
    }

    if (search) options.search = search
    if (minPrice) options.minPrice = minPrice
    if (maxPrice) options.maxPrice = maxPrice
    if (available !== undefined) options.available = available === "true"

    const dishes = await Dish.findAll(options)

    res.json({
      success: true,
      data: dishes,
      message: "Platos obtenidos exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/dishes/restaurant/{restaurantId}:
 *   get:
 *     summary: Obtener platos de un restaurante específico
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Platos del restaurante obtenidos exitosamente
 */
router.get(
  "/restaurant/:restaurantId",
  asyncHandler(async (req, res) => {
    const { restaurantId } = req.params
    const { category } = req.query

    const filter = { restaurant: restaurantId, available: true }
    if (category) filter.category = category

    const dishes = await Dish.findByRestaurant(restaurantId, filter)

    res.json({
      success: true,
      data: dishes,
      message: "Platos del restaurante obtenidos exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/dishes:
 *   post:
 *     summary: Crear nuevo plato
 *     tags: [Dishes]
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
 *               - restaurant
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               restaurant:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plato creado exitosamente
 */
router.post(
  "/",
  requireAuth,
  validateDish,
  asyncHandler(async (req, res) => {
    const dishData = {
      ...req.body,
      createdBy: req.user.id,
    }

    const dish = await Dish.create(dishData)

    res.status(201).json({
      success: true,
      data: dish,
      message: "Plato creado exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/dishes/{id}:
 *   get:
 *     summary: Obtener plato por ID
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plato obtenido exitosamente
 *       404:
 *         description: Plato no encontrado
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const dish = await Dish.findById(id)
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Plato no encontrado",
      })
    }

    res.json({
      success: true,
      data: dish,
      message: "Plato obtenido exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/dishes/{id}:
 *   put:
 *     summary: Actualizar plato
 *     tags: [Dishes]
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
 *               price:
 *                 type: number
 *               available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plato actualizado exitosamente
 */
router.put(
  "/:id",
  requireAuth,
  validateUpdateDish,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const dish = await Dish.findById(id)
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Plato no encontrado",
      })
    }

    if (req.user.role !== "admin" && dish.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar este plato",
      })
    }

    const updatedDish = await Dish.updateById(id, req.body)

    res.json({
      success: true,
      data: updatedDish,
      message: "Plato actualizado exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/dishes/{id}:
 *   delete:
 *     summary: Eliminar plato
 *     tags: [Dishes]
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
 *         description: Plato eliminado exitosamente
 */
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const dish = await Dish.findById(id)
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Plato no encontrado",
      })
    }

    if (req.user.role !== "admin" && dish.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar este plato",
      })
    }

    console.log("[v0] Attempting to delete dish with ID:", id)
    console.log("[v0] Dish.deleteById method exists:", typeof Dish.deleteById === "function")

    try {
      await Dish.deleteById(id)
      console.log("[v0] Dish deletion successful")
    } catch (error) {
      console.log("[v0] Dish deletion error:", error.message)
      throw error
    }

    res.json({
      success: true,
      message: "Plato eliminado exitosamente",
    })
  }),
)

module.exports = router
