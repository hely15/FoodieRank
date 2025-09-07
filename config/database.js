const { MongoClient } = require("mongodb")

let db = null
let client = null

const connectDB = async () => {
  try {
    if (db) {
      return db
    }

    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/foodierank"
    const dbName = process.env.MONGODB_DB_NAME || "foodierank"

    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    await client.connect()
    db = client.db(dbName)

    // Crear índices necesarios
    await createIndexes()

    console.log(`Conectado a MongoDB: ${dbName}`)
    return db
  } catch (error) {
    console.error("Error conectando a MongoDB:", error)
    throw error
  }
}

const getDB = () => {
  if (!db) {
    throw new Error("Base de datos no inicializada. Llama a connectDB() primero.")
  }
  return db
}

const closeDB = async () => {
  if (client) {
    await client.close()
    db = null
    client = null
    console.log("Conexión a MongoDB cerrada")
  }
}

const createIndexes = async () => {
  try {
    const database = getDB()

    // Índices para usuarios
    await database.collection("users").createIndex({ email: 1 }, { unique: true })
    await database.collection("users").createIndex({ role: 1 })

    // Índices para restaurantes
    await database.collection("restaurants").createIndex({ name: 1 }, { unique: true })
    await database.collection("restaurants").createIndex({ category: 1 })
    await database.collection("restaurants").createIndex({ approved: 1 })
    await database.collection("restaurants").createIndex({ location: "2dsphere" })

    // Índices para platos
    await database.collection("dishes").createIndex({ restaurantId: 1 })
    await database.collection("dishes").createIndex({ name: 1, restaurantId: 1 }, { unique: true })

    // Índices para reseñas
    await database.collection("reviews").createIndex({ restaurantId: 1 })
    await database.collection("reviews").createIndex({ userId: 1 })

    // Index for dish reviews (when dishId exists)
    await database.collection("reviews").createIndex(
      { userId: 1, restaurantId: 1, dishId: 1 },
      {
        unique: true,
        partialFilterExpression: { dishId: { $exists: true, $type: "objectId" } },
      },
    )

    // Index for restaurant-only reviews (when dishId doesn't exist)
    await database.collection("reviews").createIndex(
      { userId: 1, restaurantId: 1 },
      {
        unique: true,
        partialFilterExpression: { dishId: { $exists: false } },
      },
    )

    await database.collection("reviews").createIndex({ createdAt: -1 })

    // Índices para categorías
    await database.collection("categories").createIndex({ name: 1 }, { unique: true })

    // Índices para likes/dislikes de reseñas
    await database.collection("reviewReactions").createIndex({ reviewId: 1, userId: 1 }, { unique: true })
    await database.collection("reviewReactions").createIndex({ reviewId: 1 })

    console.log("Índices de base de datos creados correctamente")
  } catch (error) {
    console.error("Error creando índices:", error)
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
}
