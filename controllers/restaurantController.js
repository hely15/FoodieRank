const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Review = require('../models/Review');
const { asyncHandler, createError } = require('../middlewares/errorHandler');

// Crear nuevo restaurante
const createRestaurant = asyncHandler(async (req, res) => {
  const restaurantData = req.body;

  // Si es usuario regular, el restaurante necesita aprobación
  if (req.user.role !== 'admin') {
    restaurantData.approved = false;
  }

  const restaurant = await Restaurant.create(restaurantData);

  res.status(201).json({
    success: true,
    message: req.user.role === 'admin' 
      ? 'Restaurante creado y aprobado exitosamente'
      : 'Restaurante creado exitosamente. Pendiente de aprobación por un administrador',
    data: restaurant
  });
});

// Obtener todos los restaurantes
const getAllRestaurants = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'rating', 
    sortOrder = 'desc',
    category,
    search,
    minRating,
    approved
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder,
    category,
    search,
    minRating: minRating ? parseFloat(minRating) : undefined,
    approved: approved !== undefined ? approved === 'true' : (req.user?.role === 'admin' ? undefined : true)
  };

  const result = await Restaurant.findAll(options);

  res.json({
    success: true,
    data: result.restaurants,
    pagination: result.pagination
  });
});

// Obtener restaurante por ID
const getRestaurantById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    throw createError(404, 'Restaurante no encontrado');
  }

  // Si no es admin y el restaurante no está aprobado, no permitir acceso
  if (req.user?.role !== 'admin' && !restaurant.approved) {
    throw createError(404, 'Restaurante no encontrado');
  }

  // Obtener reseñas del restaurante
  const reviewsResult = await Review.findByRestaurant(id, { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });

  res.json({
    success: true,
    data: {
      ...restaurant,
      recentReviews: reviewsResult.reviews
    }
  });
});

// Actualizar restaurante
const updateRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Verificar que el restaurante existe
  const existingRestaurant = await Restaurant.findById(id);
  if (!existingRestaurant) {
    throw createError(404, 'Restaurante no encontrado');
  }

  // Solo admin puede aprobar/desaprobar
  if (req.user.role !== 'admin') {
    delete updateData.approved;
  }

  const updatedRestaurant = await Restaurant.updateById(id, updateData);

  res.json({
    success: true,
    message: 'Restaurante actualizado exitosamente',
    data: updatedRestaurant
  });
});

// Eliminar restaurante (solo admin)
const deleteRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el restaurante existe
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    throw createError(404, 'Restaurante no encontrado');
  }

  // Eliminar platos asociados
  await Dish.deleteByRestaurant(id);

  // Eliminar el restaurante
  const deleted = await Restaurant.deleteById(id);
  if (!deleted) {
    throw createError(500, 'Error al eliminar el restaurante');
  }

  res.json({
    success: true,
    message: 'Restaurante y sus platos asociados eliminados exitosamente'
  });
});

// Aprobar restaurante (solo admin)
const approveRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const restaurant = await Restaurant.approve(id);
  if (!restaurant) {
    throw createError(404, 'Restaurante no encontrado');
  }

  res.json({
    success: true,
    message: 'Restaurante aprobado exitosamente',
    data: restaurant
  });
});

// Obtener restaurantes por categoría
const getRestaurantsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'rating', 
    sortOrder = 'desc' 
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  };

  const result = await Restaurant.findByCategory(category, options);

  res.json({
    success: true,
    data: result.restaurants,
    pagination: result.pagination
  });
});

// Obtener ranking de restaurantes
const getRestaurantRanking = asyncHandler(async (req, res) => {
  const { limit = 10, category } = req.query;

  const options = {
    limit: parseInt(limit),
    category
  };

  const ranking = await Restaurant.getRanking(options);

  res.json({
    success: true,
    data: ranking,
    message: `Top ${ranking.length} restaurantes${category ? ` en categoría ${category}` : ''}`
  });
});

// Obtener restaurantes cercanos
const getNearbyRestaurants = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance = 5000, limit = 10 } = req.query;

  if (!longitude || !latitude) {
    throw createError(400, 'Se requieren coordenadas (longitude y latitude)');
  }

  const options = {
    limit: parseInt(limit)
  };

  const nearbyRestaurants = await Restaurant.findNearby(
    parseFloat(longitude), 
    parseFloat(latitude), 
    parseInt(maxDistance),
    options
  );

  res.json({
    success: true,
    data: nearbyRestaurants,
    message: `${nearbyRestaurants.length} restaurantes encontrados en un radio de ${maxDistance/1000}km`
  });
});

// Obtener estadísticas de restaurantes (solo admin)
const getRestaurantStats = asyncHandler(async (req, res) => {
  const stats = await Restaurant.getStats();

  res.json({
    success: true,
    data: stats
  });
});

// Obtener restaurantes pendientes de aprobación (solo admin)
const getPendingRestaurants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    approved: false,
    sortBy: 'createdAt',
    sortOrder: 'asc'
  };

  const result = await Restaurant.findAll(options);

  res.json({
    success: true,
    data: result.restaurants,
    pagination: result.pagination,
    message: `${result.pagination.totalRestaurants} restaurantes pendientes de aprobación`
  });
});

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  approveRestaurant,
  getRestaurantsByCategory,
  getRestaurantRanking,
  getNearbyRestaurants,
  getRestaurantStats,
  getPendingRestaurants
};