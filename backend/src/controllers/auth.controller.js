import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Clave secreta para firmar los tokens (debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';
const JWT_EXPIRES_IN = '24h'; // El token expira en 24 horas

const login = async (req, res) => {
  const { username, password } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Buscar el usuario por nombre de usuario y verificar que esté activo
    const userResult = await client.query(
      'SELECT user_id, username, password_hash, is_active FROM usuarios WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const user = userResult.rows[0];
    
    // Verificar que el usuario esté activo
    if (!user.is_active) {
      await client.query('ROLLBACK');
      return res.status(401).json({ message: 'Usuario inactivo. Por favor, contacte al administrador.' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      await client.query('ROLLBACK');
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    
    // Obtener permisos del usuario
    const permissionsResult = await client.query(
      `SELECT p.permission_name 
       FROM permisos p
       JOIN usuario_permiso up ON p.permission_id = up.permission_id
       WHERE up.user_id = $1`,
      [user.user_id]
    );
    
    const permissions = permissionsResult.rows.map(row => row.permission_name);
    
    // Obtener el permission_id del usuario (asumiendo que está en la tabla usuarios)
    const permissionResult = await client.query(
      'SELECT permission_id FROM usuario_permiso WHERE user_id = $1',
      [user.user_id]
    );
    
    const permissionId = permissionResult.rows[0]?.permission_id || null;

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.user_id,
        username: user.username,
        permissions: permissions,
        permissionId: permissionId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await client.query('COMMIT');
    
    res.json({ 
      message: 'Login exitoso',
      token: token,
      user: { 
        id: user.user_id, 
        username: user.username,
        permissions: permissions,
        permissionId: permissionId
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  } finally {
    client.release();
  }
};

export default { login };
