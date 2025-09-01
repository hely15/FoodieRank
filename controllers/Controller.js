const User = require('../models/User');
const { asyncHandler, createError } = require('../middlewares/errorHandler');

// Obtener todos los usuarios (solo admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  };

  const result = await User.findAll(options);

  res.json({
    success: true,
    data: result.users,
    pagination: result.pagination
  });
});

// Obtener usuario por ID (solo admin)
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw createError(404, 'Usuario no encontrado');
  }

  res.json({
    success: true,
    data: user
  });
});

// Actualizar usuario (solo admin)
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remover campos que no se deben actualizar desde esta ruta
  delete updateData.password;
  delete updateData.role;

  // Si se actualiza el email, verificar que no esté en uso
  if (updateData.email) {
    const existingUser = await User.findByEmail(updateData.email);
    if (existingUser && existingUser._id.toString() !== id) {
      throw createError(400, 'El email ya está en uso');
    }
  }

  const updatedUser = await User.updateById(id, updateData);
  if (!updatedUser) {
    throw createError(404, 'Usuario no encontrado');
  }

  res.json({
    success: true,
    message: 'Usuario actualizado exitosamente',
    data: updatedUser
  });
});

// Eliminar usuario (solo admin)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // No permitir que el admin se elimine a sí mismo
  if (id === req.user._id.toString()) {
    throw createError(400, 'No puedes eliminar tu propia cuenta');
  }

  const deleted = await User.deleteById(id);
  if (!deleted) {
    throw createError(404, 'Usuario no encontrado');
  }

  res.json({
    success: true,
    message: 'Usuario eliminado exitosamente'
  });
});

// Cambiar rol de usuario (solo admin)
const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validar que el rol sea válido
  if (!['user', 'admin'].includes(role)) {
    throw createError(400, 'Rol inválido. Debe ser "user" o "admin"');
  }

  // No permitir cambiar el propio rol
  if (id === req.user._id.toString()) {
    throw createError(400, 'No puedes cambiar tu propio rol');
  }

  const updatedUser = await User.changeRole(id, role);
  if (!updatedUser) {
    throw createError(404, 'Usuario no encontrado');
  }

  res.json({
    success: true,
    message: `Rol del usuario cambiado a ${role} exitosamente`,
    data: updatedUser
  });
});

// Buscar usuarios (solo admin)
const searchUsers = asyncHandler(async (req, res) => {
  const { 
    name, 
    email, 
    role, 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  const criteria = {};
  if (name) criteria.name = name;
  if (email) criteria.email = email;
  if (role) criteria.role = role;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  };

  const result = await User.search(criteria, options);

  res.json({
    success: true,
    data: result.users,
    pagination: result.pagination
  });
});

// Obtener estadísticas de usuarios (solo admin)
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.getStats();

  res.json({
    success: true,
    data: stats
  });
});

// Resetear contraseña de usuario (solo admin)
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw createError(400, 'La nueva contraseña debe tener al menos 6 caracteres');
  }

  const updatedUser = await User.updateById(id, { password: newPassword });
  if (!updatedUser) {
    throw createError(404, 'Usuario no encontrado');
  }

  res.json({
    success: true,
    message: 'Contraseña reseteda exitosamente'
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  searchUsers,
  getUserStats,
  resetUserPassword
};