const express = require("express")
const { requireAuth } = require("../middlewares/auth")
const { validateReview, validateUpdateReview } = require("../middlewares/validators")
const { asyncHandler } = require("../middlewares/errorHandler")
const Review = require("../models/Review")
const Dish = require("../models/Dish") // Import Dish model here

const router = express.Router()

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Obtener lista de reseñas
 *     tags: [Reviews]
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
 *         name: dish
 *         schema:
 *           type: string
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de reseñas obtenida exitosamente
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, restaurant, dish, user } = req.query

    const filter = {}
    if (restaurant) filter.restaurant = restaurant
    if (dish) filter.dish = dish
    if (user) filter.user = user

    const reviews = await Review.findAll(filter, {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
    })

    res.json({
      success: true,
      data: reviews,
      message: "Reseñas obtenidas exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/reviews/restaurant/{restaurantId}:
 *   get:
 *     summary: Obtener reseñas de un restaurante específico
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: restaurantId
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
 *         description: Reseñas del restaurante obtenidas exitosamente
 */
router.get(
  "/restaurant/:restaurantId",
  asyncHandler(async (req, res) => {
    const { restaurantId } = req.params
    const { page = 1, limit = 10 } = req.query

    const reviews = await Review.findByRestaurant(restaurantId, {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
    })

    res.json({
      success: true,
      data: reviews,
      message: "Reseñas del restaurante obtenidas exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Crear nueva reseña
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurant
 *               - rating
 *               - comment
 *             properties:
 *               restaurant:
 *                 type: string
 *               dish:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reseña creada exitosamente
 */
router.post(
  "/",
  requireAuth,
  validateReview,
  asyncHandler(async (req, res) => {
    console.log("[v0] req.user:", req.user)
    console.log("[v0] req.body:", req.body)
    console.log("[v0] req.user.id:", req.user?.id)
    console.log("[v0] req.user._id:", req.user?._id)

    let restaurantId

    if (req.body.dish) {
      // If reviewing a dish, get the restaurant ID from the dish
      const dish = await Dish.findById(req.body.dish)
      if (!dish) {
        return res.status(404).json({
          success: false,
          message: "Plato no encontrado",
        })
      }
      restaurantId = dish.restaurantId
    } else if (req.body.restaurant) {
      // If reviewing a restaurant directly
      restaurantId = req.body.restaurant
    } else {
      return res.status(400).json({
        success: false,
        message: "Debe especificar un restaurante o plato para la reseña",
      })
    }

    const reviewData = {
      ...req.body,
      userId: req.user._id || req.user.id, // Try both _id and id fields
      restaurantId: restaurantId, // Use the resolved restaurant ID
    }

    // Remove the original fields to avoid confusion
    delete reviewData.restaurant
    delete reviewData.user

    console.log("[v0] Final reviewData:", reviewData)

    const review = await Review.create(reviewData)

    res.status(201).json({
      success: true,
      data: review,
      message: "Reseña creada exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Obtener reseña por ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reseña obtenida exitosamente
 *       404:
 *         description: Reseña no encontrada
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const review = await Review.findById(id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Reseña no encontrada",
      })
    }

    res.json({
      success: true,
      data: review,
      message: "Reseña obtenida exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Actualizar reseña
 *     tags: [Reviews]
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
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reseña actualizada exitosamente
 */
router.put(
  "/:id",
  requireAuth,
  validateUpdateReview,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Verificar que el usuario sea el autor de la reseña
    const review = await Review.findById(id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Reseña no encontrada",
      })
    }

    if (review.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar esta reseña",
      })
    }

    const updatedReview = await Review.updateById(id, req.body, req.user.id)

    res.json({
      success: true,
      data: updatedReview,
      message: "Reseña actualizada exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/reviews/{id}/like:
 *   post:
 *     summary: Dar like a una reseña
 *     tags: [Reviews]
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
 *         description: Like agregado exitosamente
 */
router.post(
  "/:id/like",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const review = await Review.addReaction(id, req.user.id, "like")

    res.json({
      success: true,
      data: review,
      message: "Like agregado exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/reviews/{id}/dislike:
 *   post:
 *     summary: Dar dislike a una reseña
 *     tags: [Reviews]
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
 *         description: Dislike agregado exitosamente
 */
router.post(
  "/:id/dislike",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const review = await Review.addReaction(id, req.user.id, "dislike")

    res.json({
      success: true,
      data: review,
      message: "Dislike agregado exitosamente",
    })
  }),
)

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Eliminar reseña
 *     tags: [Reviews]
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
 *         description: Reseña eliminada exitosamente
 */
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Verificar que el usuario sea el autor de la reseña o admin
    const review = await Review.findById(id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Reseña no encontrada",
      })
    }

    if (review.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar esta reseña",
      })
    }

    await Review.deleteById(id, req.user.id)

    res.json({
      success: true,
      message: "Reseña eliminada exitosamente",
    })
  }),
)

module.exports = router
