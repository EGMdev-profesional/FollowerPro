const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { sendMail } = require('./emailService');
const User = require('../models/User');

const TOKEN_TTL_MS = Number(process.env.PASSWORD_RESET_TTL_MS || 60 * 60 * 1000);

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function createToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function ensurePasswordResetsTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS password_resets (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            token_hash VARCHAR(64) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token_hash (token_hash),
            INDEX idx_user_id (user_id),
            INDEX idx_expires_at (expires_at),
            CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
}

function getAppBaseUrl(req) {
    const configured = process.env.APP_BASE_URL;
    if (configured) return configured.replace(/\/$/, '');
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
}

async function requestPasswordReset(email, req) {
    await ensurePasswordResetsTable();

    const user = await User.findByEmail(email);
    if (!user) {
        return;
    }

    const token = createToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await query(
        'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, tokenHash, expiresAt]
    );

    const baseUrl = getAppBaseUrl(req);
    const resetUrl = `${baseUrl}/reset-password.html?token=${encodeURIComponent(token)}`;

    const subject = 'Recuperar contraseña - FollowerPro';
    const text = `Recibimos una solicitud para restablecer tu contraseña.\n\nAbre este link para continuar:\n${resetUrl}\n\nSi no fuiste tú, ignora este correo.`;
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5">
            <h2>Restablecer contraseña</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p><a href="${resetUrl}">Haz clic aquí para crear una nueva contraseña</a></p>
            <p>Si no fuiste tú, ignora este correo.</p>
        </div>
    `;

    await sendMail({ to: email, subject, text, html });

    await User.logAction(user.id, 'password_reset_request', 'Solicitud de recuperación de contraseña enviada', 'info');
}

async function resetPassword(token, newPassword) {
    await ensurePasswordResetsTable();

    if (!token || typeof token !== 'string' || token.length < 20) {
        throw new Error('Token inválido');
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const tokenHash = hashToken(token);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await transaction(async (connection) => {
                const [rows] = await connection.execute(
                    `SELECT id, user_id, expires_at, used_at
                     FROM password_resets
                     WHERE token_hash = ?
                     ORDER BY id DESC
                     LIMIT 1`,
                    [tokenHash]
                );

                if (!rows || rows.length === 0) {
                    throw new Error('Token inválido o expirado');
                }

                const reset = rows[0];

                if (reset.used_at) {
                    throw new Error('Token ya utilizado');
                }

                const expiresAt = new Date(reset.expires_at);
                if (Date.now() > expiresAt.getTime()) {
                    throw new Error('Token expirado');
                }

                const [mark] = await connection.execute(
                    'UPDATE password_resets SET used_at = NOW() WHERE id = ? AND used_at IS NULL',
                    [reset.id]
                );

                if (!mark || mark.affectedRows !== 1) {
                    throw new Error('Token ya utilizado');
                }

                await connection.execute('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, reset.user_id]);
                await User.logAction(reset.user_id, 'password_reset', 'Contraseña restablecida por recovery', 'info');
            });

            break;
        } catch (err) {
            const code = err && (err.code || err.errno);
            const msg = String(err && err.message || 'error');
            const isLockWait = code === 'ER_LOCK_WAIT_TIMEOUT' || msg.toLowerCase().includes('lock wait timeout');
            if (isLockWait && attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, 250));
                continue;
            }
            throw err;
        }
    }
}

module.exports = {
    requestPasswordReset,
    resetPassword
};
