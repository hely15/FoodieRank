/**
 * Funciones de ejemplo y utilidades de desarrollo para FoodieRank
 */

/**
 * Datos de ejemplo para testing y desarrollo
 */
const sampleData = {
  // Categorías de ejemplo
  categories: [
    {
      name: "Comida Mexicana",
      description: "Restaurantes especializados en cocina tradicional mexicana",
      icon: "🌮",
      color: "#FF6B35",
    },
    {
      name: "Comida Italiana",
      description: "Auténtica cocina italiana con pasta, pizza y más",
      icon: "🍝",
      color: "#4ECDC4",
    },
    {
      name: "Comida Asiática",
      description: "Sabores orientales: sushi, ramen, pad thai y más",
      icon: "🍜",
      color: "#45B7D1",
    },
    {
      name: "Comida Rápida",
      description: "Hamburguesas, hot dogs y comida para llevar",
      icon: "🍔",
      color: "#FFA07A",
    },
    {
      name: "Postres",
      description: "Dulces, pasteles, helados y repostería",
      icon: "🍰",
      color: "#FFB6C1",
    },
  ],

  // Restaurantes de ejemplo
  restaurants: [
    {
      name: "Tacos El Güero",
      description: "Los mejores tacos al pastor de la ciudad con receta familiar de más de 30 años",
      category: "Comida Mexicana",
      location: {
        address: "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX",
        city: "Ciudad de México",
        coordinates: {
          type: "Point",
          coordinates: [-99.1677, 19.3895],
        },
      },
      priceRange: { min: 15, max: 80 },
      image: "https://example.com/tacos-el-guero.jpg",
    },
    {
      name: "Pizzería Roma",
      description: "Auténtica pizza italiana hecha en horno de leña con ingredientes importados",
      category: "Comida Italiana",
      location: {
        address: "Calle Roma Norte 45, Col. Roma Norte, CDMX",
        city: "Ciudad de México",
        coordinates: {
          type: "Point",
          coordinates: [-99.1625, 19.4126],
        },
      },
      priceRange: { min: 120, max: 350 },
      image: "https://example.com/pizzeria-roma.jpg",
    },
  ],

  // Platos de ejemplo
  dishes: [
    {
      name: "Tacos al Pastor",
      description: "Tacos con carne de cerdo marinada, piña, cebolla y cilantro",
      price: 45,
      category: "Tacos",
      ingredients: ["Carne de cerdo", "Piña", "Cebolla", "Cilantro", "Tortilla"],
      spicyLevel: 2,
      image: "https://example.com/tacos-al-pastor.jpg",
    },
    {
      name: "Pizza Margherita",
      description: "Pizza clásica con salsa de tomate, mozzarella fresca y albahaca",
      price: 180,
      category: "Pizza",
      ingredients: ["Masa de pizza", "Salsa de tomate", "Mozzarella", "Albahaca"],
      spicyLevel: 0,
      image: "https://example.com/pizza-margherita.jpg",
    },
  ],

  // Usuarios de ejemplo
  users: [
    {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
      role: "user",
      profile: {
        bio: "Amante de la buena comida y explorador de nuevos sabores",
        preferences: {
          cuisineTypes: ["Mexicana", "Italiana"],
          dietaryRestrictions: [],
          priceRange: { min: 50, max: 300 },
        },
      },
    },
    {
      name: "María González",
      email: "maria.gonzalez@example.com",
      role: "user",
      profile: {
        bio: "Food blogger y crítica gastronómica",
        preferences: {
          cuisineTypes: ["Asiática", "Francesa"],
          dietaryRestrictions: ["Vegetariana"],
          priceRange: { min: 100, max: 500 },
        },
      },
    },
  ],
}

/**
 * Función para poblar la base de datos con datos de ejemplo
 * @param {Object} db - Instancia de la base de datos
 */
async function seedDatabase(db) {
  try {
    console.log("🌱 Iniciando población de base de datos con datos de ejemplo...")

    // Insertar categorías
    const categoriesResult = await db.collection("categories").insertMany(
      sampleData.categories.map((cat) => ({
        ...cat,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    )
    console.log(`✅ ${categoriesResult.insertedCount} categorías insertadas`)

    // Insertar restaurantes (requiere que las categorías existan)
    const restaurantsResult = await db.collection("restaurants").insertMany(
      sampleData.restaurants.map((rest) => ({
        ...rest,
        approved: true,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    )
    console.log(`✅ ${restaurantsResult.insertedCount} restaurantes insertados`)

    console.log("🎉 Base de datos poblada exitosamente")
  } catch (error) {
    console.error("❌ Error al poblar la base de datos:", error)
    throw error
  }
}

/**
 * Función para limpiar datos de ejemplo de la base de datos
 * @param {Object} db - Instancia de la base de datos
 */
async function cleanSampleData(db) {
  try {
    console.log("🧹 Limpiando datos de ejemplo...")

    await Promise.all([
      db.collection("categories").deleteMany({ name: { $in: sampleData.categories.map((c) => c.name) } }),
      db.collection("restaurants").deleteMany({ name: { $in: sampleData.restaurants.map((r) => r.name) } }),
      db.collection("dishes").deleteMany({ name: { $in: sampleData.dishes.map((d) => d.name) } }),
      db.collection("users").deleteMany({ email: { $in: sampleData.users.map((u) => u.email) } }),
    ])

    console.log("✅ Datos de ejemplo eliminados")
  } catch (error) {
    console.error("❌ Error al limpiar datos de ejemplo:", error)
    throw error
  }
}

/**
 * Genera datos aleatorios para testing
 */
const generators = {
  /**
   * Genera un nombre de restaurante aleatorio
   */
  randomRestaurantName() {
    const prefixes = ["El", "La", "Los", "Las", "Don", "Doña"]
    const names = ["Sabor", "Cocina", "Mesa", "Fogón", "Rincón", "Casa", "Paladar"]
    const suffixes = ["Mexicano", "Italiano", "Gourmet", "Tradicional", "Familiar", "Real"]

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const name = names[Math.floor(Math.random() * names.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

    return `${prefix} ${name} ${suffix}`
  },

  /**
   * Genera coordenadas aleatorias dentro de CDMX
   */
  randomCoordinates() {
    const lat = 19.2 + Math.random() * 0.6 // Entre 19.2 y 19.8
    const lng = -99.3 + Math.random() * 0.4 // Entre -99.3 y -98.9
    return [lng, lat]
  },

  /**
   * Genera un precio aleatorio
   */
  randomPrice(min = 20, max = 500) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },
}

module.exports = {
  sampleData,
  seedDatabase,
  cleanSampleData,
  generators,
}
