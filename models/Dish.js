const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Dish {
  constructor(dishData) {
    this.name = dishData.name;
    this.description = dishData.description;
    this.price = dishData.price;
    this.restaurantId = new ObjectId(dishData.restaurantId);
    this.image = dishData.image || null;
    this.available = dishData.available !== undefined ? dishData.available : true;
    this.createdAt = dishData.createdAt || new Date();
    this.updatedAt = dishData.updatedAt || new Date();
  }

  // Crear un nuevo plato
  static async create(dishData) {
    const db = getDB();
    
    // Verificar que el restaurante exista y esté aprobado
    const restaurant = await db.collection('restaurants').findOne({
      _id: new ObjectId(dishData.restaurantId),
      approved: true
    });

    if (!restaurant) {
      throw new Error('Restaurante no encontrado o no aprobado');
    }

    const dish = new Dish(dishData);
    const result = await db.collection('dishes').insertOne(dish);
    
    return {
      _id: result.insertedId,
      ...dish
    };
  }

  // Buscar plato por ID
  static async findById(id) {
    const db = getDB();
    
    const dish = await db.collection('dishes').aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant',
          pipeline: [
            { $project: { name: 1, category: 1, location: 1 } }
          ]
        }
      },
      {
        $addFields: {
          restaurant: { $arrayElemAt: ['$restaurant', 0] }
        }
      }
    ]).toArray();

    return dish[0] || null;
  }

  // Obtener platos de un restaurante
  static async findByRestaurant(restaurantId, options = {}) {
    const db = getDB();
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc', available } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Construir query
    const query = { restaurantId: new ObjectId(restaurantId) };
    if (available !== undefined) {
      query.available = available;
    }

    const [dishes, total] = await Promise.all([
      db.collection('dishes')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('dishes').countDocuments(query)
    ]);

    return {
      dishes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDishes: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Obtener todos los platos con filtros
  static async findAll(options = {}) {
    const db = getDB();
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'name', 
      sortOrder = 'asc',
      search,
      minPrice,
      maxPrice,
      available = true
    } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Construir query de filtros
    const query = { available };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant',
          pipeline: [
            { $project: { name: 1, category: 1, approved: 1 } }
          ]
        }
      },
      {
        $addFields: {
          restaurant: { $arrayElemAt: ['$restaurant', 0] }
        }
      },
      { $match: { 'restaurant.approved': true } }, // Solo platos de restaurantes aprobados
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ];

    const countPipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $match: { 'restaurant.approved': true } },
      { $count: 'total' }
    ];

    const [dishes, countResult] = await Promise.all([
      db.collection('dishes').aggregate(pipeline).toArray(),
      db.collection('dishes').aggregate(countPipeline).toArray()
    ]);

    const total = countResult[0]?.total || 0;

    return {
      dishes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDishes: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Actualizar plato
  static async updateById(id, updateData) {
    const db = getDB();
    
    updateData.updatedAt = new Date();

    const result = await db.collection('dishes').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Eliminar plato
  static async deleteById(id) {
    const db = getDB();
    const result = await db.collection('dishes').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Cambiar disponibilidad de plato
  static async toggleAvailability(id) {
    const db = getDB();
    
    const dish = await db.collection('dishes').findOne({ _id: new ObjectId(id) });
    if (!dish) {
      throw new Error('Plato no encontrado');
    }

    const result = await db.collection('dishes').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          available: !dish.available,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Buscar platos por nombre
  static async searchByName(searchTerm, options = {}) {
    const db = getDB();
    const { limit = 10 } = options;

    const pipeline = [
      {
        $match: {
          name: { $regex: searchTerm, $options: 'i' },
          available: true
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant',
          pipeline: [
            { $project: { name: 1, category: 1, approved: 1 } }
          ]
        }
      },
      {
        $addFields: {
          restaurant: { $arrayElemAt: ['$restaurant', 0] }
        }
      },
      { $match: { 'restaurant.approved': true } },
      { $limit: limit }
    ];

    return await db.collection('dishes').aggregate(pipeline).toArray();
  }

  // Obtener platos por rango de precio
  static async findByPriceRange(minPrice, maxPrice, options = {}) {
    const db = getDB();
    const { limit = 20, sortBy = 'price', sortOrder = 'asc' } = options;
    
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const pipeline = [
      {
        $match: {
          price: { $gte: minPrice, $lte: maxPrice },
          available: true
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant',
          pipeline: [
            { $project: { name: 1, category: 1, approved: 1 } }
          ]
        }
      },
      {
        $addFields: {
          restaurant: { $arrayElemAt: ['$restaurant', 0] }
        }
      },
      { $match: { 'restaurant.approved': true } },
      { $sort: sort },
      { $limit: limit }
    ];

    return await db.collection('dishes').aggregate(pipeline).toArray();
  }

  // Obtener estadísticas de platos
  static async getStats() {
    const db = getDB();
    
    const stats = await db.collection('dishes').aggregate([
      {
        $group: {
          _id: null,
          totalDishes: { $sum: 1 },
          availableDishes: { $sum: { $cond: ['$available', 1, 0] } },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]).toArray();

    const dishesByRestaurant = await db.collection('dishes').aggregate([
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      {
        $addFields: {
          restaurant: { $arrayElemAt: ['$restaurant', 0] }
        }
      },
      {
        $group: {
          _id: '$restaurant.name',
          dishCount: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { dishCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    return {
      totalDishes: stats[0]?.totalDishes || 0,
      availableDishes: stats[0]?.availableDishes || 0,
      avgPrice: Math.round((stats[0]?.avgPrice || 0) * 100) / 100,
      minPrice: stats[0]?.minPrice || 0,
      maxPrice: stats[0]?.maxPrice || 0,
      topRestaurantsByDishes: dishesByRestaurant
    };
  }

  // Eliminar todos los platos de un restaurante
  static async deleteByRestaurant(restaurantId) {
    const db = getDB();
    const result = await db.collection('dishes').deleteMany({
      restaurantId: new ObjectId(restaurantId)
    });
    return result.deletedCount;
  }
}

module.exports = Dish;