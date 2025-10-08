// Configuración del Landing Page

const CONFIG = {
    // Número de WhatsApp (sin espacios ni símbolos, solo números)
    // Ejemplo: '1234567890' para +1 234 567 890
    WHATSAPP_NUMBER: '1234567890', // ⚠️ CAMBIAR POR TU NÚMERO REAL
    
    // Mensaje predeterminado
    DEFAULT_MESSAGE: '¡Hola! Me interesa crear un panel SMM personalizado.',
    
    // Información de contacto
    BUSINESS_NAME: 'FollowerPro',
    EMAIL: 'contacto@followerpro.com',
    
    // Configuración de recargas
    RECHARGE: {
        MIN_AMOUNT: 5,
        PAYMENT_METHODS: ['PayPal', 'Transferencia Bancaria', 'Criptomonedas'],
        PROCESSING_TIME: '5-15 minutos'
    },
    
    // Precios de los planes
    PRICING: {
        basic: {
            name: 'Panel Básico',
            price: 299,
            features: [
                'Sistema de usuarios',
                'Conexión SMMCoder API',
                'Panel admin',
                'Diseño responsive',
                'Pagos PayPal'
            ]
        },
        professional: {
            name: 'Panel Profesional',
            price: 599,
            features: [
                'Todo del plan básico',
                'API propia',
                'Múltiples pagos',
                'Refills automáticos',
                'Sistema de tickets',
                'Reportes avanzados',
                '30 días soporte'
            ]
        },
        enterprise: {
            name: 'Panel Enterprise',
            price: 999,
            features: [
                'Todo del plan profesional',
                'Múltiples proveedores',
                'White label completo',
                'App móvil',
                'Integraciones custom',
                'Soporte 24/7',
                'Código fuente'
            ]
        }
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
