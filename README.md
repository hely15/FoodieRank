# FoodieRank API 🍽️

Una API REST completa para gestionar restaurantes, reseñas, platos y categorías. Construida con Node.js, Express y MongoDB.

## 🚀 Configuración Inicial

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB (local o MongoDB Atlas)
- npm o yarn

### Instalación
````bash
# Clonar el repositorio
git clone <repository-url>
cd FoodieRank

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
````

### Variables de Entorno (.env)
````env
# Puerto del servidor
PORT=3000

# Configuración de MongoDB
MONGODB_URI=mongodb://localhost:27017/foodierank
MONGODB_DB_NAME=foodierank

# JWT Secret para autenticación
JWT_SECRET=tu_super_secreto_jwt_aqui_muy_seguro_123456

# Configuración de entorno
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin por defecto (se crea automáticamente)
DEFAULT_ADMIN_EMAIL=admin@foodierank.com
DEFAULT_ADMIN_PASSWORD=AdminPassword123!
````

### Ejecutar el Servidor
````bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
````

El servidor estará disponible en: `http://localhost:3000`

## 📚 Documentación de la API

### URL Base
Todos los endpoints están prefijados con: `http://localhost:3000/api/v1/`

### Autenticación
La mayoría de endpoints requieren autenticación Bearer Token:
````
Authorization: Bearer <tu_jwt_token>
````

---

## 🔐 Autenticación (`/api/v1/auth`)

### Registro de Usuario
````http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
````

### Iniciar Sesión
````http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
````

**Respuesta:**
````json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "user"
    },
    "token": "jwt_token_aqui"
  }
}
````

### Obtener Perfil
````http
GET /api/v1/auth/profile
Authorization: Bearer <token>
````

### Actualizar Perfil
````http
PUT /api/v1/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Juan Carlos Pérez",
  "bio": "Amante de la buena comida"
}
````

### Cambiar Contraseña
````http
PUT /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
````

---

## 🏷️ Categorías (`/api/v1/categories`)

### Listar Categorías
````http
GET /api/v1/categories?page=1&limit=10&search=pizza
````

### Obtener Categorías Activas
````http
GET /api/v1/categories/active
````

### Crear Categoría (Admin)
````http
POST /api/v1/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Pizza",
  "description": "Deliciosas pizzas artesanales",
  "icon": "🍕",
  "color": "#FF6B6B"
}
````

### Obtener Categoría por ID
````http
GET /api/v1/categories/{categoryId}
````

### Actualizar Categoría (Admin)
````http
PUT /api/v1/categories/{categoryId}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Pizza Gourmet",
  "description": "Pizzas gourmet con ingredientes premium"
}
````

---

## 🍽️ Restaurantes (`/api/v1/restaurants`)

### Listar Restaurantes
````http
GET /api/v1/restaurants?page=1&limit=10&category=pizza&city=Madrid&rating=4
````

### Buscar Restaurantes Cercanos
````http
GET /api/v1/restaurants/nearby?lat=40.4168&lng=-3.7038&radius=5000
````

### Crear Restaurante
````http
POST /api/v1/restaurants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "La Bella Napoli",
  "description": "Auténtica pizza italiana",
  "address": "Calle Mayor 123, Madrid",
  "phone": "+34 91 123 4567",
  "email": "info@bellanapoli.com",
  "website": "https://bellanapoli.com",
  "categories": ["category_id_1", "category_id_2"],
  "location": {
    "type": "Point",
    "coordinates": [-3.7038, 40.4168]
  },
  "openingHours": {
    "monday": { "open": "12:00", "close": "23:00" },
    "tuesday": { "open": "12:00", "close": "23:00" }
  },
  "priceRange": "$$",
  "images": ["url_imagen_1", "url_imagen_2"]
}
````

### Obtener Restaurante por ID
````http
GET /api/v1/restaurants/{restaurantId}
````

### Aprobar Restaurante (Admin)
````http
PATCH /api/v1/restaurants/{restaurantId}/approve
Authorization: Bearer <admin_token>
````

---

## 🍕 Platos (`/api/v1/dishes`)

### Listar Platos
````http
GET /api/v1/dishes?page=1&limit=10&restaurant={restaurantId}&category=pizza&minPrice=10&maxPrice=25
````

### Obtener Platos de un Restaurante
````http
GET /api/v1/dishes/restaurant/{restaurantId}
````

### Crear Plato
````http
POST /api/v1/dishes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Pizza Margherita",
  "description": "Pizza clásica con tomate, mozzarella y albahaca",
  "price": 12.50,
  "category": "category_id",
  "restaurant": "restaurant_id",
  "ingredients": ["tomate", "mozzarella", "albahaca"],
  "allergens": ["gluten", "lactosa"],
  "images": ["url_imagen_1"],
  "available": true,
  "preparationTime": 15
}
````

### Obtener Plato por ID
````http
GET /api/v1/dishes/{dishId}
````

### Actualizar Plato
````http
PUT /api/v1/dishes/{dishId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Pizza Margherita Premium",
  "price": 15.00,
  "description": "Pizza con ingredientes premium"
}
````

---

## ⭐ Reseñas (`/api/v1/reviews`)

### Listar Reseñas
````http
GET /api/v1/reviews?page=1&limit=10&restaurant={restaurantId}&rating=5&sortBy=createdAt
````

### Obtener Reseñas de un Restaurante
````http
GET /api/v1/reviews/restaurant/{restaurantId}?page=1&limit=10
````

### Crear Reseña
````http
POST /api/v1/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurant": "restaurant_id",
  "rating": 5,
  "comment": "Excelente comida y servicio. La pizza estaba deliciosa y el ambiente muy acogedor.",
  "visitDate": "2024-01-15T19:30:00.000Z",
  "images": ["url_imagen_1", "url_imagen_2"]
}
````

### Obtener Reseña por ID
````http
GET /api/v1/reviews/{reviewId}
````

### Actualizar Reseña
````http
PUT /api/v1/reviews/{reviewId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Muy buena comida, aunque el servicio podría mejorar."
}
````

### Dar Like a una Reseña
````http
POST /api/v1/reviews/{reviewId}/like
Authorization: Bearer <token>
````

### Dar Dislike a una Reseña
````http
POST /api/v1/reviews/{reviewId}/dislike
Authorization: Bearer <token>
````

### Eliminar Reseña
````http
DELETE /api/v1/reviews/{reviewId}
Authorization: Bearer <token>
````

---

## 👥 Usuarios (`/api/v1/users`) - Solo Admin

### Listar Usuarios
````http
GET /api/v1/users?page=1&limit=10&role=user&search=juan
Authorization: Bearer <admin_token>
````

### Obtener Usuario por ID
````http
GET /api/v1/users/{userId}
Authorization: Bearer <token>
````

### Actualizar Usuario
````http
PUT /api/v1/users/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Juan Carlos",
  "role": "admin"
}
````

---

## 🔧 Endpoints del Sistema

### Health Check
````http
GET /api/v1/health
````

### Información de la API
````http
GET /
````

### Documentación Swagger
````http
GET /api/docs
````

---

## 📝 Códigos de Respuesta

- `200` - OK
- `201` - Creado
- `400` - Solicitud incorrecta
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `409` - Conflicto
- `422` - Entidad no procesable
- `429` - Demasiadas solicitudes
- `500` - Error interno del servidor

## 🛡️ Seguridad

- **Rate Limiting**: 100 solicitudes por 15 minutos
- **CORS**: Configurado para desarrollo y producción
- **Helmet**: Headers de seguridad
- **JWT**: Autenticación con tokens
- **Validación**: Validación de datos con express-validator
- **Sanitización**: Limpieza de datos de entrada

## 🚀 Ejemplos de Uso

### Flujo Completo: Crear Restaurante y Reseña

1. **Registrarse**
````bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María García",
    "email": "maria@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
````

2. **Iniciar Sesión**
````bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "password": "password123"
  }'
````

3. **Crear Restaurante**
````bash
curl -X POST http://localhost:3000/api/v1/restaurants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Pizzería Don Giovanni",
    "description": "La mejor pizza de la ciudad",
    "address": "Calle de la Pizza 456, Madrid",
    "phone": "+34 91 987 6543"
  }'
````

4. **Crear Reseña**
````bash
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "restaurant": "RESTAURANT_ID",
    "rating": 5,
    "comment": "¡Increíble! La mejor pizza que he probado."
  }'
````

## 🐛 Solución de Problemas

### Error de Conexión a MongoDB
- Verificar que MongoDB esté ejecutándose
- Comprobar la URL de conexión en `.env`
- Verificar permisos de red si usas MongoDB Atlas

### Error de Autenticación
- Verificar que el token JWT sea válido
- Comprobar que el header `Authorization` esté presente
- Verificar que el token no haya expirado

### Error 429 (Rate Limit)
- Esperar 15 minutos antes de hacer más solicitudes
- Implementar lógica de retry en tu cliente

## Creador 
>Hely Santiago Diaz Almeida 
