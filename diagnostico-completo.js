require('dotenv').config();
const { initDatabase, query, closeDatabase } = require('./config/database');
const axios = require('axios');

async function diagnosticoCompleto() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA\n');
    console.log('='.repeat(60));

    try {
        // 1. Verificar conexión a base de datos
        console.log('\n1️⃣ VERIFICANDO CONEXIÓN A BASE DE DATOS...');
        try {
            await initDatabase();
            console.log('   ✅ Conexión a BD exitosa');
        } catch (error) {
            console.log('   ❌ Error de conexión a BD:', error.message);
            console.log('\n💡 VERIFICA TU ARCHIVO .env:');
            console.log('   DB_HOST=localhost');
            console.log('   DB_USER=tu_usuario');
            console.log('   DB_PASSWORD=tu_password');
            console.log('   DB_NAME=nombre_base_datos');
            await closeDatabase();
            process.exit(1);
        }

        // 2. Verificar tabla servicios_cache
        console.log('\n2️⃣ VERIFICANDO TABLA servicios_cache...');
        try {
            const tables = await query("SHOW TABLES LIKE 'servicios_cache'");
            if (tables.length === 0) {
                console.log('   ❌ La tabla servicios_cache NO EXISTE');
                console.log('   💡 Ejecuta: node fix-servicios-cache.js');
                return;
            }
            console.log('   ✅ Tabla servicios_cache existe');

            // Verificar columnas
            const columns = await query('SHOW COLUMNS FROM servicios_cache');
            const columnNames = columns.map(col => col.Field);
            console.log('   📋 Columnas:', columnNames.join(', '));

            if (!columnNames.includes('precio_final')) {
                console.log('   ⚠️ FALTA columna precio_final');
                console.log('   💡 Ejecuta: node fix-servicios-cache.js');
            } else {
                console.log('   ✅ Columna precio_final existe');
            }

            if (!columnNames.includes('markup')) {
                console.log('   ⚠️ FALTA columna markup');
                console.log('   💡 Ejecuta: node fix-servicios-cache.js');
            } else {
                console.log('   ✅ Columna markup existe');
            }

        } catch (error) {
            console.log('   ❌ Error verificando tabla:', error.message);
            return;
        }

        // 3. Contar servicios en BD
        console.log('\n3️⃣ VERIFICANDO SERVICIOS EN BD LOCAL...');
        try {
            const count = await query('SELECT COUNT(*) as total FROM servicios_cache WHERE activo = 1');
            const total = count[0].total;
            console.log(`   📊 Total de servicios activos: ${total}`);

            if (total === 0) {
                console.log('   ⚠️ NO HAY SERVICIOS EN LA BASE DE DATOS');
                console.log('   💡 Necesitas sincronizar servicios desde la API');
            } else {
                console.log('   ✅ Hay servicios disponibles');

                // Mostrar algunos servicios de ejemplo
                const samples = await query(`
                    SELECT service_id, name, rate, markup, precio_final 
                    FROM servicios_cache 
                    WHERE activo = 1 
                    LIMIT 3
                `);

                console.log('\n   📋 Servicios de ejemplo:');
                samples.forEach(s => {
                    console.log(`      - ID: ${s.service_id} | ${s.name}`);
                    console.log(`        Rate: $${s.rate} | Markup: ${s.markup}% | Final: $${s.precio_final}`);
                });
            }
        } catch (error) {
            console.log('   ❌ Error contando servicios:', error.message);
        }

        // 4. Verificar configuración de API
        console.log('\n4️⃣ VERIFICANDO CONFIGURACIÓN DE API...');
        const apiUrl = process.env.SMMCODER_API_URL;
        const apiKey = process.env.SMMCODER_API_KEY;

        if (!apiUrl) {
            console.log('   ❌ SMMCODER_API_URL no configurada en .env');
        } else {
            console.log('   ✅ SMMCODER_API_URL:', apiUrl);
        }

        if (!apiKey) {
            console.log('   ❌ SMMCODER_API_KEY no configurada en .env');
        } else {
            console.log('   ✅ SMMCODER_API_KEY: ' + apiKey.substring(0, 10) + '...');
        }

        // 5. Probar conexión con API de SMMCoder
        if (apiUrl && apiKey) {
            console.log('\n5️⃣ PROBANDO CONEXIÓN CON SMMCODER API...');
            try {
                const response = await axios.post(apiUrl, {
                    key: apiKey,
                    action: 'services'
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 10000
                });

                if (response.data && Array.isArray(response.data)) {
                    console.log(`   ✅ API responde correctamente`);
                    console.log(`   📊 Servicios disponibles en API: ${response.data.length}`);
                    
                    // Verificar si el servicio 1921 existe
                    const service1921 = response.data.find(s => s.service === 1921);
                    if (service1921) {
                        console.log(`\n   ✅ Servicio 1921 ENCONTRADO en API:`);
                        console.log(`      Nombre: ${service1921.name}`);
                        console.log(`      Categoría: ${service1921.category}`);
                        console.log(`      Rate: $${service1921.rate}`);
                        console.log(`      Min: ${service1921.min} | Max: ${service1921.max}`);
                    } else {
                        console.log(`   ⚠️ Servicio 1921 NO encontrado en API`);
                    }

                    // Verificar si está en BD local
                    const localService = await query(
                        'SELECT * FROM servicios_cache WHERE service_id = 1921 AND activo = 1'
                    );

                    if (localService.length > 0) {
                        console.log(`\n   ✅ Servicio 1921 EXISTE en BD local`);
                        console.log(`      Nombre: ${localService[0].name}`);
                        console.log(`      Rate: $${localService[0].rate}`);
                        console.log(`      Markup: ${localService[0].markup}%`);
                        console.log(`      Precio Final: $${localService[0].precio_final}`);
                    } else {
                        console.log(`\n   ❌ Servicio 1921 NO EXISTE en BD local`);
                        console.log(`   💡 Necesitas sincronizar servicios`);
                    }

                } else {
                    console.log('   ⚠️ API responde pero formato incorrecto');
                    console.log('   Respuesta:', JSON.stringify(response.data).substring(0, 200));
                }

            } catch (error) {
                console.log('   ❌ Error conectando con API:', error.message);
                if (error.code === 'ECONNREFUSED') {
                    console.log('   💡 No se puede conectar con la API. Verifica la URL.');
                } else if (error.response) {
                    console.log('   Status:', error.response.status);
                    console.log('   Data:', JSON.stringify(error.response.data).substring(0, 200));
                }
            }
        }

        // 6. Verificar tabla de usuarios
        console.log('\n6️⃣ VERIFICANDO USUARIOS...');
        try {
            const users = await query('SELECT COUNT(*) as total FROM usuarios WHERE estado = "activo"');
            console.log(`   📊 Usuarios activos: ${users[0].total}`);
        } catch (error) {
            console.log('   ❌ Error verificando usuarios:', error.message);
        }

        // 7. Verificar tabla de órdenes
        console.log('\n7️⃣ VERIFICANDO ÓRDENES...');
        try {
            const orders = await query('SELECT COUNT(*) as total FROM ordenes');
            console.log(`   📊 Total de órdenes: ${orders[0].total}`);

            const pending = await query('SELECT COUNT(*) as total FROM ordenes WHERE status = "Pending"');
            console.log(`   📊 Órdenes pendientes: ${pending[0].total}`);
        } catch (error) {
            console.log('   ❌ Error verificando órdenes:', error.message);
        }

        // RESUMEN FINAL
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN Y RECOMENDACIONES:\n');

        const serviciosCount = await query('SELECT COUNT(*) as total FROM servicios_cache WHERE activo = 1');
        const totalServicios = serviciosCount[0].total;

        if (totalServicios === 0) {
            console.log('❌ PROBLEMA PRINCIPAL: No hay servicios en la base de datos');
            console.log('\n🔧 SOLUCIÓN:');
            console.log('   1. Ejecuta: node fix-servicios-cache.js');
            console.log('   2. Inicia el servidor: npm start');
            console.log('   3. Abre el panel y espera a que se sincronicen los servicios');
            console.log('   4. Verifica en la consola del servidor que diga "X servicios sincronizados"');
        } else {
            console.log('✅ Sistema configurado correctamente');
            console.log(`   ${totalServicios} servicios disponibles`);
            console.log('\n💡 Si sigues teniendo problemas al crear órdenes:');
            console.log('   1. Verifica que el servicio que intentas usar existe en la BD');
            console.log('   2. Revisa la consola del navegador para ver el service_id exacto');
            console.log('   3. Ejecuta: SELECT * FROM servicios_cache WHERE service_id = [ID]');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n❌ ERROR GENERAL:', error.message);
        console.error(error);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

// Ejecutar diagnóstico
diagnosticoCompleto();
