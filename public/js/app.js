// Estado global de la aplicación
let appState = {
    services: [],
    allServices: [],
    filteredServices: [],
    orders: [],
    balance: 0,
    selectedService: null,
    currentPage: 'dashboard',
    rechargeAmount: 0,
    favoriteServices: JSON.parse(localStorage.getItem('favoriteServices') || '[]'),
    showingFavorites: false
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// Configuración inicial
function initializeApp() {
    // Configurar navegación del sidebar
    setupSidebarNavigation();
    
    // Actualizar título inicial
    updatePageTitle('dashboard');
    
    // Cargar información del usuario
    loadUserInfo();
}

// Event Listeners
function setupEventListeners() {
    // Toggle sidebar en móvil
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        
        // Cerrar sidebar al hacer click fuera de él (solo en móvil)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains('open') && 
                    !sidebar.contains(e.target) && 
                    !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
        
        // Evitar que clicks dentro del sidebar lo cierren
        sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Formulario de nueva orden
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }

    // Selector de servicio
    const serviceSelect = document.getElementById('service-select');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', handleServiceChange);
    }

    // Campo de cantidad
    const quantityInput = document.getElementById('quantity-input');
    if (quantityInput) {
        quantityInput.addEventListener('input', calculateCost);
    }

    // Búsqueda de servicios
    const servicesSearch = document.getElementById('services-search');
    if (servicesSearch) {
        servicesSearch.addEventListener('input', filterServices);
    }
    
    // Filtros de servicios
    const socialNetworkFilter = document.getElementById('social-network-filter');
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (socialNetworkFilter) socialNetworkFilter.addEventListener('change', filterServices);
    if (categoryFilter) categoryFilter.addEventListener('change', filterServices);
    if (typeFilter) typeFilter.addEventListener('change', filterServices);
    if (sortFilter) sortFilter.addEventListener('change', filterServices);

    // Búsqueda de órdenes
    const orderSearch = document.getElementById('order-search');
    if (orderSearch) {
        orderSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkOrderStatus();
            }
        });
    }
}

// Navegación del sidebar
function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) {
                switchPage(page);
                
                // Actualizar estado activo
                menuItems.forEach(mi => mi.classList.remove('active'));
                this.classList.add('active');
                
                // Cerrar sidebar en móvil
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.remove('open');
            }
        });
    });
}

// Cambiar página
function switchPage(page) {
    // Actualizar estado activo en el menú
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        if (item.dataset.page === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Mostrar loading con mensaje personalizado para servicios
    const loadingMessage = (page === 'services' || page === 'create-order') 
        ? 'Cargando Más De 4000 Servicios, Espere Un Momento...' 
        : 'Cargando...';
    showPageLoading(true, loadingMessage);
    
    // Ocultar todas las páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    // Simular carga (para dar tiempo a cargar datos)
    setTimeout(() => {
        // Mostrar página seleccionada
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Actualizar título
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                pageTitle.textContent = getPageTitle(page);
            }
            
            // Cargar datos específicos de la página
            loadPageData(page);
        }
        
        // Ocultar loading
        showPageLoading(false);
        
        appState.currentPage = page;
    }, 300); // 300ms de delay para mostrar el loading
}

// Obtener título de página
function getPageTitle(page) {
    const titles = {
        'dashboard': 'Inicio',
        'services': 'Servicios',
        'create-order': 'Crear Orden',
        'orders': 'Mis Órdenes',
        'recharge': 'Recargar Saldo',
        'settings': 'Configuración',
        'get-panel': 'Obtén tu Panel',
        'admin': 'Administración'
    };
    return titles[page] || 'Inicio';
}

// Actualizar título de página
function updatePageTitle(page) {
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = getPageTitle(page);
    }
}

// Cargar datos iniciales con optimización de rendimiento
async function loadInitialData() {
    try {
        showLoading(true);

        // Cargar datos críticos primero (balance)
        try {
            await loadBalance();
        } catch (error) {
            console.warn('Balance no disponible, continuando...');
            appState.balance = 0;
        }

        // Cargar servicios en segundo plano
        loadServicesInBackground();

        updateDashboardStats();

    } catch (error) {
        console.error('Error en carga inicial:', error);
        showToast('Aplicación cargada en modo local. Algunas funciones pueden estar limitadas.', 'info');
    } finally {
        showLoading(false);
    }
}

// Cargar servicios en segundo plano para no bloquear la UI
async function loadServicesInBackground() {
    try {
        // Intentar cargar desde API externa
        await loadServices();
    } catch (error) {
        console.warn('Cargando servicios locales...');
        // Si falla la API externa, cargar locales
        try {
            await loadServicesLocal();
        } catch (localError) {
            console.error('Error cargando servicios locales:', localError);
        }
    }

    // Una vez cargados, actualizar la UI si es necesario
    if (typeof updateServiceSelect === 'function') {
        updateServiceSelect();
    }
}

// Cargar datos específicos de página
async function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            await loadBalance();
            updateDashboardStats();
            break;
        case 'services':
            // Si no hay servicios cargados, cargarlos en segundo plano
            if (appState.services.length === 0) {
                loadServicesInBackground();
            }
            await renderServices();
            setupServicesEvents();
            break;
        case 'create-order':
            setupCreateOrderPage();
            break;
        case 'orders':
            await loadOrders();
            await loadUserOrders();
            break;
        case 'recharge':
            setupRechargeEvents();
            break;
        case 'settings':
            await loadUserSettings();
            setupSettingsEvents();
            break;
        case 'admin':
            // Cargar datos del panel de administración
            await loadAdminStats();
            await loadAdminUsers();
            break;
    }
}

// API Calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(endpoint, config);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error en la API');
        }
        
        return result.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Cargar balance
async function loadBalance() {
    try {
        const balanceData = await apiCall('/api/balance');
        appState.balance = parseFloat(balanceData.balance) || 0;

        // Actualizar displays de balance
        const balanceElements = [
            document.getElementById('current-balance'),
            document.getElementById('balance-amount'),
            document.getElementById('balance-large'),
            document.getElementById('header-balance-display')
        ];

        balanceElements.forEach(el => {
            if (el) {
                el.textContent = `$${appState.balance.toFixed(2)}`;
            }
        });

        return balanceData;
    } catch (error) {
        console.warn('Error al cargar balance:', error.message);
        // No mostrar error al usuario, solo establecer balance en 0
        appState.balance = 0;

        // Actualizar displays con balance 0
        const balanceElements = [
            document.getElementById('current-balance'),
            document.getElementById('balance-amount'),
            document.getElementById('balance-large')
        ];

        balanceElements.forEach(el => {
            if (el) {
                el.textContent = '$0.00';
            }
        });

        throw error; // Re-lanzar para que el llamador sepa que falló
    }
}

// Cargar servicios desde BD local (fallback)
async function loadServicesLocal() {
    try {
        const response = await fetch('/api/services/local');
        if (!response.ok) {
            throw new Error('No se pudieron cargar servicios locales');
        }

        const servicesData = await response.json();
        appState.services = Array.isArray(servicesData) ? servicesData : [];

        // Actualizar selector de servicios
        updateServiceSelect();

        return servicesData;
    } catch (error) {
        console.error('Error cargando servicios locales:', error);
        // Si no hay API local, usar servicios de ejemplo
        appState.services = getExampleServices();
        updateServiceSelect();
        return appState.services;
    }
}

// Servicios de ejemplo para desarrollo/demo
function getExampleServices() {
    return [
        {
            service: 1,
            name: "Instagram Followers",
            category: "Instagram",
            rate: "0.50",
            min: 100,
            max: 10000,
            type: "Default",
            refill: true,
            cancel: true
        },
        {
            service: 2,
            name: "Instagram Likes",
            category: "Instagram",
            rate: "0.05",
            min: 50,
            max: 5000,
            type: "Default",
            refill: true,
            cancel: true
        },
        {
            service: 3,
            name: "TikTok Followers",
            category: "TikTok",
            rate: "0.80",
            min: 100,
            max: 50000,
            type: "Default",
            refill: true,
            cancel: true
        },
        {
            service: 4,
            name: "YouTube Views",
            category: "YouTube",
            rate: "1.20",
            min: 1000,
            max: 100000,
            type: "Default",
            refill: false,
            cancel: true
        },
        {
            service: 5,
            name: "Twitter Followers",
            category: "Twitter",
            rate: "0.60",
            min: 100,
            max: 25000,
            type: "Default",
            refill: true,
            cancel: true
        },
        {
            service: 6,
            name: "Facebook Likes",
            category: "Facebook",
            rate: "0.15",
            min: 100,
            max: 10000,
            type: "Default",
            refill: true,
            cancel: true
        }
    ];
}

// Cargar servicios
async function loadServices() {
    try {
        console.log('📡 Cargando servicios desde API...');
        const servicesData = await apiCall('/api/services');
        
        if (!servicesData || !Array.isArray(servicesData)) {
            throw new Error('Respuesta inválida de la API');
        }
        
        appState.services = servicesData;
        console.log(`✅ ${servicesData.length} servicios cargados y sincronizados`);

        // Actualizar selector de servicios
        updateServiceSelect();

        return servicesData;
    } catch (error) {
        console.error('❌ Error al cargar servicios:', error.message);
        
        // Intentar cargar desde BD local como fallback
        try {
            const localServices = await apiCall('/api/services/local');
            if (localServices && Array.isArray(localServices)) {
                appState.services = localServices;
                console.log(`✅ ${localServices.length} servicios cargados desde BD local`);
                return localServices;
            }
        } catch (localError) {
            console.error('❌ Error cargando servicios locales:', localError.message);
        }
        
        showToast('Error al cargar servicios. Por favor recarga la página.', 'error');
        throw error;
    }
}

// Actualizar selector de servicios
function updateServiceSelect() {
    const serviceSelect = document.getElementById('service-select');
    if (!serviceSelect) return;

    // Limpiar opciones existentes (excepto la primera)
    serviceSelect.innerHTML = '<option value="">Selecciona un servicio</option>';

    // Agregar servicios
    appState.services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.service;
        option.textContent = `${service.name} - $${service.rate} (${service.category})`;
        option.dataset.service = JSON.stringify(service);
        serviceSelect.appendChild(option);
    });
}

// Renderizar servicios
function renderServices() {
    const servicesGrid = document.getElementById('services-grid');
    if (!servicesGrid) return;
    
    servicesGrid.innerHTML = '';
    
    if (appState.services.length === 0) {
        servicesGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">No hay servicios disponibles</p>
            </div>
        `;
        return;
    }
    
    appState.services.forEach(service => {
        const serviceCard = createServiceCard(service);
        servicesGrid.appendChild(serviceCard);
    });
}

// Crear tarjeta de servicio
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    
    card.innerHTML = `
        <div class="service-header">
            <div class="service-name">${service.name}</div>
            <div class="service-category">${service.category}</div>
        </div>
        <div class="service-details">
            <div><strong>Precio:</strong> $${service.rate}</div>
            <div><strong>Tipo:</strong> ${service.type}</div>
            <div><strong>Mín:</strong> ${service.min}</div>
            <div><strong>Máx:</strong> ${service.max}</div>
        </div>
        <div class="service-features">
            ${service.refill ? '<span class="badge badge-success">Refill</span>' : ''}
            ${service.cancel ? '<span class="badge badge-warning">Cancelable</span>' : ''}
        </div>
        <div class="service-price">$${service.rate} por 1000</div>
    `;
    
    return card;
}

// Manejar cambio de servicio
function handleServiceChange(event) {
    const selectedOption = event.target.selectedOptions[0];
    
    if (selectedOption && selectedOption.dataset.service) {
        appState.selectedService = JSON.parse(selectedOption.dataset.service);
        
        // Actualizar límites de cantidad
        const minQuantity = document.getElementById('min-quantity');
        const maxQuantity = document.getElementById('max-quantity');
        const quantityInput = document.getElementById('quantity-input');
        
        if (minQuantity) minQuantity.textContent = appState.selectedService.min;
        if (maxQuantity) maxQuantity.textContent = appState.selectedService.max;
        
        if (quantityInput) {
            quantityInput.min = appState.selectedService.min;
            quantityInput.max = appState.selectedService.max;
            quantityInput.placeholder = appState.selectedService.min;
        }
        
        calculateCost();
    } else {
        appState.selectedService = null;
        resetOrderForm();
    }
}

// Calcular costo
function calculateCost() {
    const quantityInput = document.getElementById('quantity-input');
    const costDisplay = document.getElementById('cost-display');
    
    if (!quantityInput || !costDisplay || !appState.selectedService) return;
    
    const quantity = parseInt(quantityInput.value) || 0;
    const rate = parseFloat(appState.selectedService.rate) || 0;
    
    // Calcular costo: (cantidad / 1000) * precio
    const cost = (quantity / 1000) * rate;
    
    costDisplay.textContent = `$${cost.toFixed(4)}`;
    
    // Validar cantidad
    const min = parseInt(appState.selectedService.min);
    const max = parseInt(appState.selectedService.max);
    
    if (quantity < min || quantity > max) {
        costDisplay.style.color = 'var(--error-color)';
    } else {
        costDisplay.style.color = 'var(--success-color)';
    }
}

// Manejar envío de orden
async function handleOrderSubmit(event) {
    event.preventDefault();
    
    if (!appState.selectedService) {
        showToast('Selecciona un servicio', 'warning');
        return;
    }
    
    const formData = new FormData(event.target);
    const orderData = {
        service_id: appState.selectedService.service,
        link: document.getElementById('link-input').value,
        quantity: parseInt(document.getElementById('quantity-input').value)
    };
    
    console.log('📋 Creando orden:', orderData);
    
    // Validaciones
    if (!orderData.link || !orderData.quantity) {
        showToast('Completa todos los campos', 'warning');
        return;
    }
    
    const min = parseInt(appState.selectedService.min);
    const max = parseInt(appState.selectedService.max);
    
    if (orderData.quantity < min || orderData.quantity > max) {
        showToast(`La cantidad debe estar entre ${min} y ${max}`, 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        // Usar el endpoint correcto de orders
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Error al crear la orden');
        }
        
        console.log('✅ Orden creada:', result);
        showToast(`Orden creada exitosamente. ID: ${result.order.id}`, 'success');
        
        // Resetear formulario
        event.target.reset();
        resetOrderForm();
        
        // Actualizar balance
        await loadBalance();
        updateDashboardStats();
        
    } catch (error) {
        console.error('❌ Error creando orden:', error);
        showToast('Error al crear la orden: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Resetear formulario de orden
function resetOrderForm() {
    const costDisplay = document.getElementById('cost-display');
    const minQuantity = document.getElementById('min-quantity');
    const maxQuantity = document.getElementById('max-quantity');
    
    if (costDisplay) costDisplay.textContent = '$0.00';
    if (minQuantity) minQuantity.textContent = '-';
    if (maxQuantity) maxQuantity.textContent = '-';
    
    appState.selectedService = null;
}

// Consultar estado de orden
async function checkOrderStatus() {
    const orderInput = document.getElementById('order-search');
    const orderId = orderInput?.value.trim();
    
    if (!orderId) {
        showToast('Ingresa un ID de orden', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        const result = await apiCall(`/api/order/${orderId}`);
        
        // Mostrar resultado en una modal o actualizar tabla
        showOrderStatusResult(orderId, result);
        
    } catch (error) {
        showToast('Error al consultar orden: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Mostrar resultado del estado de orden
function showOrderStatusResult(orderId, data) {
    const statusText = getStatusText(data.status);
    const message = `
        Orden ${orderId}:
        Estado: ${statusText}
        Costo: $${data.charge}
        Inicio: ${data.start_count}
        Restante: ${data.remains}
    `;
    
    showToast(message, 'success');
}

// Obtener texto de estado
function getStatusText(status) {
    const statusMap = {
        'Pending': 'Pendiente',
        'In progress': 'En progreso',
        'Completed': 'Completado',
        'Partial': 'Parcial',
        'Processing': 'Procesando',
        'Canceled': 'Cancelado'
    };
    
    return statusMap[status] || status;
}

// Actualizar estadísticas del dashboard
function updateDashboardStats() {
    // Por ahora solo actualizamos el balance
    // En una implementación completa, aquí cargaríamos estadísticas reales
    const stats = {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0
    };
    
    const totalOrdersEl = document.getElementById('total-orders');
    const pendingOrdersEl = document.getElementById('pending-orders');
    const completedOrdersEl = document.getElementById('completed-orders');
    
    if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders;
    if (pendingOrdersEl) pendingOrdersEl.textContent = stats.pendingOrders;
    if (completedOrdersEl) completedOrdersEl.textContent = stats.completedOrders;
}

// Actualizar display de balance
function updateBalanceDisplay() {
    const balanceLarge = document.getElementById('balance-large');
    if (balanceLarge) {
        balanceLarge.textContent = `$${appState.balance.toFixed(2)}`;
    }
}

// Filtrar servicios
function filterServices() {
    const searchTerm = document.getElementById('services-search')?.value.toLowerCase() || '';
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        const serviceName = card.querySelector('.service-name')?.textContent.toLowerCase() || '';
        const serviceCategory = card.querySelector('.service-category')?.textContent.toLowerCase() || '';
        
        const matches = serviceName.includes(searchTerm) || serviceCategory.includes(searchTerm);
        card.style.display = matches ? 'block' : 'none';
    });
}

// Verificar conexión con API
async function checkApiConnection() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (!statusIndicator || !statusText) return;
    
    try {
        await apiCall('/api/balance');
        
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = 'Conectado';
        
    } catch (error) {
        statusIndicator.className = 'status-indicator disconnected';
        statusText.textContent = 'Error de conexión';
    }
}

// Refrescar datos
async function refreshData() {
    const refreshBtn = document.querySelector('.refresh-btn i');
    
    if (refreshBtn) {
        refreshBtn.classList.add('fa-spin');
    }
    
    try {
        await loadInitialData();
        showToast('Datos actualizados', 'success');
    } catch (error) {
        showToast('Error al actualizar datos', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('fa-spin');
        }
    }
}

// Refrescar balance
async function refreshBalance() {
    try {
        await loadBalance();
        updateBalanceDisplay();
        showToast('Balance actualizado', 'success');
    } catch (error) {
        showToast('Error al actualizar balance', 'error');
    }
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('show', show);
    }
}

// Mostrar toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
    
    // Click to remove
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

// Obtener icono de toast
function getToastIcon(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    return icons[type] || icons.info;
}

// Actualizar estadísticas del dashboard
function updateDashboardStats() {
    // Actualizar balance
    const balanceEl = document.getElementById('dashboard-balance');
    if (balanceEl) {
        balanceEl.textContent = `$${appState.balance.toFixed(2)}`;
    }
    
    // Actualizar servicios
    const servicesEl = document.getElementById('dashboard-services');
    if (servicesEl) {
        servicesEl.textContent = appState.services.length;
    }
    
    // Actualizar órdenes (simulado por ahora)
    const ordersEl = document.getElementById('dashboard-orders');
    if (ordersEl) {
        ordersEl.textContent = appState.orders.length;
    }
    
    // Actualizar pendientes (simulado por ahora)
    const pendingEl = document.getElementById('dashboard-pending');
    if (pendingEl) {
        const pending = appState.orders.filter(order => order.status === 'Pending').length;
        pendingEl.textContent = pending;
    }
}

// Función para refrescar datos
async function refreshData() {
    showLoading(true);
    try {
        await Promise.all([
            loadBalance(),
            loadServices()
        ]);
        updateDashboardStats();
        showToast('Datos actualizados correctamente', 'success');
    } catch (error) {
        showToast('Error al actualizar datos', 'error');
    } finally {
        showLoading(false);
    }
}

// Función para contactar por WhatsApp
function contactWhatsApp(plan = '') {
    let message = '¡Hola! Me interesa obtener un panel SMM personalizado como este. ¿Podrían darme más información sobre precios y características?';
    
    if (plan) {
        message = `¡Hola! Me interesa el ${plan}. ¿Podrían darme más información sobre precios y características?`;
    }
    
    // Número de WhatsApp actualizado
    const phoneNumber = '5491138520755'; // +54 9 11 3852-0755
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// === FUNCIONES DE RECARGA ===

// Configurar eventos de la página de recarga
function setupRechargeEvents() {
    const customAmountInput = document.getElementById('custom-amount');
    if (customAmountInput) {
        customAmountInput.addEventListener('input', handleCustomAmountChange);
    }
    
    // Actualizar balance actual en la página de recargas
    const rechargeCurrentBalance = document.getElementById('recharge-current-balance');
    if (rechargeCurrentBalance) {
        rechargeCurrentBalance.textContent = `$${appState.balance.toFixed(2)}`;
    }
}

// Seleccionar monto predefinido
function selectAmount(amount) {
    // Remover selección anterior
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Seleccionar botón actual
    event.target.classList.add('selected');
    
    // Limpiar input personalizado
    const customInput = document.getElementById('custom-amount');
    if (customInput) {
        customInput.value = '';
    }
    
    // Actualizar monto
    updateRechargeAmount(amount);
}

// Manejar cambio en monto personalizado
function handleCustomAmountChange(event) {
    const amount = parseFloat(event.target.value) || 0;
    
    // Remover selección de botones predefinidos
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Actualizar monto
    updateRechargeAmount(amount);
}

// Actualizar monto de recarga
function updateRechargeAmount(amount) {
    appState.rechargeAmount = amount;
    
    // Calcular comisión del 25%
    const commission = amount * 0.25;
    const totalToPay = amount + commission;
    
    // Actualizar displays
    const rechargeAmountEl = document.getElementById('recharge-amount');
    const commissionAmountEl = document.getElementById('commission-amount');
    const totalAmountEl = document.getElementById('total-amount');
    const newBalanceEl = document.getElementById('new-balance');
    const rechargeBtn = document.querySelector('.recharge-btn');
    
    if (rechargeAmountEl) {
        rechargeAmountEl.textContent = `$${amount.toFixed(2)}`;
    }
    
    if (commissionAmountEl) {
        commissionAmountEl.textContent = `$${commission.toFixed(2)}`;
    }
    
    if (totalAmountEl) {
        totalAmountEl.textContent = `$${totalToPay.toFixed(2)}`;
    }
    
    // Calcular y mostrar nuevo balance
    if (newBalanceEl) {
        const currentBalance = appState.balance || 0;
        const newBalance = currentBalance + amount;
        newBalanceEl.textContent = `$${newBalance.toFixed(2)}`;
    }
    
    // Habilitar/deshabilitar botón
    if (rechargeBtn) {
        rechargeBtn.disabled = amount < 5; // Mínimo $5
    }
}

// Solicitar recarga por WhatsApp
function requestRecharge() {
    if (appState.rechargeAmount < 5) {
        showToast('El monto mínimo de recarga es $5 USD', 'warning');
        return;
    }
    
    const amount = appState.rechargeAmount;
    const commission = amount * 0.25;
    const totalToPay = amount + commission;
    
    const message = `🔄 *SOLICITUD DE RECARGA*\n\n` +
                   `💰 Monto a recargar: $${amount.toFixed(2)} USD\n` +
                   `💵 Comisión (25%): $${commission.toFixed(2)} USD\n` +
                   `💳 Total a pagar: $${totalToPay.toFixed(2)} USD\n\n` +
                   `📱 Usuario: ${appState.userEmail || 'Usuario'}\n` +
                   `💳 Método preferido: [PayPal/Transferencia/Crypto]\n\n` +
                   `¡Hola! Quiero recargar $${amount.toFixed(2)} USD a mi cuenta. ` +
                   `El total a pagar es $${totalToPay.toFixed(2)} USD. ` +
                   `¿Podrían ayudarme con el proceso de pago?`;
    
    // Número de WhatsApp actualizado
    const phoneNumber = '5491138520755'; // +54 9 11 3852-0755
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Mostrar confirmación
    showToast(`Solicitud de recarga enviada - Total a pagar: $${totalToPay.toFixed(2)} USD`, 'success');
}

// === FUNCIONES DE SERVICIOS ===

// Configurar eventos de la página de servicios
function setupServicesEvents() {
    const searchInput = document.getElementById('services-search');
    const socialNetworkFilter = document.getElementById('social-network-filter');
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterServices);
    }
    
    if (socialNetworkFilter) {
        socialNetworkFilter.addEventListener('change', filterServices);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterServices);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterServices);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', filterServices);
    }
}

// Renderizar servicios con optimización de rendimiento
async function renderServices() {
    const servicesGrid = document.getElementById('services-grid');
    if (!servicesGrid) return;

    // Mostrar skeleton loading primero
    showServicesSkeleton();

    try {
        // Si no hay servicios cargados, intentar cargar
        if (appState.services.length === 0) {
            await loadServices();
        }

        // Inicializar allServices si no existe
        if (!appState.allServices || appState.allServices.length === 0) {
            appState.allServices = [...appState.services];
            appState.filteredServices = [...appState.services];
        }

        if (appState.services.length === 0) {
            showServicesEmpty();
            return;
        }

        // Limpiar grid
        servicesGrid.innerHTML = '';

        // Renderizar en lotes para mejor rendimiento
        await renderServicesInBatches(appState.services, servicesGrid);

        // Actualizar estadísticas después de renderizar
        updateServicesStats(appState.services);

        // Actualizar filtro de categorías
        updateCategoryFilter();
        
        // Actualizar contador de favoritos
        updateFavoritesCount();

    } catch (error) {
        console.error('Error rendering services:', error);
        showServicesError();
    }
}

// Crear tarjeta de servicio optimizada
function createOptimizedServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.dataset.category = service.category;
    card.dataset.name = service.name.toLowerCase();
    card.dataset.serviceId = service.service;

    // Calcular precio con markup
    const markup = 1.2;
    const finalPrice = (parseFloat(service.rate) * markup).toFixed(4);

    // Limpiar y formatear el nombre del servicio
    const serviceName = cleanServiceName(service.name);
    const serviceDescription = extractServiceDescription(service.name);
    
    // Verificar si el servicio está en favoritos
    const isFavorite = appState.favoriteServices.includes(service.service);
    const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    const favoriteClass = isFavorite ? 'active' : '';

    card.innerHTML = `
        <div class="service-header">
            <div class="service-category">${service.category}</div>
            <button class="service-favorite ${favoriteClass}" onclick="toggleFavorite(${service.service})" title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                <i class="${favoriteIcon}"></i>
            </button>
        </div>
        <div class="service-title">
            <h3>${serviceName}</h3>
            ${serviceDescription ? `<p class="service-description">${serviceDescription}</p>` : ''}
        </div>
        <div class="service-details">
            <div class="detail-item">
                <span class="detail-label">Tipo</span>
                <span class="detail-value">${service.type}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Mínimo</span>
                <span class="detail-value">${formatNumber(service.min)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Máximo</span>
                <span class="detail-value">${formatNumber(service.max)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Rate</span>
                <span class="detail-value">$${service.rate}</span>
            </div>
        </div>
        <div class="service-features">
            ${service.refill ? '<span class="badge badge-success"><i class="fas fa-sync"></i> Refill</span>' : ''}
            ${service.cancel ? '<span class="badge badge-warning"><i class="fas fa-times-circle"></i> Cancelable</span>' : ''}
        </div>
        <div class="service-price">
            <span class="price-label">Precio por 1000</span>
            <span class="price-value">$${finalPrice}</span>
        </div>
        <div class="service-actions">
            <button class="btn btn-primary btn-block" onclick="orderService(${service.service})">
                <i class="fas fa-shopping-cart"></i>
                Ordenar Ahora
            </button>
        </div>
    `;

    return card;
}

// Limpiar nombre del servicio
function cleanServiceName(name) {
    // Extraer la parte principal antes de los corchetes o pipes
    const match = name.match(/^([^\[\|]+)/);
    return match ? match[1].trim() : name;
}

// Extraer descripción del servicio
function extractServiceDescription(name) {
    // Extraer todo después del nombre principal
    const mainName = cleanServiceName(name);
    let description = name.replace(mainName, '').trim();
    
    // Limpiar corchetes y pipes, reemplazar con separadores
    description = description
        .replace(/[\[\]]/g, '')  // Quitar corchetes
        .replace(/\|/g, '•')     // Reemplazar pipes con bullets
        .replace(/\s+/g, ' ')    // Normalizar espacios
        .trim();
    
    // Si es muy largo, mostrar todo pero en múltiples líneas
    return description;
}

// Formatear números grandes
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

// Mostrar skeleton loading
function showServicesSkeleton() {
    const servicesGrid = document.getElementById('services-grid');
    if (!servicesGrid) return;

    const skeletons = Array(6).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-header">
                <div class="skeleton-title"></div>
                <div class="skeleton-badge"></div>
            </div>
            <div class="skeleton-details">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
            </div>
            <div class="skeleton-price"></div>
            <div class="skeleton-buttons">
                <div class="skeleton-button"></div>
                <div class="skeleton-button"></div>
            </div>
        </div>
    `).join('');

    servicesGrid.innerHTML = skeletons;
}

// Renderizar servicios en lotes para mejor rendimiento
async function renderServicesInBatches(services, container) {
    const BATCH_SIZE = 100; // Renderizar de 100 en 100 para máxima velocidad
    
    // Crear fragmento único para todos los servicios
    const fragment = document.createDocumentFragment();
    
    // Renderizar todos los servicios en el fragmento
    services.forEach(service => {
        const serviceCard = createOptimizedServiceCard(service);
        fragment.appendChild(serviceCard);
    });
    
    // Agregar todo de una vez al DOM
    container.appendChild(fragment);
    
    console.log(`✅ ${services.length} servicios cargados`);
}

// Estado de carga vacío
function showServicesEmpty() {
    const servicesGrid = document.getElementById('services-grid');
    if (!servicesGrid) return;

    servicesGrid.innerHTML = `
        <div class="services-empty">
            <div class="empty-icon">
                <i class="fas fa-box-open"></i>
            </div>
            <h3>No hay servicios disponibles</h3>
            <p>Estamos trabajando para traer más servicios pronto.</p>
            <button class="btn btn-primary" onclick="retryLoadServices()">
                <i class="fas fa-refresh"></i>
                Reintentar
            </button>
        </div>
    `;
}

// Estado de error
function showServicesError() {
    const servicesGrid = document.getElementById('services-grid');
    if (!servicesGrid) return;

    servicesGrid.innerHTML = `
        <div class="services-error">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error al cargar servicios</h3>
            <p>No se pudieron cargar los servicios. Verifica tu conexión.</p>
            <button class="btn btn-primary" onclick="retryLoadServices()">
                <i class="fas fa-refresh"></i>
                Reintentar
            </button>
        </div>
    `;
}

// Reintentar carga de servicios
async function retryLoadServices() {
    appState.services = [];
    await renderServices();
}

// Crear tarjeta de servicio (versión simple - fallback)
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.dataset.category = service.category;
    card.dataset.name = service.name.toLowerCase();
    card.dataset.serviceId = service.service;
    
    // Calcular precio con markup (ejemplo: 20% markup)
    const markup = 1.2;
    const finalPrice = (parseFloat(service.rate) * markup).toFixed(4);
    
    // Verificar si el servicio está en favoritos
    const isFavorite = appState.favoriteServices.includes(service.service);
    const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    const favoriteClass = isFavorite ? 'active' : '';
    
    card.innerHTML = `
        <div class="service-header">
            <div class="service-category">${service.category}</div>
            <button class="service-favorite ${favoriteClass}" onclick="toggleFavorite(${service.service})" title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                <i class="${favoriteIcon}"></i>
            </button>
        </div>
        <div class="service-name">${service.name}</div>
        <div class="service-details">
            <div><strong>Tipo:</strong> ${service.type}</div>
            <div><strong>Mín:</strong> ${service.min}</div>
            <div><strong>Máx:</strong> ${service.max}</div>
            <div><strong>Rate:</strong> $${service.rate}</div>
        </div>
        <div class="service-features">
            ${service.refill ? '<span class="badge badge-success">Refill</span>' : ''}
            ${service.cancel ? '<span class="badge badge-warning">Cancelable</span>' : ''}
        </div>
        <div class="service-price">$${finalPrice} por 1000</div>
        <div class="service-actions">
            <button class="btn btn-primary btn-block" onclick="orderService(${service.service})">
                <i class="fas fa-shopping-cart"></i>
                Ordenar Ahora
            </button>
        </div>
    `;
    
    return card;
}

// Actualizar estadísticas de servicios
function updateServicesStats() {
    const totalServices = appState.services.length;
    const categories = [...new Set(appState.services.map(s => s.category))];
    const avgPrice = totalServices > 0 
        ? appState.services.reduce((sum, s) => sum + parseFloat(s.rate), 0) / totalServices 
        : 0;
    
    const totalEl = document.getElementById('total-services');
    const categoriesEl = document.getElementById('categories-count');
    const avgPriceEl = document.getElementById('avg-price');
    
    console.log('Updating stats:', { totalServices, categories: categories.length, avgPrice });
    
    if (totalEl) totalEl.textContent = totalServices;
    if (categoriesEl) categoriesEl.textContent = categories.length;
    if (avgPriceEl) avgPriceEl.textContent = `$${avgPrice.toFixed(2)}`;
    
    // También actualizar el dashboard
    const dashboardServicesEl = document.getElementById('dashboard-services');
    if (dashboardServicesEl) dashboardServicesEl.textContent = totalServices;
}

// Actualizar filtro de categorías
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    
    const categories = [...new Set(appState.services.map(s => s.category))];
    
    // Limpiar opciones existentes (excepto la primera)
    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Filtrar servicios
function filterServices() {
    const searchTerm = document.getElementById('services-search')?.value.toLowerCase() || '';
    const selectedCategory = document.getElementById('category-filter')?.value || '';
    
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        const name = card.dataset.name || '';
        const category = card.dataset.category || '';
        
        const matchesSearch = name.includes(searchTerm);
        const matchesCategory = !selectedCategory || category === selectedCategory;
        
        card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });
}

// === FUNCIONES DE ÓRDENES ===

// Cargar órdenes del usuario
async function loadOrders() {
    // Por ahora simulamos órdenes vacías
    // En un panel real, esto consultaría la base de datos del usuario
    const ordersCount = {
        pending: 0,
        processing: 0,
        completed: 0
    };
    
    updateOrdersStats(ordersCount);
}

// Actualizar estadísticas de órdenes
function updateOrdersStats(stats) {
    const pendingEl = document.getElementById('pending-count');
    const processingEl = document.getElementById('processing-count');
    const completedEl = document.getElementById('completed-count');
    
    if (pendingEl) pendingEl.textContent = stats.pending;
    if (processingEl) processingEl.textContent = stats.processing;
    if (completedEl) completedEl.textContent = stats.completed;
}

// Ordenar servicio
function orderService(serviceId) {
    // Redirigir a la página de crear orden con el servicio preseleccionado
    switchPage('create-order');
    
    // Esperar a que la página se cargue
    setTimeout(() => {
        const serviceSelect = document.getElementById('create-service-select');
        if (serviceSelect) {
            serviceSelect.value = serviceId;
            serviceSelect.dispatchEvent(new Event('change'));
        }
    }, 100);
}

// Ver detalles del servicio
function viewServiceDetails(serviceId) {
    const service = appState.services.find(s => s.service === serviceId);
    if (!service) return;
    
    const details = `
        Servicio: ${service.name}
        Categoría: ${service.category}
        Tipo: ${service.type}
        Precio: $${service.rate}
        Mín: ${service.min} | Máx: ${service.max}
        Refill: ${service.refill ? 'Sí' : 'No'}
        Cancelable: ${service.cancel ? 'Sí' : 'No'}
    `;
    
    showToast(details, 'info');
}

// Actualizar órdenes
function refreshOrders() {
    loadOrders();
    showToast('Órdenes actualizadas', 'success');
}

// === FUNCIONES DE ÓRDENES CON BALANCE ===

// Verificar estado de sincronización
async function checkSyncStatus() {
    try {
        const response = await fetch('/api/services/sync-status');
        const status = await response.json();
        
        if (status.isSync) {
            console.log(`⏳ Sincronizando servicios: ${status.progress}% (${status.synced}/${status.total})`);
            showToast(`Sincronizando servicios: ${status.progress}%`, 'info');
            
            // Deshabilitar botón de crear orden
            const submitBtn = document.getElementById('submit-order-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i> Sincronizando ${status.progress}%`;
            }
            
            // Verificar de nuevo en 2 segundos
            setTimeout(checkSyncStatus, 2000);
        } else {
            console.log('✅ Servicios sincronizados - listo para crear órdenes');
            showToast('Servicios listos - puedes crear órdenes', 'success');
            
            // Habilitar botón de crear orden
            const submitBtn = document.getElementById('submit-order-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Crear Orden';
            }
        }
    } catch (error) {
        console.error('Error verificando sincronización:', error);
    }
}

// Configurar página de crear orden
function setupCreateOrderPage() {
    console.log('🛒 Configurando página de crear orden...');
    
    // Verificar estado de sincronización
    checkSyncStatus();
    
    // Poblar el select de servicios
    const serviceSelect = document.getElementById('create-service-select');
    const serviceSearch = document.getElementById('create-service-search');
    
    if (!serviceSelect) return;
    
    // Limpiar opciones existentes
    serviceSelect.innerHTML = '<option value="">Selecciona un servicio</option>';
    
    // Agregar servicios al select
    appState.services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.service;
        option.textContent = `${service.name} - $${(parseFloat(service.rate) * 1.2).toFixed(4)} - ${service.category}`;
        option.dataset.service = JSON.stringify(service);
        serviceSelect.appendChild(option);
    });
    
    console.log(`✅ ${appState.services.length} servicios agregados al select`);
    
    // Evento de cambio de servicio
    serviceSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (!selectedOption.dataset.service) {
            document.getElementById('service-details').style.display = 'none';
            document.getElementById('create-order-form').style.display = 'none';
            return;
        }
        
        const service = JSON.parse(selectedOption.dataset.service);
        showServiceDetails(service);
        showOrderForm(service);
    });
    
    // Búsqueda de servicios
    if (serviceSearch) {
        serviceSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const options = serviceSelect.options;
            
            for (let i = 1; i < options.length; i++) {
                const text = options[i].textContent.toLowerCase();
                options[i].style.display = text.includes(searchTerm) ? '' : 'none';
            }
        });
    }
    
    // Evento de submit del formulario
    const form = document.getElementById('create-order-form');
    if (form) {
        form.addEventListener('submit', handleCreateOrderSubmit);
    }
    
    // Evento de cambio de cantidad
    const quantityInput = document.getElementById('create-order-quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateCostSummary);
    }
}

// Mostrar detalles del servicio
function showServiceDetails(service) {
    document.getElementById('detail-category').textContent = service.category;
    document.getElementById('detail-type').textContent = service.type || 'Default';
    document.getElementById('detail-rate').textContent = `$${(parseFloat(service.rate) * 1.2).toFixed(4)}`;
    document.getElementById('detail-min').textContent = service.min;
    document.getElementById('detail-max').textContent = service.max;
    document.getElementById('service-details').style.display = 'block';
}

// Mostrar formulario de orden
function showOrderForm(service) {
    const form = document.getElementById('create-order-form');
    const quantityInput = document.getElementById('create-order-quantity');
    const quantityRange = document.getElementById('quantity-range');
    
    if (quantityInput) {
        quantityInput.min = service.min;
        quantityInput.max = service.max;
        quantityInput.placeholder = service.min;
        quantityRange.textContent = `Min: ${service.min} | Max: ${service.max}`;
    }
    
    // Actualizar balance en el resumen
    document.getElementById('summary-balance').textContent = `$${appState.balance.toFixed(4)}`;
    document.getElementById('summary-rate').textContent = `$${(parseFloat(service.rate) * 1.2).toFixed(4)}`;
    
    form.style.display = 'block';
    appState.selectedService = service;
}

// Actualizar resumen de costo
function updateCostSummary() {
    if (!appState.selectedService) return;
    
    const quantity = parseInt(document.getElementById('create-order-quantity').value) || 0;
    const rate = parseFloat(appState.selectedService.rate) * 1.2;
    const total = (quantity / 1000) * rate;
    const remaining = appState.balance - total;
    
    document.getElementById('summary-quantity').textContent = quantity.toLocaleString();
    document.getElementById('summary-total').textContent = `$${total.toFixed(4)}`;
    document.getElementById('summary-remaining').textContent = `$${remaining.toFixed(4)}`;
    
    // Cambiar color si no hay suficiente balance
    const remainingEl = document.getElementById('summary-remaining');
    const submitBtn = document.getElementById('submit-order-btn');
    
    if (remaining < 0) {
        remainingEl.style.color = 'var(--error-color)';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Balance Insuficiente';
    } else {
        remainingEl.style.color = 'var(--success-color)';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Crear Orden';
    }
}

// Manejar submit del formulario de crear orden
async function handleCreateOrderSubmit(e) {
    e.preventDefault();
    
    if (!appState.selectedService) {
        showToast('Por favor selecciona un servicio', 'error');
        return;
    }
    
    const link = document.getElementById('create-order-link').value.trim();
    const quantity = parseInt(document.getElementById('create-order-quantity').value);
    
    if (!link || !quantity) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
    
    console.log('Creando orden:', {
        service_id: appState.selectedService.service,
        link,
        quantity
    });
    
    try {
        console.log('📤 Enviando petición a /api/orders/create');
        console.log('📦 Datos:', {
            service_id: parseInt(appState.selectedService.service),
            link: link,
            quantity: parseInt(quantity)
        });
        
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                service_id: parseInt(appState.selectedService.service),
                link: link,
                quantity: parseInt(quantity)
            })
        });
        
        console.log('📥 Status de respuesta:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📋 Respuesta del servidor:', data);
        
        if (response.ok) {
            showToast('¡Orden creada exitosamente!', 'success');
            
            // Actualizar balance
            await loadBalance();
            
            // Limpiar formulario
            document.getElementById('create-order-form').reset();
            document.getElementById('create-service-select').value = '';
            document.getElementById('service-details').style.display = 'none';
            document.getElementById('create-order-form').style.display = 'none';
            
            // Redirigir a Mis Órdenes
            setTimeout(() => {
                switchPage('orders');
            }, 1500);
            
        } else {
            console.error('Error del servidor:', data);
            showToast(data.message || 'Error al crear la orden', 'error');
        }
        
    } catch (error) {
        console.error('Error creando orden:', error);
        showToast('Error de conexión: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Crear Orden';
    }
}

// Abrir modal de orden (DEPRECATED - usar página en su lugar)
function openOrderModal(service) {
    // Crear modal dinámicamente
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content order-modal">
            <div class="modal-header">
                <h3>Crear Orden</h3>
                <button class="modal-close" onclick="closeOrderModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="service-info">
                    <h4>${service.name}</h4>
                    <p><strong>Categoría:</strong> ${service.category}</p>
                    <p><strong>Tipo:</strong> ${service.type}</p>
                    <p><strong>Precio:</strong> $${(parseFloat(service.rate) * 1.2).toFixed(4)} por 1000</p>
                    <p><strong>Rango:</strong> ${service.min} - ${service.max}</p>
                </div>
                
                <form id="order-form" class="order-form">
                    <div class="form-group">
                        <label for="order-link">Link/URL *</label>
                        <input type="url" id="order-link" required placeholder="https://ejemplo.com/perfil">
                        <small>Ingresa el link del perfil, post o página</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="order-quantity">Cantidad *</label>
                        <input type="number" id="order-quantity" required 
                               min="${service.min}" max="${service.max}" 
                               placeholder="${service.min}">
                        <small>Min: ${service.min} | Max: ${service.max}</small>
                    </div>
                    
                    <div class="cost-calculation">
                        <div class="cost-row">
                            <span>Cantidad:</span>
                            <span id="calc-quantity">0</span>
                        </div>
                        <div class="cost-row">
                            <span>Precio por 1000:</span>
                            <span id="calc-rate">$${(parseFloat(service.rate) * 1.2).toFixed(4)}</span>
                        </div>
                        <div class="cost-row total">
                            <span>Total:</span>
                            <span id="calc-total">$0.0000</span>
                        </div>
                        <div class="cost-row balance">
                            <span>Tu balance:</span>
                            <span id="calc-balance">$${appState.balance.toFixed(4)}</span>
                        </div>
                        <div class="cost-row remaining">
                            <span>Balance restante:</span>
                            <span id="calc-remaining">$${appState.balance.toFixed(4)}</span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancel-order-btn">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="create-order-btn">
                    <i class="fas fa-shopping-cart"></i>
                    Crear Orden
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    const quantityInput = document.getElementById('order-quantity');
    quantityInput.addEventListener('input', () => updateOrderCalculation(service));
    
    const cancelBtn = document.getElementById('cancel-order-btn');
    cancelBtn.addEventListener('click', closeOrderModal);
    
    const createBtn = document.getElementById('create-order-btn');
    createBtn.addEventListener('click', () => createOrder(service.service));
    
    // Calcular inicial
    updateOrderCalculation(service);
    
    // Mostrar modal
    setTimeout(() => modal.classList.add('show'), 10);
}

// Cerrar modal de orden
function closeOrderModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Actualizar cálculo de orden
function updateOrderCalculation(service) {
    const quantity = parseInt(document.getElementById('order-quantity').value) || 0;
    const rate = parseFloat(service.rate) * 1.2; // Con markup
    const total = (quantity / 1000) * rate;
    const remaining = appState.balance - total;
    
    document.getElementById('calc-quantity').textContent = quantity.toLocaleString();
    document.getElementById('calc-total').textContent = `$${total.toFixed(4)}`;
    document.getElementById('calc-remaining').textContent = `$${remaining.toFixed(4)}`;
    
    // Cambiar color si no hay suficiente balance
    const remainingEl = document.getElementById('calc-remaining');
    const createBtn = document.getElementById('create-order-btn');
    
    if (remaining < 0) {
        remainingEl.style.color = 'var(--error-color)';
        createBtn.disabled = true;
        createBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Balance Insuficiente';
    } else {
        remainingEl.style.color = 'var(--success-color)';
        createBtn.disabled = false;
        createBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Crear Orden';
    }
}

// Crear orden
async function createOrder(serviceId) {
    const linkInput = document.getElementById('order-link');
    const quantityInput = document.getElementById('order-quantity');
    
    if (!linkInput || !quantityInput) {
        showToast('Error: Campos no encontrados', 'error');
        return;
    }
    
    const link = linkInput.value.trim();
    const quantity = parseInt(quantityInput.value);
    
    // Validaciones
    if (!link) {
        showToast('Por favor ingresa un link válido', 'error');
        linkInput.focus();
        return;
    }
    
    if (!quantity || quantity <= 0) {
        showToast('Por favor ingresa una cantidad válida', 'error');
        quantityInput.focus();
        return;
    }
    
    const createBtn = document.getElementById('create-order-btn');
    createBtn.disabled = true;
    createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
    
    console.log('Creando orden:', { service_id: serviceId, link, quantity });
    
    try {
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                service_id: parseInt(serviceId),
                link: link,
                quantity: parseInt(quantity)
            })
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (response.ok) {
            showToast('¡Orden creada exitosamente!', 'success');
            
            // Actualizar balance
            await loadBalance();
            
            // Cerrar modal
            closeOrderModal();
            
            // Redirigir a Mis Órdenes
            switchPage('orders');
            
        } else {
            console.error('Error del servidor:', data);
            showToast(data.message || 'Error al crear la orden', 'error');
        }
        
    } catch (error) {
        console.error('Error creando orden:', error);
        showToast('Error de conexión: ' + error.message, 'error');
    } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Crear Orden';
    }
}

// Mostrar modal de orden creada
function showOrderCreatedModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content success-modal">
            <div class="modal-header success">
                <i class="fas fa-check-circle"></i>
                <h3>¡Orden Creada!</h3>
            </div>
            <div class="modal-body">
                <div class="order-details">
                    <p><strong>ID de Orden:</strong> #${order.id}</p>
                    <p><strong>Servicio:</strong> ${order.service_name}</p>
                    <p><strong>Cantidad:</strong> ${order.quantity.toLocaleString()}</p>
                    <p><strong>Costo:</strong> $${parseFloat(order.charge).toFixed(4)}</p>
                    <p><strong>Estado:</strong> <span class="status-badge pending">${order.status}</span></p>
                </div>
                <div class="order-info">
                    <p><i class="fas fa-info-circle"></i> Tu orden está siendo procesada. Puedes ver el progreso en la sección "Mis Órdenes".</p>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="closeSuccessModal(); switchPage('orders')">
                    Ver Mis Órdenes
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeSuccessModal()">
                    Continuar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

// Cerrar modal de éxito
function closeSuccessModal() {
    const modal = document.querySelector('.success-modal').closest('.modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Cargar órdenes del usuario
async function loadUserOrders() {
    try {
        const response = await fetch('/api/orders/my-orders', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            appState.orders = data.orders;
            renderUserOrders(data.orders);
            updateOrdersStats(data.stats);
        } else {
            showToast('Error cargando órdenes', 'error');
        }
        
    } catch (error) {
        console.error('Error cargando órdenes:', error);
        showToast('Error de conexión', 'error');
    }
}

// Renderizar órdenes del usuario
function renderUserOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-orders">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No tienes órdenes aún</p>
                    <button class="btn btn-primary" onclick="switchPage('services')">
                        Ver Servicios
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>
                <div class="service-info">
                    <strong>${order.service_name}</strong>
                    <small>${order.category}</small>
                </div>
            </td>
            <td>
                <a href="${order.link}" target="_blank" class="link-preview">
                    ${order.link.length > 30 ? order.link.substring(0, 30) + '...' : order.link}
                </a>
            </td>
            <td>${order.quantity.toLocaleString()}</td>
            <td>
                <span class="status-badge ${order.status.toLowerCase().replace(' ', '-')}">
                    ${order.status}
                </span>
            </td>
            <td>$${parseFloat(order.charge).toFixed(4)}</td>
            <td>${new Date(order.fecha_creacion).toLocaleDateString()}</td>
            <td>
                <div class="order-actions">
                    <button class="btn btn-sm btn-secondary" onclick="viewOrderDetails(${order.id})">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Ver detalles de orden
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showOrderDetailsModal(data.order);
        } else {
            showToast('Error cargando detalles', 'error');
        }
        
    } catch (error) {
        console.error('Error cargando detalles:', error);
        showToast('Error de conexión', 'error');
    }
}

// Mostrar modal de detalles de orden
function showOrderDetailsModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content order-details-modal">
            <div class="modal-header">
                <h3>Detalles de Orden #${order.id}</h3>
                <button class="modal-close" onclick="closeOrderDetailsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-info-grid">
                    <div class="info-item">
                        <label>Servicio:</label>
                        <span>${order.service_name}</span>
                    </div>
                    <div class="info-item">
                        <label>Categoría:</label>
                        <span>${order.category}</span>
                    </div>
                    <div class="info-item">
                        <label>Link:</label>
                        <a href="${order.link}" target="_blank">${order.link}</a>
                    </div>
                    <div class="info-item">
                        <label>Cantidad:</label>
                        <span>${order.quantity.toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <label>Costo:</label>
                        <span>$${parseFloat(order.charge).toFixed(4)} ${order.currency}</span>
                    </div>
                    <div class="info-item">
                        <label>Estado:</label>
                        <span class="status-badge ${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>
                    </div>
                    ${order.start_count ? `
                        <div class="info-item">
                            <label>Inicio:</label>
                            <span>${order.start_count.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    ${order.remains ? `
                        <div class="info-item">
                            <label>Restante:</label>
                            <span>${order.remains.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    <div class="info-item">
                        <label>Creada:</label>
                        <span>${new Date(order.fecha_creacion).toLocaleString()}</span>
                    </div>
                    ${order.fecha_actualizacion !== order.fecha_creacion ? `
                        <div class="info-item">
                            <label>Actualizada:</label>
                            <span>${new Date(order.fecha_actualizacion).toLocaleString()}</span>
                        </div>
                    ` : ''}
                </div>
                ${order.notas ? `
                    <div class="order-notes">
                        <h4>Notas:</h4>
                        <p>${order.notas}</p>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeOrderDetailsModal()">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

// Cerrar modal de detalles
function closeOrderDetailsModal() {
    const modal = document.querySelector('.order-details-modal').closest('.modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Cancelar orden
async function cancelOrder(orderId) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta orden? Se reembolsará el monto a tu balance.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                reason: 'Cancelado por el usuario'
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Orden cancelada exitosamente', 'success');
            await loadBalance();
            await loadOrders();
        } else {
            showToast(data.message || 'Error al cancelar la orden', 'error');
        }

    } catch (error) {
        console.error('Error cancelando orden:', error);
        showToast('Error de conexión', 'error');
    }
}

// Sincronizar órdenes pendientes con SMMCoder
async function syncPendingOrders() {
    try {
        showLoading(true);
        const response = await fetch('/api/orders/sync', {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Sincronización completada exitosamente', 'success');
            await loadOrders();
        } else {
            showToast(data.message || 'Error en sincronización', 'error');
        }
    } catch (error) {
        console.error('Error en sincronización:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// FUNCIONES DE USUARIO Y AUTENTICACIÓN
// ============================================

// Verificar autenticación
async function checkAuth() {
    try {
        console.log(' Verificando autenticación...');
        const response = await fetch('/api/auth/profile', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            appState.user = data.user;
            updateUserInfo(data.user);
            console.log(' Usuario autenticado:', data.user.email);
            return true;
        }
        
        if (response.status === 401) {
            console.warn('No autenticado - redirigiendo a login');
            showToast('Sesión expirada. Por favor inicia sesión nuevamente.', 'warning');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        }
        
        return false;
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        return false;
    }
}

// Función para manejar logout
async function handleLogout() {
    if (!confirm('¿Estás seguro que deseas cerrar sesión?')) return;
    
    try {
        showLoading(true);
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            showToast('Sesión cerrada exitosamente', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        console.error('Error en logout:', error);
        window.location.href = '/';
    } finally {
        showLoading(false);
    }
}

// Cargar información del usuario
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/profile');
        
        if (!response.ok) {
            throw new Error('No se pudo cargar la información del usuario');
        }
        
        const data = await response.json();
        
        if (data.user) {
            // Actualizar nombre del usuario
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                userNameEl.textContent = data.user.nombre || 'Usuario';
            }
            
            // Actualizar rol del usuario
            const userRoleEl = document.getElementById('user-role');
            if (userRoleEl) {
                userRoleEl.textContent = data.user.rol === 'admin' ? 'Administrador' : 'Cliente';
            }
            
            // Mostrar opciones de admin si es administrador
            if (data.user.rol === 'admin') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = '';
                });
                
                // Cambiar icono del avatar para admin
                const userAvatar = document.querySelector('.user-avatar i');
                if (userAvatar) {
                    userAvatar.className = 'fas fa-crown';
                }
            }
            
            // Guardar info del usuario en el estado
            appState.user = data.user;
        }
    } catch (error) {
        console.error('Error cargando info del usuario:', error);
    }
}

// ============================================
// FUNCIONES DEL PANEL DE ADMINISTRACIÓN
// ============================================

// Cargar usuarios (admin)
async function loadAdminUsers() {
    try {
        showLoading(true);
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }
        
        const data = await response.json();
        renderAdminUsers(data.users);
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showToast('Error al cargar usuarios', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderizar tabla de usuarios
function renderAdminUsers(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-users" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>No hay usuarios registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.nombre || ''} ${user.apellido || ''}</td>
            <td>${user.email}</td>
            <td>$${parseFloat(user.balance).toFixed(2)}</td>
            <td><span class="badge badge-${user.rol === 'admin' ? 'primary' : 'secondary'}">${user.rol}</span></td>
            <td><span class="badge badge-${user.estado === 'activo' ? 'success' : 'warning'}">${user.estado}</span></td>
            <td>${new Date(user.fecha_registro).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editUserBalance(${user.id})">
                    <i class="fas fa-wallet"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="toggleUserStatus(${user.id}, '${user.estado}')">
                    <i class="fas fa-ban"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Refrescar usuarios
function refreshUsers() {
    loadAdminUsers();
}

// Cargar estadísticas de admin
async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Actualizar estadísticas en el dashboard
        const stats = data.stats;
        
        // Actualizar elementos del DOM si existen
        const totalUsersEl = document.querySelector('#admin-total-users');
        if (totalUsersEl) totalUsersEl.textContent = stats.total_usuarios || 0;
        
        const activeUsersEl = document.querySelector('#admin-active-users');
        if (activeUsersEl) activeUsersEl.textContent = stats.usuarios_activos || 0;
        
        const totalOrdersEl = document.querySelector('#admin-total-orders');
        if (totalOrdersEl) totalOrdersEl.textContent = stats.total_ordenes || 0;
        
        const totalBalanceEl = document.querySelector('#admin-total-balance');
        if (totalBalanceEl) totalBalanceEl.textContent = `$${parseFloat(stats.balance_total || 0).toFixed(2)}`;
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Editar balance de usuario
async function editUserBalance(userId) {
    const amount = prompt('Ingresa el monto a agregar (usa - para restar):');
    if (!amount) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
        showToast('Monto inválido', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`/api/admin/users/${userId}/balance`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: numAmount })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Balance actualizado exitosamente', 'success');
            refreshUsers();
        } else {
            showToast(data.message || 'Error al actualizar balance', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

// Cambiar estado de usuario
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'activo' ? 'suspendido' : 'activo';
    
    if (!confirm(`¿Cambiar estado a "${newStatus}"?`)) return;
    
    try {
        showLoading(true);
        const response = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Estado actualizado exitosamente', 'success');
            refreshUsers();
        } else {
            showToast(data.message || 'Error al actualizar estado', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// TRANSACCIONES (ADMIN)
// ============================================

// Cargar transacciones
async function loadAdminTransactions() {
    try {
        showLoading(true);
        const response = await fetch('/api/admin/transactions');
        
        if (!response.ok) {
            throw new Error('Error al cargar transacciones');
        }
        
        const data = await response.json();
        renderAdminTransactions(data.transactions);
        
    } catch (error) {
        console.error('Error cargando transacciones:', error);
        showToast('Error al cargar transacciones', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderizar tabla de transacciones
function renderAdminTransactions(transactions) {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-receipt" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>No hay transacciones registradas</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>${tx.id}</td>
            <td>${tx.nombre || 'N/A'}</td>
            <td>${tx.email || 'N/A'}</td>
            <td><span class="badge badge-${tx.tipo === 'recarga' ? 'success' : 'warning'}">${tx.tipo}</span></td>
            <td class="${tx.monto >= 0 ? 'text-success' : 'text-danger'}">$${parseFloat(tx.monto).toFixed(2)}</td>
            <td>${tx.descripcion || '-'}</td>
            <td>${new Date(tx.fecha_creacion).toLocaleString()}</td>
        </tr>
    `).join('');
}

// Refrescar transacciones
function refreshTransactions() {
    loadAdminTransactions();
}

// ============================================
// ÓRDENES (ADMIN)
// ============================================

// Cargar órdenes de admin
async function loadAdminOrders() {
    try {
        console.log('📊 Cargando órdenes de admin...');
        showLoading(true);
        const response = await fetch('/api/admin/orders');
        
        if (!response.ok) {
            throw new Error('Error al cargar órdenes');
        }
        
        const data = await response.json();
        console.log('📦 Órdenes recibidas:', data);
        console.log('📊 Total de órdenes:', data.orders?.length || 0);
        
        renderAdminOrders(data.orders);
        
    } catch (error) {
        console.error('❌ Error cargando órdenes:', error);
        showToast('Error al cargar órdenes: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Renderizar tabla de órdenes
function renderAdminOrders(orders) {
    console.log('🎨 Renderizando órdenes...', orders);
    const tbody = document.getElementById('admin-orders-table-body');
    
    if (!tbody) {
        console.error('❌ No se encontró el elemento admin-orders-table-body');
        return;
    }
    
    console.log('✅ Elemento tbody encontrado');
    
    if (!orders || orders.length === 0) {
        console.log('⚠️ No hay órdenes para mostrar');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>No hay órdenes registradas</p>
                </td>
            </tr>
        `;
        return;
    }
    
    console.log(`✅ Renderizando ${orders.length} órdenes`);
    
    tbody.innerHTML = orders.map(order => {
        const statusClass = {
            'Completed': 'success',
            'Pending': 'warning',
            'Processing': 'primary',
            'Canceled': 'danger',
            'Partial': 'warning'
        }[order.status] || 'secondary';
        
        return `
            <tr>
                <td>${order.id}</td>
                <td>${order.nombre || 'N/A'}</td>
                <td>${order.service_name || 'N/A'}</td>
                <td>${order.link ? order.link.substring(0, 30) + '...' : '-'}</td>
                <td>${order.quantity}</td>
                <td>$${parseFloat(order.charge).toFixed(2)}</td>
                <td><span class="badge badge-${statusClass}">${order.status}</span></td>
                <td>${new Date(order.fecha_creacion).toLocaleString()}</td>
            </tr>
        `;
    }).join('');
}

// Refrescar órdenes
function refreshAdminOrders() {
    loadAdminOrders();
}

// Procesar órdenes pendientes
async function processPendingOrders() {
    try {
        // Confirmar acción
        if (!confirm('¿Estás seguro de que quieres procesar todas las órdenes pendientes?\n\nEsto intentará enviarlas a la API de SMMCoder.')) {
            return;
        }
        
        console.log('🔄 Iniciando proceso de órdenes pendientes...');
        showLoading(true);
        
        const response = await fetch('/api/admin/orders/process-pending', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al procesar órdenes');
        }
        
        const result = await response.json();
        console.log('📊 Resultado:', result);
        
        // Mostrar resultado detallado
        let message = result.message;
        
        if (result.total > 0) {
            message += `\n\n✅ Procesadas: ${result.processed}\n❌ Fallidas: ${result.failed}\n📊 Total: ${result.total}`;
            
            // Mostrar detalles de errores si hay
            if (result.failed > 0 && result.results) {
                const failedOrders = result.results.filter(r => r.status === 'failed');
                if (failedOrders.length > 0) {
                    message += '\n\n❌ Órdenes con error:';
                    failedOrders.forEach(order => {
                        message += `\n  - Orden #${order.id}: ${order.error}`;
                    });
                }
            }
        }
        
        alert(message);
        
        // Recargar órdenes para ver cambios
        await loadAdminOrders();
        
        // Mostrar toast
        if (result.processed > 0) {
            showToast(`${result.processed} órdenes procesadas exitosamente`, 'success');
        } else if (result.total === 0) {
            showToast('No hay órdenes pendientes para procesar', 'info');
        } else {
            showToast('No se pudieron procesar las órdenes. Verifica los fondos en tu cuenta SMMCoder.', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error procesando órdenes:', error);
        showToast('Error al procesar órdenes: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// CONFIGURACIÓN (ADMIN)
// ============================================

// Cargar configuración
async function loadAdminConfig() {
    try {
        const response = await fetch('/api/admin/config');
        if (!response.ok) return;
        
        const data = await response.json();
        // Aquí puedes renderizar la configuración si es necesario
        console.log('Configuración cargada:', data);
        
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

// Guardar configuración
async function saveConfig(key, value) {
    try {
        showLoading(true);
        const response = await fetch('/api/admin/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Configuración guardada exitosamente', 'success');
        } else {
            showToast(data.message || 'Error al guardar configuración', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

// Manejar cambio de pestaña en admin
function switchAdminTab(tab) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.admin-tab-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar la pestaña seleccionada
    const tabContent = document.getElementById(`admin-${tab}-tab`);
    if (tabContent) {
        tabContent.style.display = 'block';
    }
    
    // Actualizar botones activos
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Cargar datos según la pestaña
    switch(tab) {
        case 'users':
            loadAdminUsers();
            break;
        case 'transactions':
            loadAdminTransactions();
            break;
        case 'orders':
            loadAdminOrders();
            break;
        case 'config':
            loadAdminConfig();
    }
}

// Exponer funcion globalmente
window.contactWhatsApp = contactWhatsApp;
window.switchPage = switchPage;
window.selectAmount = selectAmount;
window.requestRecharge = requestRecharge;
window.orderService = orderService;
window.viewServiceDetails = viewServiceDetails;
window.refreshOrders = refreshOrders;
window.checkOrderStatus = checkOrderStatus;
window.refreshData = refreshData;
window.openOrderModal = openOrderModal;
// ============================================
// CONFIGURACIÓN DE USUARIO
// ============================================

// Cargar configuración del usuario
async function loadUserSettings() {
    try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) return;
        
        const data = await response.json();
        const user = data.user;
        
        // Actualizar información de la cuenta
        document.getElementById('account-email').textContent = user.email || '-';
        document.getElementById('account-name').textContent = user.nombre || '-';
        document.getElementById('account-date').textContent = user.fecha_registro 
            ? new Date(user.fecha_registro).toLocaleDateString() 
            : '-';
        document.getElementById('account-balance').textContent = `$${parseFloat(user.balance || 0).toFixed(2)}`;
        
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

// Configurar eventos de la página de configuración
function setupSettingsEvents() {
    const form = document.getElementById('change-password-form');
    if (form) {
        form.addEventListener('submit', handleChangePassword);
    }
}

// Manejar cambio de contraseña
async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validaciones
    if (newPassword.length < 6) {
        showToast('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'warning');
        return;
    }
    
    if (currentPassword === newPassword) {
        showToast('La nueva contraseña debe ser diferente a la actual', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Error al cambiar contraseña');
        }
        
        showToast('Contraseña actualizada exitosamente', 'success');
        
        // Limpiar formulario
        event.target.reset();
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// EXPORTS
// ============================================

window.closeOrderModal = closeOrderModal;
window.createOrder = createOrder;
window.viewOrderDetails = viewOrderDetails;
window.cancelOrder = cancelOrder;
window.closeSuccessModal = closeSuccessModal;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.loadBalance = loadBalance;
window.syncPendingOrders = syncPendingOrders;
window.loadAdminConfig = loadAdminConfig;
window.saveConfig = saveConfig;
window.saveSettings = saveSettings;

// Función para guardar configuración desde el formulario
async function saveSettings() {
    try {
        showLoading(true);
        
        // Obtener valores del formulario
        const siteName = document.getElementById('site-name')?.value || 'FollowerPro';
        const defaultMarkup = document.getElementById('default-markup')?.value || '20';
        const openRegistration = document.getElementById('open-registration')?.value || 'true';
        const minRecharge = document.getElementById('min-recharge')?.value || '5';
        const maxRecharge = document.getElementById('max-recharge')?.value || '1000';
        const whatsappNumber = document.getElementById('whatsapp-number')?.value || '';
        
        // Guardar cada configuración
        const configs = [
            { key: 'sitio_nombre', value: siteName },
            { key: 'markup_default', value: defaultMarkup },
            { key: 'registro_abierto', value: openRegistration },
            { key: 'min_recarga', value: minRecharge },
            { key: 'max_recarga', value: maxRecharge },
            { key: 'whatsapp_numero', value: whatsappNumber }
        ];
        
        let success = true;
        for (const config of configs) {
            const response = await fetch('/api/admin/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                success = false;
                break;
            }
        }
        
        if (success) {
            showToast('Configuración guardada exitosamente', 'success');
        } else {
            showToast('Error al guardar algunas configuraciones', 'error');
        }
        
    } catch (error) {
        console.error('Error guardando configuración:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

// Mostrar/ocultar loading de página
function showPageLoading(show, message = 'Cargando...') {
    let loadingEl = document.querySelector('.page-loading');
    
    if (show) {
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'page-loading';
            document.querySelector('.main-content').appendChild(loadingEl);
        }
        loadingEl.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;
        loadingEl.style.display = 'block';
    } else {
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
}

// ==================== SISTEMA DE FILTROS Y FAVORITOS ====================

// Filtrar servicios
function filterServices() {
    const searchTerm = document.getElementById('services-search')?.value.toLowerCase() || '';
    const socialNetwork = document.getElementById('social-network-filter')?.value || '';
    const category = document.getElementById('category-filter')?.value || '';
    const type = document.getElementById('type-filter')?.value || '';
    const sortBy = document.getElementById('sort-filter')?.value || 'name';
    
    let filtered = appState.showingFavorites 
        ? appState.allServices.filter(s => appState.favoriteServices.includes(s.service))
        : [...appState.allServices];
    
    // Aplicar filtros
    if (searchTerm) {
        filtered = filtered.filter(service => 
            service.name.toLowerCase().includes(searchTerm) ||
            service.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtro de red social (nuevo)
    if (socialNetwork) {
        filtered = filtered.filter(service => 
            service.category.toLowerCase().includes(socialNetwork.toLowerCase()) ||
            service.name.toLowerCase().includes(socialNetwork.toLowerCase())
        );
    }
    
    if (category) {
        filtered = filtered.filter(service => 
            service.category.toLowerCase().includes(category.toLowerCase())
        );
    }
    
    if (type) {
        filtered = filtered.filter(service => 
            service.name.toLowerCase().includes(type.toLowerCase())
        );
    }
    
    // Ordenar
    switch(sortBy) {
        case 'price-asc':
            filtered.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
            break;
        case 'price-desc':
            filtered.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    appState.filteredServices = filtered;
    
    // Renderizar servicios filtrados
    const servicesGrid = document.getElementById('services-grid');
    if (servicesGrid) {
        servicesGrid.innerHTML = '';
        renderServicesInBatches(filtered, servicesGrid);
    }
    
    updateServicesStats(filtered);
}

// Limpiar filtros
function clearFilters() {
    const searchInput = document.getElementById('services-search');
    const socialNetworkFilter = document.getElementById('social-network-filter');
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (searchInput) searchInput.value = '';
    if (socialNetworkFilter) socialNetworkFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (sortFilter) sortFilter.value = 'name';
    
    appState.showingFavorites = false;
    
    // Actualizar botón de favoritos si existe
    const favBtn = document.querySelector('.filter-actions button[onclick="showFavorites()"]');
    if (favBtn) {
        favBtn.classList.remove('active');
        favBtn.innerHTML = `<i class="fas fa-heart"></i> Ver Favoritos (<span id="favorites-count">${appState.favoriteServices.length}</span>)`;
    }
    
    filterServices();
}

// Mostrar solo favoritos
function showFavorites() {
    appState.showingFavorites = !appState.showingFavorites;
    const btn = event.target.closest('button');
    if (appState.showingFavorites) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-heart"></i> Mostrando Favoritos';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = `<i class="fas fa-heart"></i> Ver Favoritos (<span id="favorites-count">${appState.favoriteServices.length}</span>)`;
    }
    filterServices();
}

// Toggle favorito
function toggleFavorite(serviceId) {
    const index = appState.favoriteServices.indexOf(serviceId);
    const isAdding = index === -1;
    
    if (index > -1) {
        appState.favoriteServices.splice(index, 1);
        showToast('Servicio eliminado de favoritos', 'info');
    } else {
        appState.favoriteServices.push(serviceId);
        showToast('Servicio agregado a favoritos', 'success');
    }
    localStorage.setItem('favoriteServices', JSON.stringify(appState.favoriteServices));
    updateFavoritesCount();
    
    // Actualizar UI del botón en la tarjeta actual
    const card = document.querySelector(`[data-service-id="${serviceId}"]`);
    if (card) {
        const btn = card.querySelector('.service-favorite');
        if (btn) {
            const isFavorite = appState.favoriteServices.includes(serviceId);
            btn.classList.toggle('active', isFavorite);
            btn.title = isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
            }
        }
    }
}

// Actualizar contador de favoritos
function updateFavoritesCount() {
    const countEl = document.getElementById('favorites-count');
    if (countEl) {
        countEl.textContent = appState.favoriteServices.length;
    }
}

// Actualizar estadísticas de servicios
function updateServicesStats(services) {
    const totalEl = document.getElementById('total-services');
    const filteredEl = document.getElementById('filtered-services');
    const avgPriceEl = document.getElementById('avg-price');
    
    if (totalEl) totalEl.textContent = appState.allServices.length;
    if (filteredEl) filteredEl.textContent = services.length;
    
    // Calcular precio promedio
    if (avgPriceEl && services.length > 0) {
        const avgPrice = services.reduce((sum, s) => sum + parseFloat(s.rate || 0), 0) / services.length;
        avgPriceEl.textContent = `$${avgPrice.toFixed(2)}`;
    }
}

// Exponer funciones globalmente
window.filterServices = filterServices;
window.clearFilters = clearFilters;
window.showFavorites = showFavorites;
window.toggleFavorite = toggleFavorite;
