// routes/export.js
import express from 'express';
import ExcelJS from 'exceljs';
import pool from '../config/db.js';

/**
 * Si debe crear un nuevo exportable, agrege el nuevo tipo con el siguiente formato 
 * CONFIG: define cada tipo exportable aquí.
 * - filename: nombre base del archivo
 * - sheetName: nombre de la hoja
 * - columns: columnas para Excel (header, key, width)
 * - queryBuilder: función que recibe req.query y devuelve { text, values }
 */
const exportsConfig = {
  // Usuarios del sistema con su permiso principal
  usuarios: {
    filename: 'usuarios',
    sheetName: 'Usuarios',
    columns: [
      { header: 'ID', key: 'user_id', width: 10 },
      { header: 'Usuario', key: 'username', width: 28 },
      { header: 'Permiso', key: 'permission_name', width: 24 },
      { header: 'Activo', key: 'is_active', width: 10 },
    ],
    queryBuilder: ({ q, permission_id, active }) => {
      const vals = [];
      let idx = 1;
      let sql = `
        SELECT 
          u.user_id,
          u.username,
          COALESCE(p.permission_name, 'Sin permiso') AS permission_name,
          u.is_active
        FROM usuarios u
        LEFT JOIN usuario_permiso up ON u.user_id = up.user_id
        LEFT JOIN permisos p ON up.permission_id = p.permission_id
      `;
      const where = [];

      if (q) {
        where.push(`(u.username ILIKE $${idx})`);
        vals.push(`%${q}%`);
        idx++;
      }
      if (permission_id) {
        where.push(`up.permission_id = $${idx}`);
        vals.push(permission_id);
        idx++;
      }
      if (active !== undefined) {
        where.push(`u.is_active = $${idx}`);
        vals.push(active === '1' || active === 'true' ? 1 : 0);
        idx++;
      }

      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY u.username';
      return { text: sql, values: vals };
    }
  },

  // Marcas con información de su comercio
  marcas: {
    filename: 'marcas',
    sheetName: 'Marcas',
    columns: [
      { header: 'ID Marca', key: 'brand_id', width: 12 },
      { header: 'Marca', key: 'brand_name', width: 28 },
      { header: 'ID Comercio', key: 'store_id', width: 12 },
      { header: 'Comercio', key: 'store_name', width: 28 },
    ],
    queryBuilder: ({ store_id, q, is_active }) => {
      const vals = [];
      let idx = 1;
      let sql = `
        SELECT 
          b.brand_id,
          b.brand_name,
          b.store_id,
          s.store_name
        FROM marcas b
        LEFT JOIN comercios s ON b.store_id = s.store_id
      `;
      const where = [];
      if (store_id) { where.push(`b.store_id = $${idx}`); vals.push(store_id); idx++; }
      if (is_active !== undefined) { where.push(`b.is_active = $${idx}`); vals.push(is_active === '1' || is_active === 'true' ? 1 : 0); idx++; }
      if (q) { where.push(`(b.brand_name ILIKE $${idx} OR s.store_name ILIKE $${idx})`); vals.push(`%${q}%`); idx++; }
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY b.brand_name';
      return { text: sql, values: vals };
    }
  },

  // Productos con marca, grupo y región
  productos: {
    filename: 'productos',
    sheetName: 'Productos',
    columns: [
      { header: 'ID Producto', key: 'product_id', width: 12 },
      { header: 'Producto', key: 'product_name', width: 34 },
      { header: 'Marca', key: 'brand_name', width: 24 },
      { header: 'Grupo', key: 'group_name', width: 24 },
      { header: 'Región', key: 'region_name', width: 20 },
      { header: 'Activo', key: 'is_valid', width: 10 },
    ],
    queryBuilder: ({ brand_id, group_id, region_id, q, is_valid }) => {
      const vals = [];
      let idx = 1;
      let sql = `
        SELECT 
          p.product_id,
          p.product_name,
          COALESCE(b.brand_name, '') AS brand_name,
          COALESCE(g.group_name, '') AS group_name,
          COALESCE(r.region_name, '') AS region_name,
          p.is_valid
        FROM productos p
        LEFT JOIN marcas b ON p.brand_id = b.brand_id
        LEFT JOIN grupos g ON p.group_id = g.group_id
        LEFT JOIN regiones r ON p.region_id = r.region_id
      `;
      const where = [];
      if (brand_id) { where.push(`p.brand_id = $${idx}`); vals.push(brand_id); idx++; }
      if (group_id) { where.push(`p.group_id = $${idx}`); vals.push(group_id); idx++; }
      if (region_id && region_id !== 'all') { where.push(`p.region_id = $${idx}`); vals.push(region_id); idx++; }
      if (is_valid !== undefined) { where.push(`p.is_valid = $${idx}`); vals.push(is_valid === '1' || is_valid === 'true' ? 1 : 0); idx++; }
      if (q) { where.push(`(p.product_name ILIKE $${idx} OR b.brand_name ILIKE $${idx})`); vals.push(`%${q}%`); idx++; }
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY p.product_name';
      return { text: sql, values: vals };
    }
  },

  // Comercios con nombre de región
  comercios: {
    filename: 'comercios',
    sheetName: 'Comercios',
    columns: [
      { header: 'ID Comercio', key: 'store_id', width: 12 },
      { header: 'Comercio', key: 'store_name', width: 32 },
      { header: 'Región', key: 'region_name', width: 22 },
      { header: 'Dirección', key: 'address', width: 34 },
      { header: 'Segmento', key: 'segmento', width: 18 },
      { header: 'Ciudad', key: 'ciudad', width: 18 },
    ],
    queryBuilder: ({ region_id, q, segmento }) => {
      const vals = [];
      let idx = 1;
      let sql = `
        SELECT 
          c.store_id,
          c.store_name,
          r.region_name,
          c.address,
          c.segmento,
          c.ciudad
        FROM comercios c
        LEFT JOIN regiones r ON c.region_id = r.region_id
        WHERE c.deleted = false
      `;
      const where = [];
      // ya hay un WHERE, agregamos con AND
      if (region_id && region_id !== 'all') { where.push(`c.region_id = $${idx}`); vals.push(region_id); idx++; }
      if (segmento) { where.push(`c.segmento = $${idx}`); vals.push(segmento); idx++; }
      if (q) { where.push(`(c.store_name ILIKE $${idx} OR r.region_name ILIKE $${idx})`); vals.push(`%${q}%`); idx++; }
      if (where.length) sql += ' AND ' + where.join(' AND ');
      sql += ' ORDER BY c.store_id ASC';
      return { text: sql, values: vals };
    }
  }
};

const router = express.Router();

/**
 * Generador simple (para datasets moderados)
 */
async function generateExcelSimple(res, columns, rows, filename, sheetName = 'Sheet1') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns;
  worksheet.addRows(rows);

  // estilo mínimo: encabezado en negrita
  worksheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Endpoint genérico:
 * - ?type=usuarios&type=pedidos...
 * - acepta filtros definidos en el queryBuilder de cada config
 * - para activar streaming (si quieres): ?stream=1
 */
router.get('/excel', async (req, res) => {
  try {
    const type = req.query.type;
    if (!type) return res.status(400).json({ error: 'missing type parameter' });

    const cfg = exportsConfig[type];
    if (!cfg) return res.status(400).json({ error: 'invalid export type' });

    const { text, values } = cfg.queryBuilder(req.query);

    // Si no pedimos stream -> path simple
    const useStream = req.query.stream === '1';
    if (!useStream) {
      const result = await pool.query({ text, values });
      return await generateExcelSimple(res, cfg.columns, result.rows, cfg.filename, cfg.sheetName);
    }

    // --- STREAMING PATH (para datasets grandes) ---
    // Requiere 'pg-query-stream' instalado
    const { default: QueryStream } = await import('pg-query-stream');
    const client = await pool.connect();

    try {
      const qstream = new QueryStream(text, values);
      const stream = client.query(qstream);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${cfg.filename}.xlsx"`);

      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
      const worksheet = workbook.addWorksheet(cfg.sheetName || 'Sheet1');
      worksheet.columns = cfg.columns;

      stream.on('data', row => {
        worksheet.addRow(row).commit();
      });

      stream.on('end', async () => {
        await worksheet.commit();
        await workbook.commit();
        client.release();
        // res.end(); // workbook.commit() ya debe terminar la escritura
      });

      stream.on('error', err => {
        console.error('query stream error', err);
        client.release();
        res.status(500).end();
      });

    } catch (err) {
      client.release();
      throw err;
    }

  } catch (err) {
    console.error('export error', err);
    res.status(500).json({ error: 'Error generando Excel' });
  }
});

export default router;
