const { initDatabase, query, closeDatabase } = require('./config/database');

async function fixDatabaseLocks() {
    try {
        console.log('🔧 Liberando bloqueos de base de datos...\n');

        await initDatabase();

        // 1. Ver transacciones activas
        console.log('📊 Verificando transacciones activas...');
        const processes = await query('SHOW PROCESSLIST');
        
        console.log(`   Total de procesos: ${processes.length}`);
        
        const activeTransactions = processes.filter(p => 
            p.Command !== 'Sleep' && p.Time > 5
        );
        
        if (activeTransactions.length > 0) {
            console.log(`   ⚠️ ${activeTransactions.length} transacciones activas encontradas:`);
            activeTransactions.forEach(p => {
                console.log(`      - ID: ${p.Id} | User: ${p.User} | Time: ${p.Time}s | State: ${p.State}`);
            });
        } else {
            console.log('   ✅ No hay transacciones bloqueadas');
        }

        // 2. Ver bloqueos de tablas
        console.log('\n📊 Verificando bloqueos de tablas...');
        try {
            const locks = await query(`
                SELECT * FROM information_schema.INNODB_LOCKS
            `);
            
            if (locks.length > 0) {
                console.log(`   ⚠️ ${locks.length} bloqueos encontrados`);
            } else {
                console.log('   ✅ No hay bloqueos de tablas');
            }
        } catch (error) {
            console.log('   ℹ️ No se pudo verificar INNODB_LOCKS (puede ser normal)');
        }

        // 3. Optimizar tablas
        console.log('\n🔧 Optimizando tablas...');
        
        const tables = ['servicios_cache', 'ordenes', 'usuarios', 'transacciones'];
        
        for (const table of tables) {
            try {
                await query(`OPTIMIZE TABLE ${table}`);
                console.log(`   ✅ Tabla ${table} optimizada`);
            } catch (error) {
                console.log(`   ⚠️ No se pudo optimizar ${table}: ${error.message}`);
            }
        }

        // 4. Verificar configuración de timeouts
        console.log('\n📊 Configuración de timeouts:');
        const timeouts = await query(`
            SHOW VARIABLES WHERE Variable_name IN (
                'innodb_lock_wait_timeout',
                'lock_wait_timeout',
                'wait_timeout',
                'interactive_timeout'
            )
        `);
        
        timeouts.forEach(t => {
            console.log(`   ${t.Variable_name}: ${t.Value}s`);
        });

        // 5. Aumentar timeout si es necesario
        console.log('\n🔧 Ajustando timeouts para esta sesión...');
        try {
            await query('SET SESSION innodb_lock_wait_timeout = 120');
            await query('SET SESSION lock_wait_timeout = 120');
            console.log('   ✅ Timeouts aumentados a 120 segundos');
        } catch (error) {
            console.log('   ⚠️ No se pudieron ajustar timeouts:', error.message);
        }

        console.log('\n✅ Proceso completado');
        console.log('\n💡 RECOMENDACIONES:');
        console.log('   1. Reinicia el servidor: Ctrl+C y luego npm start');
        console.log('   2. Si el problema persiste, reinicia MySQL/MariaDB');
        console.log('   3. Intenta crear la orden nuevamente');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

fixDatabaseLocks();
