import pool from '../config/db.js';

// Ensure table exists (idempotent)
(async function ensureAgendasTable() {
  const sql = `
  CREATE TABLE IF NOT EXISTS agendas (
    agenda_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    region_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    assignee_user_id INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    justification TEXT,
    attempted_store_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_region FOREIGN KEY (region_id) REFERENCES regiones(region_id),
    CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES comercios(store_id),
    CONSTRAINT fk_assignee FOREIGN KEY (assignee_user_id) REFERENCES usuarios(user_id)
  );
  ALTER TABLE agendas ADD COLUMN IF NOT EXISTS attempted_store_id INTEGER;
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_attempted_store' AND table_name = 'agendas'
    ) THEN
      ALTER TABLE agendas ADD CONSTRAINT fk_attempted_store FOREIGN KEY (attempted_store_id) REFERENCES comercios(store_id);
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS idx_agendas_date ON agendas(date);
  CREATE INDEX IF NOT EXISTS idx_agendas_assignee ON agendas(assignee_user_id);
  `;
  try {
    await pool.query(sql);
  } catch (e) {
    console.error('No se pudo asegurar la tabla agendas:', e.message);
  }
})();

export const createAgenda = async (req, res) => {
  const { title, date, region_id, store_id, assignee_user_id, notes } = req.body;

  if (!title || !date || !region_id || !store_id || !assignee_user_id) {
    return res.status(400).json({ success: false, message: 'Campos requeridos: title, date, region_id, store_id, assignee_user_id' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO agendas (title, date, region_id, store_id, assignee_user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, date, region_id, store_id, assignee_user_id, notes || null]
    );
    res.status(201).json({ success: true, message: 'Agenda creada', data: result.rows[0] });
  } catch (error) {
    console.error('Error creando agenda:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

export const getAssignedWeek = async (req, res) => {
  const user_id = req.user.userId;
  try {
    // Compute current week Monday..Sunday in SQL
    const result = await pool.query(
      `SELECT a.*, r.region_name, s.store_name
       FROM agendas a
       JOIN regiones r ON a.region_id = r.region_id
       JOIN comercios s ON a.store_id = s.store_id
       WHERE a.assignee_user_id = $1
         AND a.date BETWEEN (DATE_TRUNC('week', CURRENT_DATE)) AND (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 day')
       ORDER BY a.date ASC, a.created_at ASC`,
      [user_id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error obteniendo agenda semanal:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

export const bulkCreateAgendas = async (req, res) => {
  const { assignee_user_id, items } = req.body;
  if (!assignee_user_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Parámetros inválidos: assignee_user_id e items[] requeridos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const it of items) {
      const { title, date, region_id, store_id, notes } = it || {};
      if (!title || !date || !region_id || !store_id) {
        continue; // skip incomplete
      }
      const ins = await client.query(
        `INSERT INTO agendas (title, date, region_id, store_id, assignee_user_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [title, date, region_id, store_id, assignee_user_id, notes || null]
      );
      inserted.push(ins.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Agendas creadas', data: inserted });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en creación masiva de agendas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  } finally {
    client.release();
  }
};

export const listAgendas = async (req, res) => {
  const { date, assignee_user_id, region_id, store_id, status } = req.query;
  const clauses = [];
  const params = [];
  let i = 1;
  if (date) { clauses.push(`a.date = $${i++}`); params.push(date); }
  if (assignee_user_id) { clauses.push(`a.assignee_user_id = $${i++}`); params.push(assignee_user_id); }
  if (region_id) { clauses.push(`a.region_id = $${i++}`); params.push(region_id); }
  if (store_id) { clauses.push(`a.store_id = $${i++}`); params.push(store_id); }
  if (status) { clauses.push(`a.status = $${i++}`); params.push(status); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  try {
    const result = await pool.query(
      `SELECT a.*, r.region_name, s.store_name
       FROM agendas a
       JOIN regiones r ON a.region_id = r.region_id
       JOIN comercios s ON a.store_id = s.store_id
       ${where}
       ORDER BY a.date DESC, a.created_at DESC`,
      params
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error listando agendas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

export const getAssignedToday = async (req, res) => {
  const user_id = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT a.*, r.region_name, s.store_name
       FROM agendas a
       JOIN regiones r ON a.region_id = r.region_id
       JOIN comercios s ON a.store_id = s.store_id
       WHERE a.assignee_user_id = $1 AND a.date = CURRENT_DATE AND a.status IN ('pendiente','iniciado')
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sin asignación para hoy' });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo agenda del día:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

export const updateAgenda = async (req, res) => {
  const { id } = req.params;
  const { title, date, region_id, store_id, assignee_user_id, notes, status } = req.body;

  const fields = [];
  const params = [];
  let i = 1;
  if (title !== undefined) { fields.push(`title = $${i++}`); params.push(title); }
  if (date !== undefined) { fields.push(`date = $${i++}`); params.push(date); }
  if (region_id !== undefined) { fields.push(`region_id = $${i++}`); params.push(region_id); }
  if (store_id !== undefined) { fields.push(`store_id = $${i++}`); params.push(store_id); }
  if (assignee_user_id !== undefined) { fields.push(`assignee_user_id = $${i++}`); params.push(assignee_user_id); }
  if (notes !== undefined) { fields.push(`notes = $${i++}`); params.push(notes); }
  if (status !== undefined) { fields.push(`status = $${i++}`); params.push(status); }
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  if (fields.length === 0) return res.status(400).json({ success: false, message: 'Sin cambios' });

  try {
    const result = await pool.query(
      `UPDATE agendas SET ${fields.join(', ')} WHERE agenda_id = $${i} RETURNING *`,
      [...params, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Agenda no encontrada' });
    res.status(200).json({ success: true, message: 'Agenda actualizada', data: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando agenda:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

export const justifyNoExecution = async (req, res) => {
  const { id } = req.params;
  const { justification, attempted_store_id } = req.body;
  if (!justification?.trim()) return res.status(400).json({ success: false, message: 'Justificación requerida' });
  try {
    const result = await pool.query(
      `UPDATE agendas 
       SET status = 'no_ejecutado', justification = $1, attempted_store_id = COALESCE($2, attempted_store_id), updated_at = CURRENT_TIMESTAMP 
       WHERE agenda_id = $3 RETURNING *`,
      [justification.trim(), attempted_store_id || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Agenda no encontrada' });
    res.status(200).json({ success: true, message: 'Agenda justificada como no ejecutada', data: result.rows[0] });
  } catch (error) {
    console.error('Error justificando agenda:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

export const deleteAgenda = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM agendas WHERE agenda_id = $1 RETURNING agenda_id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Agenda no encontrada' });
    res.status(200).json({ success: true, message: 'Agenda eliminada', data: { agenda_id: id } });
  } catch (error) {
    console.error('Error eliminando agenda:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};
