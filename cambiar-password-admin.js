const bcrypt = require('bcryptjs');
const { initDatabase, query, closeDatabase } = require('./config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function pregunta(texto) {
    return new Promise((resolve) => {
        rl.question(texto, (respuesta) => {
            resolve(respuesta);
        });
    });
}

async function cambiarPasswordAdmin() {
    try {
        console.log('🔐 CAMBIAR CONTRASEÑA DE ADMINISTRADOR\n');
        console.log('='.repeat(50));

        // Inicializar BD
        await initDatabase();

        // Pedir email del admin
        const email = await pregunta('\n📧 Email del administrador: ');

        // Verificar que el usuario existe y es admin
        const users = await query(
            'SELECT id, nombre, email, rol FROM usuarios WHERE email = ? AND rol = "admin"',
            [email]
        );

        if (users.length === 0) {
            console.log('\n❌ No se encontró un administrador con ese email');
            await closeDatabase();
            rl.close();
            process.exit(1);
        }

        const user = users[0];
        console.log(`\n✅ Usuario encontrado: ${user.nombre} (${user.email})`);

        // Pedir nueva contraseña
        const password1 = await pregunta('\n🔑 Nueva contraseña: ');
        
        if (password1.length < 6) {
            console.log('\n❌ La contraseña debe tener al menos 6 caracteres');
            await closeDatabase();
            rl.close();
            process.exit(1);
        }

        const password2 = await pregunta('🔑 Confirma la contraseña: ');

        if (password1 !== password2) {
            console.log('\n❌ Las contraseñas no coinciden');
            await closeDatabase();
            rl.close();
            process.exit(1);
        }

        // Hashear contraseña
        console.log('\n🔄 Hasheando contraseña...');
        const hashedPassword = await bcrypt.hash(password1, 10);

        // Actualizar en BD
        await query(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [hashedPassword, user.id]
        );

        console.log('\n✅ ¡Contraseña actualizada exitosamente!');
        console.log(`\n📋 Nuevas credenciales:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Contraseña: ${password1}`);
        console.log(`\n💡 Guarda estas credenciales en un lugar seguro`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        await closeDatabase();
        rl.close();
        process.exit(0);
    }
}

// Ejecutar
cambiarPasswordAdmin();
