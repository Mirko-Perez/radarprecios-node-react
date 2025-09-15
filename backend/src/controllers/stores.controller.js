import pool from '../config/db.js';

// Obtener comercios por región
export const getStoresByRegion = async (req, res) => {
  const { region_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM comercios WHERE region_id = $1 ORDER BY store_name',
      [region_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener comercios', error: error.message });
  }
};

// Agregar comercio nuevo
export const addStore = async (req, res) => {
  try {
    const { store_name, region_id, address, co_cli, segmento, ciudad } = req.body;

    // Validación básica
    if (!store_name || !region_id) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    const cleanName = store_name.trim();

    // Verificar si ya existe un comercio con el mismo nombre en la misma región
    const exact = await pool.query(
      "SELECT * FROM comercios WHERE region_id = $1 AND LOWER(store_name) = LOWER($2) AND deleted = false",
      [region_id, cleanName]
    );
    if (exact.rows.length > 0) {
      return res.status(409).json({ message: 'Ya existe un comercio con ese nombre en esta región' });
    }

    // Opcional: buscar nombres similares
    const similar = await pool.query(
      "SELECT * FROM comercios WHERE region_id = $1 AND LOWER(store_name) LIKE LOWER($2) AND deleted = false",
      [region_id, `%${cleanName}%`]
    );
    if (similar.rows.length > 0) {
      return res.status(409).json({
        message: 'Ya existe un comercio con un nombre similar',
        similares: similar.rows
      });
    }

    // Insertar el nuevo comercio
    const result = await pool.query(
      `INSERT INTO comercios
        (store_name, region_id, address, co_cli, segmento, ciudad, deleted)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [cleanName, region_id, address || null, co_cli || null, segmento || null, ciudad || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al agregar comercio:", error);
    return res.status(500).json({ message: 'Error al agregar comercio', error: error.message });
  }
};


/**
 * GET /api/stores
 *
 * Devuelve la lista de comercios junto con el nombre de la región.
 * Hace un JOIN con la tabla `regiones`.
 *
 * Respuesta:
 * {
 *   success: true,
 *   data: [
 *     {
 *       store_id: 1,
 *       store_name: "Mercado Lopez",
 *       region_id: 1,
 *       region_name: "Región Metropolitana",
 *       address: "Av. Central 123",
 *       co_cli: "C001",
 *       segmento: "Retail",
 *       ciudad: "Santiago",
 *       deleted: false
 *     }
 *   ]
 * }
 */
export const listarComercios = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        c.store_id,
        c.store_name,
        c.region_id,
        r.region_name,
        c.address,
        c.segmento,
        c.ciudad,
      FROM comercios c
      LEFT JOIN regiones r ON c.region_id = r.region_id
      WHERE c.deleted = false
      ORDER BY c.store_id ASC
    `);

    return res.json(
      result.rows,
    );
  } catch (error) {
    console.error("Error al listar comercios:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor", error: error.message });
  } finally {
    client.release();
  }
};


// GET /api/stores/:id
export const getStoreById = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT store_id, store_name, region_id
       FROM comercios
       WHERE store_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Comercio no encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener comercio por ID:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};


/**
 * PATCH /api/stores/:id
 * 
 * Actualiza parcialmente un comercio existente.
 * Solo se modificarán los campos que se envíen en el body.
 * 
 * Parámetros de URL:
 *  - id: ID del comercio a actualizar
 * 
 * Body (opcional, cualquiera de estos campos):
 *  - store_name: string, nombre del comercio
 *  - region_id: integer, ID de la región
 *  - address: string, dirección del comercio
 *  - co_cli: string, código cliente
 *  - segmento: string, segmento del comercio
 *  - ciudad: string, ciudad
 *  - deleted: boolean, marca como eliminado o no
 * 
 * Respuestas:
 *  - 200: Comercio actualizado, devuelve el objeto actualizado
 *  - 400: Faltan datos o no se enviaron campos para actualizar
 *  - 404: Comercio no encontrado
 *  - 500: Error interno del servidor
 * 
 * Ejemplo de uso:
 *  PATCH /api/stores/45
 *  Body: { "store_name": "Nuevo Nombre", "ciudad": "Santiago" }
 */
export const updateStore = async (req, res) => {
  const { id } = req.params;
  const { store_name, region_id, address, co_cli, segmento, ciudad, deleted } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Falta el ID del comercio" });
  }

  try {
    // Verificar que el comercio exista
    const existing = await pool.query(
      "SELECT * FROM comercios WHERE store_id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Comercio no encontrado" });
    }

    // Construir dinámicamente la query según los campos que vengan
    const fields = [];
    const values = [];
    let index = 1;

    if (store_name !== undefined) {
      fields.push(`store_name = $${index++}`);
      values.push(store_name.trim());
    }
    if (region_id !== undefined) {
      fields.push(`region_id = $${index++}`);
      values.push(region_id);
    }
    if (address !== undefined) {
      fields.push(`address = $${index++}`);
      values.push(address);
    }
    if (co_cli !== undefined) {
      fields.push(`co_cli = $${index++}`);
      values.push(co_cli);
    }
    if (segmento !== undefined) {
      fields.push(`segmento = $${index++}`);
      values.push(segmento);
    }
    if (ciudad !== undefined) {
      fields.push(`ciudad = $${index++}`);
      values.push(ciudad);
    }
    if (deleted !== undefined) {
      fields.push(`deleted = $${index++}`);
      values.push(deleted);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
    }

    values.push(id); // último valor para el WHERE

    const query = `
      UPDATE comercios
      SET ${fields.join(", ")}
      WHERE store_id = $${index}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar comercio:", error);
    return res.status(500).json({ message: "Error al actualizar comercio", error: error.message });
  }
};


/**
 * DELETE /api/stores/:id
 * 
 * Elimina un comercio de forma lógica (soft delete).
 * Marca el campo `deleted` como true.
 * 
 * Parámetros de URL:
 *  - id: ID del comercio a eliminar
 * 
 * Respuestas:
 *  - 200: Comercio marcado como eliminado
 *  - 404: Comercio no encontrado
 *  - 500: Error interno del servidor
 * 
 * Ejemplo:
 *  DELETE /api/stores/45
 */
export const deleteStore = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Falta el ID del comercio" });
  }

  try {
    // Verificar que el comercio exista
    const existing = await pool.query(
      "SELECT * FROM comercios WHERE store_id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Comercio no encontrado" });
    }

    // Marcar como eliminado
    const result = await pool.query(
      "UPDATE comercios SET deleted = true WHERE store_id = $1 RETURNING *",
      [id]
    );

    return res.json({ message: "Comercio eliminado correctamente", store: result.rows[0] });
  } catch (error) {
    console.error("Error al eliminar comercio:", error);
    return res.status(500).json({ message: "Error al eliminar comercio", error: error.message });
  }
};
