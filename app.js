const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const swaggerUi = require("swagger-ui-express")
require("dotenv").config()

const { connectDB } = require("./config/database")
const { errorHandler } = require("./middlewares/errorHandler")
const { createDefaultAdmin } = require("./utils/defaultData")
const swaggerDocument = require("./config/swagger")

// Importar rutas
const authRoutes = require("./routers/auth")
const userRoutes = require("./routers/users")
const restaurantRoutes = require("./routers/restaurants")
const dishRoutes = require("./routers/dishes")
const reviewRoutes = require("./routers/reviews")
const categoryRoutes = require("./routers/categories")

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares de seguridad
app.use(helmet())
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://tu-frontend-domain.com"]
        : ["http://localhost:3001", "http://127.0.0.1:3001"],
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de requests por IP
  message: {
    error: "Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// Middlewares generales
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Documentación con Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Rutas de la API
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/restaurants", restaurantRoutes)
app.use("/api/v1/dishes", dishRoutes)
app.use("/api/v1/reviews", reviewRoutes)
app.use("/api/v1/categories", categoryRoutes)

// Ruta de salud del servidor
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "FoodieRank API funcionando correctamente",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
})

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido a FoodieRank API",
    version: "1.0.0",
    documentation: "/api/docs",
  })
})

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  })
})

// Middleware de manejo de errores
app.use(errorHandler)

// Inicializar servidor
async function startServer() {
  try {
    // Conectar a la base de datos
    await connectDB()
    console.log("✅ Conectado a MongoDB")

    // Crear usuario administrador por defecto
    await createDefaultAdmin()

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`)
      console.log(`📚 Documentación disponible en http://localhost:${PORT}/api/docs`)
    })
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error)
    process.exit(1)
  }
}

// Manejo de errores no capturados
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err)
  process.exit(1)
})

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
  process.exit(1)
})

startServer()

module.exports = app
