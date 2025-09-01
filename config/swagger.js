const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "FoodieRank API",
    description: "API para sistema de ranking de restaurantes y platos",
    version: "1.0.0",
    contact: {
      name: "FoodieRank Team",
      email: "support@foodierank.com",
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === "production" ? "https://api.foodierank.com" : "http://localhost:3000",
      description: process.env.NODE_ENV === "production" ? "Servidor de Producción" : "Servidor de Desarrollo",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "507f1f77bcf86cd799439011" },
          name: { type: "string", example: "Juan Pérez" },
          email: { type: "string", format: "email", example: "juan@email.com" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          phone: { type: "string", example: "3187471767" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Restaurant: {
        type: "object",
        properties: {
          _id: { type: "string", example: "507f1f77bcf86cd799439011" },
          name: { type: "string", example: "La Pizzería" },
          description: { type: "string", example: "Auténtica pizza italiana" },
          category: { type: "string", example: "Italiana" },
          location: {
            type: "object",
            properties: {
              address: { type: "string", example: "Calle 123 #45-67" },
              coordinates: {
                type: "object",
                properties: {
                  type: { type: "string", example: "Point" },
                  coordinates: { type: "array", items: { type: "number" }, example: [-74.0059, 40.7128] },
                },
              },
            },
          },
          image: { type: "string", example: "https://example.com/image.jpg" },
          approved: { type: "boolean", example: true },
          rating: { type: "number", example: 4.5 },
          reviewCount: { type: "number", example: 25 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Review: {
        type: "object",
        properties: {
          _id: { type: "string", example: "507f1f77bcf86cd799439011" },
          userId: { type: "string", example: "507f1f77bcf86cd799439011" },
          restaurantId: { type: "string", example: "507f1f77bcf86cd799439011" },
          comment: { type: "string", example: "Excelente comida y servicio" },
          rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
          likes: { type: "number", example: 10 },
          dislikes: { type: "number", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string", example: "507f1f77bcf86cd799439011" },
          name: { type: "string", example: "Comida Rápida" },
          description: { type: "string", example: "Restaurantes de comida rápida" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error message" },
          errors: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/register": {
      post: {
        tags: ["Autenticación"],
        summary: "Registrar nuevo usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Juan Pérez" },
                  email: { type: "string", format: "email", example: "juan@email.com" },
                  password: { type: "string", minLength: 6, example: "password123" },
                  phone: { type: "string", example: "3187471767" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Usuario registrado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Usuario registrado exitosamente" },
                    data: { $ref: "#/components/schemas/User" },
                    token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "juan@email.com" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login exitoso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login exitoso" },
                    data: { $ref: "#/components/schemas/User" },
                    token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/v1/auth/profile": {
      get: {
        tags: ["Autenticación"],
        summary: "Obtener perfil del usuario actual",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Perfil del usuario",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      put: {
        tags: ["Autenticación"],
        summary: "Actualizar perfil del usuario actual",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Juan Carlos Pérez" },
                  email: { type: "string", format: "email", example: "juancarlos@email.com" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Perfil actualizado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Perfil actualizado exitosamente" },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/v1/restaurants": {
      get: {
        tags: ["Restaurantes"],
        summary: "Obtener lista de restaurantes",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Lista de restaurantes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Restaurant" },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        pages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Restaurantes"],
        summary: "Crear nuevo restaurante",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "description", "category", "location"],
                properties: {
                  name: { type: "string", example: "La Pizzería" },
                  description: { type: "string", example: "Auténtica pizza italiana" },
                  category: { type: "string", example: "Italiana" },
                  location: {
                    type: "object",
                    properties: {
                      address: { type: "string", example: "Calle 123 #45-67" },
                      coordinates: {
                        type: "object",
                        properties: {
                          type: { type: "string", example: "Point" },
                          coordinates: { type: "array", items: { type: "number" }, example: [-74.0059, 40.7128] },
                        },
                      },
                    },
                  },
                  image: { type: "string", example: "https://example.com/image.jpg" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Restaurante creado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Restaurante creado exitosamente" },
                    data: { $ref: "#/components/schemas/Restaurant" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/v1/restaurants/{id}": {
      get: {
        tags: ["Restaurantes"],
        summary: "Obtener restaurante por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Restaurante encontrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Restaurant" },
                  },
                },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Restaurantes"],
        summary: "Actualizar restaurante",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  location: { type: "object" },
                  image: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Restaurante actualizado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Restaurante actualizado exitosamente" },
                    data: { $ref: "#/components/schemas/Restaurant" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Restaurantes"],
        summary: "Eliminar restaurante",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Restaurante eliminado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Restaurante eliminado exitosamente" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/v1/reviews": {
      get: {
        tags: ["Reseñas"],
        summary: "Obtener lista de reseñas",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "restaurant", in: "query", schema: { type: "string" } },
          { name: "user", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Lista de reseñas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Review" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Reseñas"],
        summary: "Crear nueva reseña",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["restaurantId", "comment", "rating"],
                properties: {
                  restaurantId: { type: "string", example: "507f1f77bcf86cd799439011" },
                  comment: { type: "string", example: "Excelente comida y servicio" },
                  rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Reseña creada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reseña creada exitosamente" },
                    data: { $ref: "#/components/schemas/Review" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/v1/reviews/{id}": {
      get: {
        tags: ["Reseñas"],
        summary: "Obtener reseña por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Reseña encontrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Review" },
                  },
                },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Reseñas"],
        summary: "Actualizar reseña",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  comment: { type: "string" },
                  rating: { type: "number", minimum: 1, maximum: 5 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Reseña actualizada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reseña actualizada exitosamente" },
                    data: { $ref: "#/components/schemas/Review" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Reseñas"],
        summary: "Eliminar reseña",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Reseña eliminada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reseña eliminada exitosamente" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/v1/categories": {
      get: {
        tags: ["Categorías"],
        summary: "Obtener lista de categorías",
        responses: {
          200: {
            description: "Lista de categorías",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Category" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Categorías"],
        summary: "Crear nueva categoría",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "description"],
                properties: {
                  name: { type: "string", example: "Comida Rápida" },
                  description: { type: "string", example: "Restaurantes de comida rápida" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Categoría creada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Categoría creada exitosamente" },
                    data: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/v1/users": {
      get: {
        tags: ["Usuarios"],
        summary: "Obtener lista de usuarios (Solo Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: {
            description: "Lista de usuarios",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/v1/dishes": {
      get: {
        tags: ["Platos"],
        summary: "Obtener lista de platos",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "restaurant", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Lista de platos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          _id: { type: "string" },
                          name: { type: "string" },
                          description: { type: "string" },
                          price: { type: "number" },
                          category: { type: "string" },
                          restaurant: { type: "string" },
                          image: { type: "string" },
                          available: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Platos"],
        summary: "Crear nuevo plato",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "description", "price", "restaurant"],
                properties: {
                  name: { type: "string", example: "Pizza Margherita" },
                  description: { type: "string", example: "Pizza clásica con tomate, mozzarella y albahaca" },
                  price: { type: "number", example: 25000 },
                  category: { type: "string", example: "Pizza" },
                  restaurant: { type: "string", example: "507f1f77bcf86cd799439011" },
                  image: { type: "string", example: "https://example.com/pizza.jpg" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Plato creado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Plato creado exitosamente" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
  responses: {
    BadRequest: {
      description: "Solicitud inválida",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
        },
      },
    },
    Unauthorized: {
      description: "No autorizado",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
        },
      },
    },
    Forbidden: {
      description: "Prohibido",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
        },
      },
    },
    NotFound: {
      description: "No encontrado",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
        },
      },
    },
  },
}

module.exports = swaggerDocument
