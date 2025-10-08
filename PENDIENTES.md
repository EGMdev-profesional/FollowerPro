# 📋 Tareas Pendientes - Panel Social Profesional

## ✅ COMPLETADO

1. ✅ Cambiar "Dashboard" por "Inicio"
2. ✅ Arreglar sidebar transparente
3. ✅ Menú no se cierra al tocar dentro
4. ✅ Indicador visual de sección activa
5. ✅ Funcionalidad "Recordarme"
6. ✅ Scrollbar personalizado
7. ✅ Loading spinner mejorado
8. ✅ Cambiar "SMM" por "Panel Social Profesional" en landing
9. ✅ Responsive mejorado en login/register/órdenes

## 🔄 PENDIENTES CRÍTICOS

### 1. Implementar Markup del 25%

**Ubicación:** `models/Order.js` línea 50-57

**Cambio actual:**
```javascript
let costoPorMil;
if (service.precio_final !== null && service.precio_final !== undefined) {
    costoPorMil = parseFloat(service.precio_final);
} else {
    const rate = parseFloat(service.rate);
    const markup = parseFloat(service.markup || 20);
    costoPorMil = rate * (1 + markup / 100);
}
```

**Cambiar a:**
```javascript
let costoPorMil;
if (service.precio_final !== null && service.precio_final !== undefined) {
    costoPorMil = parseFloat(service.precio_final);
} else {
    const rate = parseFloat(service.rate);
    const markup = 25; // MARKUP FIJO DEL 25%
    costoPorMil = rate * (1 + markup / 100);
}
```

### 2. Filtros en Servicios

**Archivos a modificar:**
- `public/dashboard.html` (agregar UI de filtros)
- `public/js/app.js` (agregar lógica de filtrado)
- `public/css/style-purple.css` (estilos de filtros)

**HTML a agregar en dashboard.html** (después de la línea 200):

```html
<!-- Filtros de Servicios -->
<div class="services-filters">
    <div class="filter-group">
        <label><i class="fas fa-search"></i> Buscar</label>
        <input type="text" id="service-search" placeholder="Buscar servicios..." class="filter-input">
    </div>
    
    <div class="filter-group">
        <label><i class="fas fa-layer-group"></i> Categoría</label>
        <select id="category-filter" class="filter-select">
            <option value="">Todas las categorías</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="Twitter">Twitter</option>
            <option value="Telegram">Telegram</option>
        </select>
    </div>
    
    <div class="filter-group">
        <label><i class="fas fa-tag"></i> Tipo</label>
        <select id="type-filter" class="filter-select">
            <option value="">Todos los tipos</option>
            <option value="Followers">Seguidores</option>
            <option value="Likes">Likes</option>
            <option value="Views">Views</option>
            <option value="Comments">Comentarios</option>
        </select>
    </div>
    
    <button class="btn btn-secondary" onclick="clearFilters()">
        <i class="fas fa-times"></i> Limpiar Filtros
    </button>
</div>
```

**CSS a agregar en style-purple.css:**

```css
/* Filtros de Servicios */
.services-filters {
    background: var(--card-background);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    margin-bottom: 2rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    box-shadow: var(--shadow);
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group label {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-input,
.filter-select {
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    font-size: 0.875rem;
    transition: var(--transition);
}

.filter-input:focus,
.filter-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* Botón de favorito en servicios */
.service-favorite {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
    z-index: 10;
}

.service-favorite:hover {
    background: var(--primary-color);
    color: white;
    transform: scale(1.1);
}

.service-favorite.active {
    background: var(--primary-color);
    color: white;
}

@media (max-width: 768px) {
    .services-filters {
        grid-template-columns: 1fr;
    }
}
```

**JavaScript a agregar en app.js:**

```javascript
// Variables globales para filtros
let allServices = [];
let filteredServices = [];
let favoriteServices = JSON.parse(localStorage.getItem('favoriteServices') || '[]');

// Función de filtrado
function filterServices() {
    const searchTerm = document.getElementById('service-search')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';
    const type = document.getElementById('type-filter')?.value || '';
    
    filteredServices = allServices.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm) || 
                            service.category.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || service.category.includes(category);
        const matchesType = !type || service.type.includes(type);
        
        return matchesSearch && matchesCategory && matchesType;
    });
    
    displayServices(filteredServices);
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('service-search').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('type-filter').value = '';
    filterServices();
}

// Toggle favorito
function toggleFavorite(serviceId) {
    const index = favoriteServices.indexOf(serviceId);
    if (index > -1) {
        favoriteServices.splice(index, 1);
    } else {
        favoriteServices.push(serviceId);
    }
    localStorage.setItem('favoriteServices', JSON.stringify(favoriteServices));
    
    // Actualizar UI
    const btn = document.querySelector(`[data-service-id="${serviceId}"] .service-favorite`);
    if (btn) {
        btn.classList.toggle('active');
    }
}

// Event listeners para filtros
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('service-search');
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterServices);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterServices);
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', filterServices);
    }
});
```

### 3. Balance Visible en Header

**Ubicación:** `public/dashboard.html` línea 79

**Agregar después de `<h1 class="page-title">Dashboard</h1>`:**

```html
<div class="header-balance">
    <i class="fas fa-wallet"></i>
    <span id="header-balance">$0.00</span>
</div>
```

**CSS:**
```css
.header-balance {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--gradient-primary);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    font-weight: 600;
    font-size: 1.125rem;
}
```

### 4. Mensaje "Cargando 4500+ servicios"

**Ubicación:** `public/js/app.js` función `loadServices`

**Cambiar:**
```javascript
showPageLoading(true, 'Cargando más de 4500 servicios...');
```

## 📝 CREDENCIALES

**Administrador:**
- Email: `admin@panelsmm.com`
- Password: `Admin123!`

## 🎯 PRIORIDAD DE IMPLEMENTACIÓN

1. ✅ Markup 25% (5 minutos)
2. ⏳ Balance en header (10 minutos)
3. ⏳ Mensaje "4500+ servicios" (2 minutos)
4. ⏳ Filtros completos (1-2 horas)

## 📌 NOTAS

- El proyecto está en Railway: https://followerpro-production.up.railway.app
- Repositorio: https://github.com/EGMdev-profesional/FollowerPro
- Base de datos MySQL en Railway

## 🚀 PARA CONTINUAR

1. Implementar cambios en orden de prioridad
2. Probar cada cambio en local antes de subir
3. Hacer commit y push a main
4. Railway hace deploy automático
5. Verificar en producción
