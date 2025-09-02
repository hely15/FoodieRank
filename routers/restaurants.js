const express = require("express")
const { requireAuth, requireRole } = require("../middlewares/auth")
const { validateRestaurant } = require("../middlewares/validators")
const { asyncHandler } = require("../middlewares/errorHandler")
const Restaurant = require("../models/Restaurant")

const router = express.Router()

/**
 * @swagger
 * /api/v1/restaurants:
 *   get:
 *     summary: Obtener lista de restaurantes
 *     tags: [Restaurants]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: approved
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de restaurantes obtenida exitosamente
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, city, approved = true } = req.query

    const filter = { approved: approved === "true" }
    if (category) filter.category = category
    if (city) filter["location.city"] = new RegExp(city, "i")

    const restaurants = await Restaurant.findAll(filter, {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
    })

    res.json({
      success: true,
      data: restaurants,
      message: "Restaurantes obtenidos exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/restaurants/nearby:
 *   get:
 *     summary: Buscar restaurantes cercanos
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5000
 *     responses:
 *       200:
 *         description: Restaurantes cercanos encontrados
 */
router.get(
  "/nearby",
  asyncHandler(async (req, res) => {
    const { lat, lng, radius = 5000 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitud y longitud son requeridas",
      })
    }

    const restaurants = await Restaurant.findNearby(
      Number.parseFloat(lat),
      Number.parseFloat(lng),
      Number.parseInt(radius),
    )

    res.json({
      success: true,
      data: restaurants,
      message: "Restaurantes cercanos encontrados",
    })
  }),
)

/**
 * @swagger
 * /api/v1/restaurants:
 *   post:
 *     summary: Crear nuevo restaurante
 *     tags: [Restaurants]
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
 *               - location
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Restaurante creado exitosamente
 */
router.post(
  "/",
  requireAuth,
  validateRestaurant,
  asyncHandler(async (req, res) => {
    const restaurantData = {
      ...req.body,
      createdBy: req.user.id,
      approved: req.user.role === "admin", // Auto-aprobar si es admin
    }

    const restaurant = await Restaurant.create(restaurantData)

    res.status(201).json({
      success: true,
      data: restaurant,
      message: "Restaurante creado exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/restaurants/{id}:
 *   get:
 *     summary: Obtener restaurante por ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurante obtenido exitosamente
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurante no encontrado",
      })
    }

    res.json({
      success: true,
      data: restaurant,
      message: "Restaurante obtenido exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/restaurants/{id}/approve:
 *   patch:
 *     summary: Aprobar restaurante (solo admin)
 *     tags: [Restaurants]
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
 *         description: Restaurante aprobado exitosamente
 */
router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const restaurant = await Restaurant.approve(id)

    res.json({
      success: true,
      data: restaurant,
      message: "Restaurante aprobado exitosamente",
    })
  }),
)

module.exports = router
