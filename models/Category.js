const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Category {
  constructor(categoryData) {
    this.name = categoryData.name;
    this.description = categoryData.description;
    this.createdAt = categoryData.createdAt || new Date();
    this.updatedAt = categoryData.updatedAt || new Date();
  }

  // Crear una nueva categoría
  static async create(categoryData) {
    const db = getDB();
    
    const category = new Category(categoryData);
    const result = await db.collection('categories').insertOne(category);
    
    return {
      _id: result.insertedId,
      ...category
    };
  }

  // Buscar categoría por ID
  static async findById(id) {
    const db = getDB();
    return await db.collection('categories').findOne({ _id: new ObjectId(id) });
  }

  // Buscar categoría por nombre
  static async findByName(name) {
    const db = getDB();
    return await db.collection('categories').findOne({ name });
  }

  // Obtener todas las categorías
  static async findAll(options = {}) {
    const db = getDB();
    const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc' } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const pipeline = [
      {
        $lookup: {
          from: 'restaurants',
          localField: 'name',
          foreignField: 'category',
          as: 'restaurants'
        }
      },
      {
        $addFields: {
          restaurantCount: { $size: '$restaurants' }
        }
      },
      {
        $project: {
          restaurants: 0 // No incluir los restaurantes completos, solo el conteo
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ];

    const [categories, total] = await Promise.all([
      db.collection('categories').aggregate(pipeline).toArray(),
      db.collection('categories').countDocuments()
    ]);

    return {
      categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCategories: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Obtener categorías con estadísticas
  static async findAllWithStats() {
    const db = getDB();
    
    const pipeline = [
      {
        $lookup: {
          from: 'restaurants',
          let: { categoryName: '$name' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$category', '$$categoryName'] },
                approved: true
              }
            }
          ],
          as: 'approvedRestaurants'
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          let: { categoryName: '$name' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$category', '$$categoryName'] }
              }
            }
          ],
          as: 'allRestaurants'
        }
      },
      {
        $addFields: {
          restaurantCount: { $size: '$allRestaurants' },
          approvedRestaurantCount: { $size: '$approvedRestaurants' },
          avgRating: { $avg: '$approvedRestaurants.rating' }
        }
      },
      {
        $project: {
          allRestaurants: 0,
          approvedRestaurants: 0
        }
      },
      { $sort: { restaurantCount: -1 } }
    ];

    return await db.collection('categories').aggregate(pipeline).toArray();
  }

  // Actualizar categoría
  static async updateById(id, updateData) {
    const db = getDB();
    
    updateData.updatedAt = new Date();

    const result = await db.collection('categories').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Eliminar categoría
  static async deleteById(id) {
    const db = getDB();
    
    // Verificar que no hay restaurantes usando esta categoría
    const category = await db.collection('categories').findOne({ _id: new ObjectId(id) });
    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    const restaurantsUsingCategory = await db.collection('restaurants').countDocuments({
      category: category.name
    });

    if (restaurantsUsingCategory > 0) {
      throw new Error(`No se puede eliminar la categoría. ${restaurantsUsingCategory} restaurante(s) la están usando`);
    }

    const result = await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Buscar categorías por nombre (búsqueda parcial)
  static async searchByName(searchTerm, options = {}) {
    const db = getDB();
    const { limit = 10 } = options;

    return await db.collection('categories')
      .find({
        name: { $regex: searchTerm, $options: 'i' }
      })
      .limit(limit)
      .sort({ name: 1 })
      .toArray();
  }

  // Obtener las categorías más populares
  static async getPopular(limit = 10) {
    const db = getDB();
    
    const pipeline = [
      {
        $lookup: {
          from: 'restaurants',
          let: { categoryName: '$name' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$category', '$$categoryName'] },
                approved: true
              }
            }
          ],
          as: 'restaurants'
        }
      },
      {
        $addFields: {
          restaurantCount: { $size: '$restaurants' },
          totalReviews: { $sum: '$restaurants.reviewCount' },
          avgRating: { $avg: '$restaurants.rating' }
        }
      },
      {
        $match: {
          restaurantCount: { $gt: 0 }
        }
      },
      {
        $sort: {
          restaurantCount: -1,
          totalReviews: -1,
          avgRating: -1
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          restaurants: 0
        }
      }
    ];

    return await db.collection('categories').aggregate(pipeline).toArray();
  }

  // Obtener estadísticas generales de categorías
  static async getStats() {
    const db = getDB();
    
    const totalCategories = await db.collection('categories').countDocuments();
    
    const categoryStats = await db.collection('categories').aggregate([
      {
        $lookup: {
          from: 'restaurants',
          let: { categoryName: '$name' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$category', '$$categoryName'] }
              }
            }
          ],
          as: 'restaurants'
        }
      },
      {
        $addFields: {
          restaurantCount: { $size: '$restaurants' }
        }
      },
      {
        $group: {
          _id: null,
          categoriesWithRestaurants: {
            $sum: { $cond: [{ $gt: ['$restaurantCount', 0] }, 1, 0] }
          },
          categoriesWithoutRestaurants: {
            $sum: { $cond: [{ $eq: ['$restaurantCount', 0] }, 1, 0] }
          },
          avgRestaurantsPerCategory: { $avg: '$restaurantCount' }
        }
      }
    ]).toArray();

    return {
      totalCategories,
      categoriesWithRestaurants: categoryStats[0]?.categoriesWithRestaurants || 0,
      categoriesWithoutRestaurants: categoryStats[0]?.categoriesWithoutRestaurants || 0,
      avgRestaurantsPerCategory: Math.round((categoryStats[0]?.avgRestaurantsPerCategory || 0) * 100) / 100
    };
  }

  // Crear categorías por defecto
  static async createDefaultCategories() {
    const db = getDB();
    
    const defaultCategories = [
      { name: 'Comida Rápida', description: 'Restaurantes de comida rápida y casual' },
      { name: 'Gourmet', description: 'Restaurantes de alta cocina y experiencias gastronómicas' },
      { name: 'Vegetariano', description: 'Restaurantes especializados en comida vegetariana y vegana' },
      { name: 'Sushi', description: 'Restaurantes de comida japonesa y sushi' },
      { name: 'Italiana', description: 'Restaurantes de comida italiana tradicional' },
      { name: 'Mexicana', description: 'Restaurantes de comida mexicana y tex-mex' },
      { name: 'China', description: 'Restaurantes de comida china tradicional' },
      { name: 'Parrilla', description: 'Restaurantes especializados en carnes a la parrilla' },
      { name: 'Mariscos', description: 'Restaurantes especializados en mariscos y pescados' },
      { name: 'Cafetería', description: 'Cafeterías, panaderías y lugares para desayuno' }
    ];

    const createdCategories = [];
    
    for (const categoryData of defaultCategories) {
      try {
        const existing = await db.collection('categories').findOne({ name: categoryData.name });
        if (!existing) {
          const category = new Category(categoryData);
          const result = await db.collection('categories').insertOne(category);
          createdCategories.push({
            _id: result.insertedId,
            ...category
          });
        }
      } catch (error) {
        console.error(`Error creando categoría ${categoryData.name}:`, error);
      }
    }

    return createdCategories;
  }
}

module.exports = Category;