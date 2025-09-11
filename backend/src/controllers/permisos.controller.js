// permisos.controller.ts
import pool from '../config/db.js';


/**
 * GET /api/permisos
 * Devuelve la lista completa de permisos
 * Solo accesible por administradores
 */
export const listarPermisos = async (req, res) => {
  const client = await pool.connect();

  try {
    // Verificar si el usuario tiene permisos de admin

    // if (req.user?.role !== "ADMIN" ) {
    //   return res.status(403).json({ success: false, message: "Acceso denegado" });
    // }

    const result = await client.query(`
      SELECT permission_id, permission_name
      FROM permisos
      ORDER BY permission_id ASC
    `);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error al listar permisos:", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};


/**
 * GET /api/usuarios/:id/permisos
 * Devuelve los permisos de un usuario específico
 * Solo accesible por administradores
 */
export const listarPermisosUsuario = async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;

  try {
    // Verificar si el usuario actual es admin
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Acceso denegado" });
    }

    const result = await client.query(
      `
      SELECT 
        p.permission_id,
        p.permission_name
      FROM usuario_permiso up
      INNER JOIN permisos p ON up.permission_id = p.permission_id
      WHERE up.user_id = $1
      `,
      [id]
    );

    return res.json({
      success: true,
      userId: id,
      permisos: result.rows,
    });
  } catch (error) {
    console.error("Error al obtener permisos del usuario:", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};
