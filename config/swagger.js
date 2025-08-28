const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'FoodieRank API',
    description: 'API para sistema de ranking de restaurantes y platos',
    version: '1.0.0',
    contact: {
      name: 'FoodieRank Team',
      email: 'support@foodierank.com'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.foodierank.com' 
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Servidor de Producción' : 'Servidor de Desarrollo'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Juan Pérez' },
          email: { type: 'string', format: 'email', example: 'juan@email.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Restaurant: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'La Pizzería' },
          description: { type: 'string', example: 'Auténtica pizza italiana' },
          category: { type: 'string', example: 'Italiana' },
          location: {
            type: 'object',
            properties: {
              address: { type: 'string', example: 'Calle 123 #45-67' },
              coordinates: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'Point' },
                  coordinates: { type: 'array', items: { type: 'number' }, example: [-74.0059, 40.7128] }
                }
              }
            }
          },
          image: { type: 'string', example: 'https://example.com/image.jpg' },
          approved: { type: 'boolean', example: true },
          rating: { type: 'number', example: 4.5 },
          reviewCount: { type: 'number', example: 25 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Review: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          restaurantId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          comment: { type: 'string', example: 'Excelente comida y servicio' },
          rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
          likes: { type: 'number', example: 10 },
          dislikes: { type: 'number', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Comida Rápida' },
          description: { type: 'string', example: 'Restaurantes de comida rápida' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
          errors: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  },
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar nuevo usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Juan Pérez' },
                  email: { type: 'string', format: 'email', example: 'juan@email.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Usuario registrado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Usuario registrado exitosamente' },
                    data: { $ref: '#/components/schemas/User' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                  }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'juan@email.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login exitoso' },
                    data: { $ref: '#/components/schemas/User' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                  }
                }
              }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    }
  },
  responses: {
    BadRequest: {
      description: 'Solicitud inválida',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    },
    Unauthorized: {
      description: 'No autorizado',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    },
    Forbidden: {
      description: 'Prohibido',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    },
    NotFound: {
      description: 'No encontrado',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    }
  }
};

module.exports = swaggerDocument;