async function sendMail({ to, subject, html, text }) {
    const axios = require('axios');

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;
    const fromName = process.env.EMAIL_FROM_NAME || 'FollowerPro';

    if (!apiKey) {
        throw new Error('RESEND_API_KEY is required');
    }
    if (!fromEmail) {
        throw new Error('EMAIL_FROM is required');
    }

    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    await axios.post(
        'https://api.resend.com/emails',
        {
            from,
            to: [to],
            subject,
            html: html || undefined,
            text: text || undefined
        },
        {
            timeout: Number(process.env.EMAIL_SEND_TIMEOUT_MS || 15000),
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'content-type': 'application/json'
            }
        }
    );
}

module.exports = {
    sendMail
};
