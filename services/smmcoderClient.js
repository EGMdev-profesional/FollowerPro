const axios = require('axios');

function buildFormBody(payload) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) continue;
        params.append(key, String(value));
    }
    return params;
}

function createSmmCoderClient({ apiUrl, apiKey, timeoutMs = 15000 }) {
    if (!apiUrl) {
        throw new Error('SMMCODER_API_URL is required');
    }
    if (!apiKey) {
        throw new Error('SMMCODER_API_KEY is required');
    }

    async function request(action, params = {}) {
        const body = buildFormBody({
            key: apiKey,
            action,
            ...params
        });

        try {
            const response = await axios.post(apiUrl, body, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: timeoutMs
            });
            return response.data;
        } catch (error) {
            const detail = error.response?.data ?? error.message;
            const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
            err.cause = error;
            err.status = error.response?.status;
            err.data = error.response?.data;
            throw err;
        }
    }

    return {
        request,
        services: () => request('services'),
        balance: () => request('balance'),
        addOrder: (data) => request('add', data),
        status: (orderId) => request('status', { order: orderId }),
        multiStatus: (orderIds) => request('status', { orders: Array.isArray(orderIds) ? orderIds.join(',') : String(orderIds) }),
        refill: (orderId) => request('refill', { order: orderId }),
        multiRefill: (orderIds) => request('refill', { orders: Array.isArray(orderIds) ? orderIds.join(',') : String(orderIds) }),
        refillStatus: (refillId) => request('refill_status', { refill: refillId }),
        multiRefillStatus: (refillIds) => request('refill_status', { refills: Array.isArray(refillIds) ? refillIds.join(',') : String(refillIds) }),
        cancel: (orderIds) => request('cancel', { orders: Array.isArray(orderIds) ? orderIds.join(',') : String(orderIds) })
    };
}

let singleton;
function getSmmCoderClient() {
    if (!singleton) {
        singleton = createSmmCoderClient({
            apiUrl: process.env.SMMCODER_API_URL,
            apiKey: process.env.SMMCODER_API_KEY,
            timeoutMs: Number(process.env.SMMCODER_TIMEOUT_MS || 15000)
        });
    }
    return singleton;
}

module.exports = {
    createSmmCoderClient,
    getSmmCoderClient
};
