const bcrypt = require('bcryptjs');
const { initDatabase, query } = require('./config/database');

async function resetAdminPassword() {
    try {
        await initDatabase();
        
        const newPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await query(
            'UPDATE usuarios SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@panelsmm.com']
        );
        
        console.log('\n✅ Contraseña del administrador actualizada exitosamente\n');
        console.log('📧 Email: admin@panelsmm.com');
        console.log('🔑 Password: Admin123!');
        console.log('\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetAdminPassword();
