const bcrypt = require("bcrypt")
const User = require("../models/User")

/**
 * Crea un usuario administrador por defecto si no existe
 */
async function createDefaultAdmin() {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@foodierank.com"
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "AdminPassword123!"

    // Verificar si ya existe un administrador
    const existingAdmin = await User.findByEmail(adminEmail)

    if (existingAdmin) {
      console.log("✅ Usuario administrador ya existe")
      return
    }

    const adminData = {
      name: "Administrador",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isActive: true,
      emailVerified: true,
      profile: {
        bio: "Administrador del sistema FoodieRank",
        preferences: {
          cuisineTypes: [],
          dietaryRestrictions: [],
          priceRange: { min: 0, max: 1000 },
        },
      },
    }

    const admin = await User.create(adminData)
    console.log("✅ Usuario administrador creado exitosamente:", admin.email)
  } catch (error) {
    console.error("❌ Error al crear usuario administrador:", error.message)
    throw error
  }
}

module.exports = {
  createDefaultAdmin,
}
