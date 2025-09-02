const { getDB } = require("../config/database")
const { ObjectId } = require("mongodb")

class Restaurant {
  constructor(restaurantData) {
    this.name = restaurantData.name
    this.description = restaurantData.description
    this.category = restaurantData.category || ""

    this.address = this._processAddress(restaurantData.address)

    this.contact = {
      phone: restaurantData.contact?.phone || "",
      email: restaurantData.contact?.email || "",
      website: restaurantData.contact?.website || "",
    }

    this.cuisine = Array.isArray(restaurantData.cuisine) ? restaurantData.cuisine : []

    this.priceRange = restaurantData.priceRange || ""

    this.features = Array.isArray(restaurantData.features) ? restaurantData.features : []

    this.location = {
      type: "Point",
      coordinates: this._extractCoordinates(restaurantData),
    }

    this.image = restaurantData.image || null
    this.approved = restaurantData.approved !== undefined ? restaurantData.approved : true
    this.rating = 0
    this.reviewCount = 0
    this.createdAt = restaurantData.createdAt || new Date()
    this.updatedAt = restaurantData.updatedAt || new Date()
  }

  _processAddress(addressData) {
    if (!addressData) return ""

    if (typeof addressData === "string") {
      return addressData
    }

    // If it's an object, construct address string
    const parts = []
    if (addressData.street) parts.push(addressData.street)
    if (addressData.city) parts.push(addressData.city)
    if (addressData.state) parts.push(addressData.state)
    if (addressData.zipCode) parts.push(addressData.zipCode)
    if (addressData.country) parts.push(addressData.country)

    return parts.join(", ")
  }

  _extractCoordinates(restaurantData) {
    // First try to get coordinates from location field
    if (restaurantData.location?.coordinates) {
      return this._parseCoordinates(restaurantData.location.coordinates)
    }

    // Then try to get from address coordinates
    if (restaurantData.address?.coordinates) {
      return this._parseCoordinates(restaurantData.address.coordinates)
    }

    // If no coordinates provided, return default
    return [0, 0]
  }

  _parseCoordinates(coordinatesData) {
    // Handle different coordinate formats
    if (!coordinatesData) {
      return [0, 0] // Default coordinates
    }

    // If coordinates are already an array [lng, lat]
    if (Array.isArray(coordinatesData)) {
      return coordinatesData.length >= 2 ? coordinatesData : [0, 0]
    }

    // If coordinates are nested in a coordinates property
    if (coordinatesData.coordinates && Array.isArray(coordinatesData.coordinates)) {
      return coordinatesData.coordinates.length >= 2 ? coordinatesData.coordinates : [0, 0]
    }

    // If coordinates are provided as separate lng/lat properties
    if (typeof coordinatesData.lng !== "undefined" && typeof coordinatesData.lat !== "undefined") {
      return [coordinatesData.lng, coordinatesData.lat]
    }

    // If coordinates are provided as separate longitude/latitude properties
    if (typeof coordinatesData.longitude !== "undefined" && typeof coordinatesData.latitude !== "undefined") {
      return [coordinatesData.longitude, coordinatesData.latitude]
    }

    return [0, 0] // Default fallback
  }

  // Crear un nuevo restaurante
  static async create(restaurantData) {
    const db = getDB()

    const restaurant = new Restaurant(restaurantData)
    const result = await db.collection("restaurants").insertOne(restaurant)

    return {
      _id: result.insertedId,
      ...restaurant,
    }
  }

  // Buscar restaurante por ID
  static async findById(id) {
    const db = getDB()
    const restaurant = await db.collection("restaurants").findOne({ _id: new ObjectId(id) })

    if (restaurant) {
      // Agregar información adicional
      const dishes = await db
        .collection("dishes")
        .find({ restaurantId: new ObjectId(id) })
        .toArray()
      restaurant.dishes = dishes
    }

    return restaurant
  }

  // Obtener todos los restaurantes con filtros
  static async findAll(options = {}) {
    const db = getDB()
    const {
      page = 1,
      limit = 10,
      sortBy = "rating",
      sortOrder = "desc",
      category,
      search,
      minRating,
      approved = true,
    } = options

    const skip = (page - 1) * limit
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    // Construir query de filtros
    const query = { approved }

    if (category) {
      query.category = category
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    if (minRating) {
      query.rating = { $gte: Number.parseFloat(minRating) }
    }

    const [restaurants, total] = await Promise.all([
      db.collection("restaurants").find(query).sort(sort).skip(skip).limit(limit).toArray(),
      db.collection("restaurants").countDocuments(query),
    ])

    return {
      restaurants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRestaurants: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }
  }

  // Actualizar restaurante
  static async updateById(id, updateData) {
    const db = getDB()

    updateData.updatedAt = new Date()

    const result = await db
      .collection("restaurants")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    return result.value
  }

  // Eliminar restaurante
  static async deleteById(id) {
    const db = getDB()
    const result = await db.collection("restaurants").deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
  }

  // Aprobar restaurante
  static async approve(id) {
    const db = getDB()

    const result = await db.collection("restaurants").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          approved: true,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    return result.value
  }

  // Actualizar rating del restaurante
  static async updateRating(id) {
    const db = getDB()

    const reviewStats = await db
      .collection("reviews")
      .aggregate([
        { $match: { restaurantId: new ObjectId(id) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const rating = reviewStats.length > 0 ? Math.round(reviewStats[0].avgRating * 10) / 10 : 0
    const reviewCount = reviewStats.length > 0 ? reviewStats[0].count : 0

    await db.collection("restaurants").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          rating,
          reviewCount,
          updatedAt: new Date(),
        },
      },
    )

    return { rating, reviewCount }
  }

  // Obtener restaurantes por categoría
  static async findByCategory(category, options = {}) {
    const db = getDB()
    const { page = 1, limit = 10, sortBy = "rating", sortOrder = "desc" } = options

    const skip = (page - 1) * limit
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    const [restaurants, total] = await Promise.all([
      db.collection("restaurants").find({ category, approved: true }).sort(sort).skip(skip).limit(limit).toArray(),
      db.collection("restaurants").countDocuments({ category, approved: true }),
    ])

    return {
      restaurants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRestaurants: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }
  }

  // Obtener ranking de restaurantes
  static async getRanking(options = {}) {
    const db = getDB()
    const { limit = 10, category } = options

    const matchStage = { approved: true }
    if (category) {
      matchStage.category = category
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "restaurantId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          // Calcular score ponderado basado en rating, cantidad de reseñas y recencia
          weightedScore: {
            $cond: {
              if: { $gt: ["$reviewCount", 0] },
              then: {
                $add: [
                  { $multiply: ["$rating", 0.7] }, // 70% peso al rating
                  { $multiply: [{ $min: [{ $divide: ["$reviewCount", 10] }, 1] }, 0.3] }, // 30% peso a cantidad de reseñas (máximo 1)
                ],
              },
              else: 0,
            },
          },
        },
      },
      { $sort: { weightedScore: -1, reviewCount: -1, rating: -1 } },
      { $limit: limit },
      {
        $project: {
          reviews: 0, // No incluir las reseñas completas en el resultado
        },
      },
    ]

    return await db.collection("restaurants").aggregate(pipeline).toArray()
  }

  // Obtener restaurantes cercanos
  static async findNearby(longitude, latitude, maxDistance = 5000, options = {}) {
    const db = getDB()
    const { limit = 10 } = options

    return await db
      .collection("restaurants")
      .find({
        approved: true,
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      })
      .limit(limit)
      .toArray()
  }

  // Obtener estadísticas de restaurantes
  static async getStats() {
    const db = getDB()

    const stats = await db
      .collection("restaurants")
      .aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            approved: { $sum: { $cond: ["$approved", 1, 0] } },
            pending: { $sum: { $cond: ["$approved", 0, 1] } },
            avgRating: { $avg: "$rating" },
          },
        },
      ])
      .toArray()

    const categoryStats = await db
      .collection("restaurants")
      .aggregate([
        { $match: { approved: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()

    return {
      total: stats[0]?.total || 0,
      approved: stats[0]?.approved || 0,
      pending: stats[0]?.pending || 0,
      avgRating: Math.round((stats[0]?.avgRating || 0) * 10) / 10,
      byCategory: categoryStats,
    }
  }
}

module.exports = Restaurant
