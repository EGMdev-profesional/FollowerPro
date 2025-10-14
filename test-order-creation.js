const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

async function testOrderCreation() {
    console.log('🧪 Iniciando prueba de creación de órdenes...\n');
    
    try {
        // 1. Login
        console.log('1️⃣ Iniciando sesión...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: process.env.ADMIN_EMAIL || 'admin@panelsmm.com',
            password: process.env.ADMIN_PASSWORD || 'Admin123!'
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const cookies = loginResponse.headers['set-cookie'];
        console.log('✅ Login exitoso');
        console.log('Cookies recibidas:', cookies ? 'Sí' : 'No');
        
        // 2. Verificar balance
        console.log('\n2️⃣ Verificando balance...');
        const balanceResponse = await axios.get(`${BASE_URL}/api/balance`, {
            headers: {
                'Cookie': cookies.join('; ')
            },
            withCredentials: true
        });
        console.log('✅ Balance:', balanceResponse.data);
        
        // 3. Obtener servicios
        console.log('\n3️⃣ Obteniendo servicios...');
        const servicesResponse = await axios.get(`${BASE_URL}/api/services`, {
            headers: {
                'Cookie': cookies.join('; ')
            },
            withCredentials: true
        });
        
        if (!servicesResponse.data.success || !servicesResponse.data.data || servicesResponse.data.data.length === 0) {
            console.error('❌ No hay servicios disponibles');
            return;
        }
        
        console.log(`✅ ${servicesResponse.data.data.length} servicios disponibles`);
        
        // Seleccionar el primer servicio disponible
        const testService = servicesResponse.data.data[0];
        console.log('\n📋 Servicio de prueba:', {
            id: testService.service,
            name: testService.name,
            category: testService.category,
            min: testService.min,
            max: testService.max,
            rate: testService.rate
        });
        
        // 4. Crear orden de prueba
        console.log('\n4️⃣ Creando orden de prueba...');
        const orderData = {
            service_id: testService.service,
            link: 'https://instagram.com/test',
            quantity: testService.min
        };
        
        console.log('Datos de la orden:', orderData);
        
        const orderResponse = await axios.post(`${BASE_URL}/api/orders/create`, orderData, {
            headers: {
                'Cookie': cookies.join('; '),
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
        
        console.log('✅ Orden creada exitosamente!');
        console.log('Respuesta:', JSON.stringify(orderResponse.data, null, 2));
        
        // 5. Verificar órdenes
        console.log('\n5️⃣ Verificando órdenes...');
        const ordersResponse = await axios.get(`${BASE_URL}/api/orders/my-orders`, {
            headers: {
                'Cookie': cookies.join('; ')
            },
            withCredentials: true
        });
        
        console.log(`✅ Total de órdenes: ${ordersResponse.data.orders.length}`);
        if (ordersResponse.data.orders.length > 0) {
            console.log('Última orden:', ordersResponse.data.orders[0]);
        }
        
        console.log('\n✅ ¡Todas las pruebas pasaron exitosamente!');
        
    } catch (error) {
        console.error('\n❌ Error en la prueba:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Ejecutar prueba
testOrderCreation();
