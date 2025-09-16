import pool from './src/config/db.js';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Iniciando migración de base de datos...');
        
        // Leer el archivo SQL
        const migrationSQL = fs.readFileSync(
            path.join(process.cwd(), 'database_migration.sql'), 
            'utf8'
        );
        
        // Ejecutar cada statement individual manualmente para mejor control
        const statements = [
            // Step 1: Add checkin_id column
            `ALTER TABLE observaciones ADD COLUMN IF NOT EXISTS checkin_id INTEGER`,
            
            // Step 2: Add foreign key constraint
            `ALTER TABLE observaciones 
             ADD CONSTRAINT fk_observaciones_checkin 
             FOREIGN KEY (checkin_id) REFERENCES checkins(checkin_id) 
             ON DELETE SET NULL ON UPDATE CASCADE`,
            
            // Step 3: Add indexes
            `CREATE INDEX IF NOT EXISTS idx_observaciones_checkin_id ON observaciones(checkin_id)`,
            `CREATE INDEX IF NOT EXISTS idx_observaciones_user_id ON observaciones(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_observaciones_created_at ON observaciones(created_at)`,
            
            // Step 4: Update existing observations
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
             )`
        ];
        
        console.log(`📝 Ejecutando ${statements.length} statements...`);
        
        // Ejecutar cada statement individualmente
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                console.log(`⚡ Ejecutando statement ${i + 1}/${statements.length}`);
                console.log(`   ${statement.substring(0, 50)}...`);
                
                try {
                    await client.query(statement);
                    console.log(`   ✅ Statement ${i + 1} ejecutado correctamente`);
                } catch (stmtError) {
                    console.error(`   ❌ Error en statement ${i + 1}:`, stmtError.message);
                    // Continuar con el siguiente statement si es un error no crítico
                    if (stmtError.code !== '42701' && stmtError.code !== '42P07') { // Column already exists or relation already exists
                        throw stmtError;
                    }
                }
            }
        }
        
        console.log('✅ Migración completada exitosamente!');
        
        // Verificar los resultados
        console.log('\n📊 Verificando resultados...');
        
        // Verificar que la columna existe
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'observaciones' AND column_name = 'checkin_id'
        `);
        
        if (columnCheck.rows.length > 0) {
            console.log('✅ Columna checkin_id creada correctamente');
            
            // Verificar los datos
            const result = await client.query(`
                SELECT 
                    'observaciones' as table_name,
                    COUNT(*) as total_records,
                    COUNT(checkin_id) as records_with_checkin,
                    COUNT(*) - COUNT(checkin_id) as records_without_checkin
                FROM observaciones
            `);
            
            console.log('Resultados de la migración:');
            console.table(result.rows);
            
            // Mostrar algunos ejemplos
            const examples = await client.query(`
                SELECT 
                    o.observation_id,
                    o.observation_string,
                    u.username,
                    r.region_name,
                    s.store_name
                FROM observaciones o
                LEFT JOIN usuarios u ON o.user_id = u.user_id
                LEFT JOIN checkins c ON o.checkin_id = c.checkin_id
                LEFT JOIN regiones r ON c.region_id = r.region_id
                LEFT JOIN comercios s ON c.store_id = s.store_id
                ORDER BY o.created_at DESC
                LIMIT 5
            `);
            
            console.log('\n📋 Ejemplos de observaciones con relaciones:');
            console.table(examples.rows);
        } else {
            console.error('❌ La columna checkin_id no fue creada');
        }
        
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
