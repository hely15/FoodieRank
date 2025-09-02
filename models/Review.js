const { getDB } = require("../config/database")
const { ObjectId } = require("mongodb")
const Restaurant = require("./Restaurant")

class Review {
  constructor(reviewData) {
    this.userId = new ObjectId(reviewData.userId)
    this.restaurantId = new ObjectId(reviewData.restaurantId)
    this.comment = reviewData.comment
    this.rating = reviewData.rating
    this.likes = 0
    this.dislikes = 0
    this.createdAt = reviewData.createdAt || new Date()
    this.updatedAt = reviewData.updatedAt || new Date()
  }

  // Crear una nueva reseña con transacción
  static async create(reviewData) {
    const db = getDB()

    console.log("[v0] Creating review with data:", {
      userId: reviewData.userId,
      restaurantId: reviewData.restaurantId,
      rating: reviewData.rating,
    })

    // Verificar que no exista una reseña del mismo usuario para el mismo restaurante
    const existingReview = await db.collection("reviews").findOne({
      userId: new ObjectId(reviewData.userId),
      restaurantId: new ObjectId(reviewData.restaurantId),
    })

    if (existingReview) {
      throw new Error("Ya has reseñado este restaurante")
    }

    // Verificar que el restaurante exista y esté aprobado
    const restaurant = await db.collection("restaurants").findOne({
      _id: new ObjectId(reviewData.restaurantId),
      approved: true,
    })

    console.log(
      "[v0] Restaurant lookup result:",
      restaurant ? "Found" : "Not found",
      "for ID:",
      reviewData.restaurantId,
    )

    if (!restaurant) {
      const unapprovedRestaurant = await db.collection("restaurants").findOne({
        _id: new ObjectId(reviewData.restaurantId),
      })

      if (unapprovedRestaurant) {
        console.log("[v0] Restaurant exists but is not approved:", unapprovedRestaurant.approved)
        throw new Error("El restaurante no está aprobado para recibir reseñas")
      } else {
        console.log("[v0] Restaurant does not exist in database")
        throw new Error("Restaurante no encontrado")
      }
    }

    // Crear la reseña
    const review = new Review(reviewData)
    const result = await db.collection("reviews").insertOne(review)

    // Actualizar rating del restaurante
    await Restaurant.updateRating(reviewData.restaurantId)

    return {
      _id: result.insertedId,
      ...review,
    }
  }

  // Buscar reseña por ID
  static async findById(id) {
    const db = getDB()

    const review = await db
      .collection("reviews")
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { name: 1, email: 1 } }],
          },
        },
        {
          $lookup: {
            from: "restaurants",
            localField: "restaurantId",
            foreignField: "_id",
            as: "restaurant",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$user", 0] },
            restaurant: { $arrayElemAt: ["$restaurant", 0] },
          },
        },
      ])
      .toArray()

    return review[0] || null
  }

  // Obtener reseñas de un restaurante
  static async findByRestaurant(restaurantId, options = {}) {
    const db = getDB()
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options

    const skip = (page - 1) * limit
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    const pipeline = [
      { $match: { restaurantId: new ObjectId(restaurantId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]

    const [reviews, total] = await Promise.all([
      db.collection("reviews").aggregate(pipeline).toArray(),
      db.collection("reviews").countDocuments({ restaurantId: new ObjectId(restaurantId) }),
    ])

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }
  }

  // Obtener reseñas de un usuario
  static async findByUser(userId, options = {}) {
    const db = getDB()
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options

    const skip = (page - 1) * limit
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    const pipeline = [
      { $match: { userId: new ObjectId(userId) } },
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurantId",
          foreignField: "_id",
          as: "restaurant",
          pipeline: [{ $project: { name: 1, image: 1, category: 1 } }],
        },
      },
      {
        $addFields: {
          restaurant: { $arrayElemAt: ["$restaurant", 0] },
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]

    const [reviews, total] = await Promise.all([
      db.collection("reviews").aggregate(pipeline).toArray(),
      db.collection("reviews").countDocuments({ userId: new ObjectId(userId) }),
    ])

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }
  }

  // Actualizar reseña
  static async updateById(id, updateData, userId) {
    const db = getDB()

    // Verificar que la reseña pertenezca al usuario
    const existingReview = await db.collection("reviews").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    })

    if (!existingReview) {
      throw new Error("Reseña no encontrada o no tienes permisos para editarla")
    }

    updateData.updatedAt = new Date()

    const result = await db
      .collection("reviews")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    // Si se actualizó el rating, recalcular rating del restaurante
    if (updateData.rating) {
      await Restaurant.updateRating(existingReview.restaurantId)
    }

    return result.value
  }

  // Eliminar reseña
  static async deleteById(id, userId) {
    const db = getDB()

    // Obtener la reseña para verificar permisos y obtener restaurantId
    const review = await db.collection("reviews").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    })

    if (!review) {
      throw new Error("Reseña no encontrada o no tienes permisos para eliminarla")
    }

    // Eliminar reacciones asociadas a la reseña
    await db.collection("reviewReactions").deleteMany({
      reviewId: new ObjectId(id),
    })

    // Eliminar la reseña
    const result = await db.collection("reviews").deleteOne({
      _id: new ObjectId(id),
    })

    // Actualizar rating del restaurante
    await Restaurant.updateRating(review.restaurantId)

    return result.deletedCount > 0
  }

  // Dar like o dislike a una reseña
  static async addReaction(reviewId, userId, reactionType) {
    const db = getDB()

    // Verificar que la reseña existe y no es del mismo usuario
    const review = await db.collection("reviews").findOne({
      _id: new ObjectId(reviewId),
    })

    if (!review) {
      throw new Error("Reseña no encontrada")
    }

    if (review.userId.toString() === userId.toString()) {
      throw new Error("No puedes reaccionar a tu propia reseña")
    }

    // Verificar si ya existe una reacción del usuario
    const existingReaction = await db.collection("reviewReactions").findOne({
      reviewId: new ObjectId(reviewId),
      userId: new ObjectId(userId),
    })

    let likesChange = 0
    let dislikesChange = 0

    if (existingReaction) {
      // Si la reacción es la misma, eliminarla
      if (existingReaction.type === reactionType) {
        await db.collection("reviewReactions").deleteOne({
          reviewId: new ObjectId(reviewId),
          userId: new ObjectId(userId),
        })

        if (reactionType === "like") {
          likesChange = -1
        } else {
          dislikesChange = -1
        }
      } else {
        // Cambiar el tipo de reacción
        await db.collection("reviewReactions").updateOne(
          {
            reviewId: new ObjectId(reviewId),
            userId: new ObjectId(userId),
          },
          {
            $set: {
              type: reactionType,
              updatedAt: new Date(),
            },
          },
        )

        if (reactionType === "like") {
          likesChange = 1
          dislikesChange = -1
        } else {
          likesChange = -1
          dislikesChange = 1
        }
      }
    } else {
      // Crear nueva reacción
      await db.collection("reviewReactions").insertOne({
        reviewId: new ObjectId(reviewId),
        userId: new ObjectId(userId),
        type: reactionType,
        createdAt: new Date(),
      })

      if (reactionType === "like") {
        likesChange = 1
      } else {
        dislikesChange = 1
      }
    }

    // Actualizar contadores en la reseña
    const updatedReview = await db.collection("reviews").findOneAndUpdate(
      {
        _id: new ObjectId(reviewId),
      },
      {
        $inc: {
          likes: likesChange,
          dislikes: dislikesChange,
        },
      },
      {
        returnDocument: "after",
      },
    )

    return updatedReview.value
  }

  // Obtener reacción de un usuario a una reseña
  static async getUserReaction(reviewId, userId) {
    const db = getDB()

    return await db.collection("reviewReactions").findOne({
      reviewId: new ObjectId(reviewId),
      userId: new ObjectId(userId),
    })
  }

  // Obtener todas las reseñas (admin)
  static async findAll(options = {}) {
    const db = getDB()
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options

    const skip = (page - 1) * limit
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurantId",
          foreignField: "_id",
          as: "restaurant",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
          restaurant: { $arrayElemAt: ["$restaurant", 0] },
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]

    const [reviews, total] = await Promise.all([
      db.collection("reviews").aggregate(pipeline).toArray(),
      db.collection("reviews").countDocuments(),
    ])

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }
  }

  // Obtener estadísticas de reseñas
  static async getStats() {
    const db = getDB()

    const stats = await db
      .collection("reviews")
      .aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            avgRating: { $avg: "$rating" },
            totalLikes: { $sum: "$likes" },
            totalDislikes: { $sum: "$dislikes" },
          },
        },
      ])
      .toArray()

    const ratingDistribution = await db
      .collection("reviews")
      .aggregate([
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    return {
      totalReviews: stats[0]?.totalReviews || 0,
      avgRating: Math.round((stats[0]?.avgRating || 0) * 10) / 10,
      totalLikes: stats[0]?.totalLikes || 0,
      totalDislikes: stats[0]?.totalDislikes || 0,
      ratingDistribution: ratingDistribution.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {}),
    }
  }
}

module.exports = Review
