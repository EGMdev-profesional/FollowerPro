const nodemailer = require('nodemailer');

function createTransport() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
        throw new Error('SMTP config missing: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });
}

async function sendMail({ to, subject, html, text }) {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    if (!from) {
        throw new Error('EMAIL_FROM (or SMTP_USER) is required');
    }

    const transporter = createTransport();
    await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
    });
}

module.exports = {
    sendMail
};
