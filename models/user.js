const { getDB } = require('../config/database');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

class User {
  constructor(userData) {
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password;
    this.role = userData.role || 'user';
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
  }

  // Crear un nuevo usuario
  static async create(userData) {
    const db = getDB();
    
    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    const user = new User({
      ...userData,
      password: hashedPassword
    });

    const result = await db.collection('users').insertOne(user);
    
    // Retornar usuario sin contraseña
    const { password, ...userWithoutPassword } = user;
    return {
      _id: result.insertedId,
      ...userWithoutPassword
    };
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const db = getDB();
    return await db.collection('users').findOne({ email });
  }

  // Buscar usuario por ID
  static async findById(id) {
    const db = getDB();
    return await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Obtener todos los usuarios (solo admin)
  static async findAll(options = {}) {
    const db = getDB();
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      db.collection('users')
        .find({}, { projection: { password: 0 } })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('users').countDocuments()
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Actualizar usuario
  static async updateById(id, updateData) {
    const db = getDB();
    
    // Si se actualiza la contraseña, hashearla
    if (updateData.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    updateData.updatedAt = new Date();

    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { 
        returnDocument: 'after',
        projection: { password: 0 }
      }
    );

    return result.value;
  }

  // Eliminar usuario
  static async deleteById(id) {
    const db = getDB();
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Cambiar rol de usuario
  static async changeRole(id, newRole) {
    const db = getDB();
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          role: newRole,
          updatedAt: new Date()
        }
      },
      { 
        returnDocument: 'after',
        projection: { password: 0 }
      }
    );

    return result.value;
  }

  // Obtener estadísticas de usuarios
  static async getStats() {
    const db = getDB();
    
    const stats = await db.collection('users').aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const totalUsers = await db.collection('users').countDocuments();
    
    return {
      totalUsers,
      byRole: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }

  // Buscar usuarios por criterios
  static async search(criteria, options = {}) {
    const db = getDB();
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Construir query de búsqueda
    const query = {};
    if (criteria.name) {
      query.name = { $regex: criteria.name, $options: 'i' };
    }
    if (criteria.email) {
      query.email = { $regex: criteria.email, $options: 'i' };
    }
    if (criteria.role) {
      query.role = criteria.role;
    }

    const [users, total] = await Promise.all([
      db.collection('users')
        .find(query, { projection: { password: 0 } })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('users').countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = User;