import pool from './src/config/db.js';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Iniciando migración de base de datos...');
        
        // Leer el archivo SQL (referencial; este runner ejecuta statements definidos abajo)
        const migrationSQL = fs.readFileSync(
            path.join(process.cwd(), 'database_migration.sql'), 
            'utf8'
        );
        
        // Ejecutar cada statement individual manualmente para mejor control
        const statements = [
            // --- Observaciones/checkins relaciones existentes ---
            `ALTER TABLE observaciones ADD COLUMN IF NOT EXISTS checkin_id INTEGER`,
            `ALTER TABLE observaciones 
             ADD CONSTRAINT fk_observaciones_checkin 
             FOREIGN KEY (checkin_id) REFERENCES checkins(checkin_id) 
             ON DELETE SET NULL ON UPDATE CASCADE`,
            `CREATE INDEX IF NOT EXISTS idx_observaciones_checkin_id ON observaciones(checkin_id)`,
            `CREATE INDEX IF NOT EXISTS idx_observaciones_user_id ON observaciones(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_observaciones_created_at ON observaciones(created_at)`,
            `UPDATE observaciones 
             SET checkin_id = (
                 SELECT c.checkin_id 
                 FROM checkins c 
                 WHERE c.user_id = observaciones.user_id 
                 AND c.created_at <= observaciones.created_at 
                 AND (c.checkout IS NULL OR c.checkout >= observaciones.created_at)
                 ORDER BY c.created_at DESC 
                 LIMIT 1
             )
             WHERE checkin_id IS NULL 
             AND EXISTS (
                 SELECT 1 FROM checkins c 
                 WHERE c.user_id = observaciones.user_id
             )`,

            // --- NUEVO: permitir geolocalización opcional en checkins ---
            `ALTER TABLE checkins ALTER COLUMN latitude DROP NOT NULL`,
            `ALTER TABLE checkins ALTER COLUMN longitude DROP NOT NULL`,
        ];
        
        console.log(`📝 Ejecutando ${statements.length} statements...`);
        
        // Ejecutar cada statement individualmente
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                console.log(`⚡ Ejecutando statement ${i + 1}/${statements.length}`);
                console.log(`   ${statement.substring(0, 80)}...`);
                
                try {
                    await client.query(statement);
                    console.log(`   ✅ Statement ${i + 1} ejecutado correctamente`);
                } catch (stmtError) {
                    console.error(`   ❌ Error en statement ${i + 1}:`, stmtError.message);
                    // Códigos tolerables: 42701 (columna ya existe), 42P07 (índice/relación ya existe), 23503 FK ya existe / variaciones
                    if (!['42701', '42P07'].includes(stmtError.code)) {
                        throw stmtError;
                    }
                }
            }
        }
        
        console.log('✅ Migración completada exitosamente!');
        
        // Verificar ajustes de columnas de checkins
        console.log('\n📊 Verificando columnas de checkins...');
        const nnCheck = await client.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'checkins' AND column_name IN ('latitude','longitude')
        `);
        console.table(nnCheck.rows);
        
        // Verificar resultados previos
        console.log('\n📊 Verificando resultados en observaciones...');
        const result = await client.query(`
            SELECT 
                'observaciones' as table_name,
                COUNT(*) as total_records,
                COUNT(checkin_id) as records_with_checkin,
                COUNT(*) - COUNT(checkin_id) as records_without_checkin
            FROM observaciones
        `);
        console.table(result.rows);
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Ejecutar la migración
runMigration()
    .then(() => {
        console.log('🎉 Proceso completado!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error.message);
        process.exit(1);
    });
