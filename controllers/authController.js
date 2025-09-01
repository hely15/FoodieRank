const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { asyncHandler, createError } = require('../middlewares/errorHandler');

// Registrar nuevo usuario
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Verificar si el usuario ya existe
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw createError(400, 'El email ya está registrado');
  }

  // Crear nuevo usuario
  const user = await User.create({ name, email, password });
  
  // Generar token JWT
  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: user,
    token
  });
});

// Iniciar sesión
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Buscar usuario por email (incluyendo password para verificación)
  const user = await User.findByEmail(email);
  if (!user) {
    throw createError(401, 'Credenciales inválidas');
  }

  // Verificar contraseña
  const isPasswordValid = await User.verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw createError(401, 'Credenciales inválidas');
  }

  // Remover password del objeto usuario
  const { password: _, ...userWithoutPassword } = user;

  // Generar token JWT
  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: 'Login exitoso',
    data: userWithoutPassword,
    token
  });
});

// Obtener perfil del usuario actual
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw createError(404, 'Usuario no encontrado');
  }

  res.json({
    success: true,
    data: user
  });
});

// Actualizar perfil del usuario actual
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user._id;

  // Si se actualiza el email, verificar que no esté en uso
  if (email && email !== req.user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      throw createError(400, 'El email ya está en uso');
    }
  }

  const updatedUser = await User.updateById(userId, { name, email });
  if (!updatedUser) {
    throw createError(404, 'Usuario no encontrado');
  }

  res.json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: updatedUser
  });
});

// Cambiar contraseña
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  // Obtener usuario actual con contraseña
  const user = await User.findByEmail(req.user.email);
  if (!user) {
    throw createError(404, 'Usuario no encontrado');
  }

  // Verificar contraseña actual
  const isCurrentPasswordValid = await User.verifyPassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw createError(400, 'La contraseña actual es incorrecta');
  }

  // Actualizar contraseña
  await User.updateById(userId, { password: newPassword });

  res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente'
  });
});

// Refresh token (renovar token)
const refreshToken = asyncHandler(async (req, res) => {
  const user = req.user; // El usuario ya está disponible por el middleware de autenticación

  // Generar nuevo token
  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: 'Token renovado exitosamente',
    data: user,
    token
  });
});

// Logout (en este caso solo envía respuesta, el token se maneja en el frontend)
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout
};