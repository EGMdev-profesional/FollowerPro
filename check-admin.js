const { initDatabase, query } = require('./config/database');

async function checkAdmin() {
    try {
        await initDatabase();
        
        console.log('\n🔍 Verificando usuarios en la base de datos...\n');
        
        const users = await query('SELECT id, email, nombre, rol, estado FROM usuarios');
        
        if (users.length === 0) {
            console.log('❌ No hay usuarios en la base de datos');
            console.log('\n💡 Ejecuta el servidor para crear el usuario admin automáticamente');
        } else {
            console.log(`✅ Encontrados ${users.length} usuario(s):\n`);
            users.forEach(user => {
                console.log(`ID: ${user.id}`);
                console.log(`Email: ${user.email}`);
                console.log(`Nombre: ${user.nombre}`);
                console.log(`Rol: ${user.rol}`);
                console.log(`Estado: ${user.estado}`);
                console.log('─────────────────────────────────');
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkAdmin();
