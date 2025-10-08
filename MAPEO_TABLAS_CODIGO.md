# 📊 MAPEO COMPLETO: SCHEMA ↔ CÓDIGO

## ✅ TABLAS Y SU CONEXIÓN CON EL CÓDIGO

### 1. **TABLA: `usuarios`**
**Schema:**
```sql
- id (PK)
- email (UNIQUE)
- password
- nombre
- apellido
- balance (DECIMAL 10,4)
- rol (enum: 'admin', 'usuario')
- estado (enum: 'activo', 'inactivo', 'suspendido')
- fecha_registro
- ultima_conexion
- api_key (UNIQUE)
- telefono
- pais
```

**Código conectado:**
- ✅ `models/User.js` - Modelo completo
- ✅ `routes/auth.js` - Login, registro, perfil
- ✅ `routes/admin.js` - Gestión de usuarios
- ✅ `server.js` - Creación de admin inicial

**Relaciones:**
- `ordenes.usuario_id` → `usuarios.id` (FK)
- `transacciones.usuario_id` → `usuarios.id` (FK)
- `logs_sistema.usuario_id` → `usuarios.id` (FK)

---

### 2. **TABLA: `servicios_cache`**
**Schema:**
```sql
- id (PK)
- service_id (UNIQUE) - ID del servicio en SMMCoder
- name (TEXT)
- type (VARCHAR 50)
- category (VARCHAR 100)
- rate (DECIMAL 10,4) - Precio base
- min (INT)
- max (INT)
- refill (TINYINT)
- cancel (TINYINT)
- descripcion (TEXT)
- activo (TINYINT)
- markup (DECIMAL 5,2) - Default 20%
- precio_final (DECIMAL 10,4) - CALCULADO: rate * (1 + markup/100)
- fecha_actualizacion
```

**Código conectado:**
- ✅ `routes/api.js` - GET /api/services (sincronización)
- ✅ `routes/api.js` - syncServicesToDatabase()
- ✅ `config/database.js` - Creación automática de tabla
- ✅ `models/Order.js` - Consulta para crear órdenes
- ✅ `public/js/app.js` - Frontend carga servicios

**Relaciones:**
- Ninguna FK directa (cache de API externa)
- Usado por `ordenes.service_id` (referencia lógica)

---

### 3. **TABLA: `ordenes`**
**Schema:**
```sql
- id (PK)
- usuario_id (FK → usuarios.id)
- order_id (INT) - ID de orden en SMMCoder
- service_id (INT) - Referencia a servicios_cache
- link (TEXT)
- quantity (INT)
- charge (DECIMAL 10,4) - Costo de la orden
- start_count (INT)
- status (VARCHAR 50) - 'Pending', 'Completed', etc.
- remains (INT)
- currency (VARCHAR 10)
- fecha_creacion
- fecha_actualizacion
- notas (TEXT)
```

**Código conectado:**
- ✅ `models/Order.js` - Modelo completo
- ✅ `routes/orders.js` - CRUD de órdenes
- ✅ `public/js/app.js` - Frontend crear/listar órdenes

**Relaciones:**
- `usuario_id` → `usuarios.id` (FK CASCADE)
- `service_id` → referencia lógica a `servicios_cache.service_id`
- `transacciones.orden_id` → `ordenes.id` (FK SET NULL)

---

### 4. **TABLA: `transacciones`**
**Schema:**
```sql
- id (PK)
- usuario_id (FK → usuarios.id)
- tipo (enum: 'recarga', 'gasto', 'refund', 'bonus')
- monto (DECIMAL 10,4)
- balance_anterior (DECIMAL 10,4)
- balance_nuevo (DECIMAL 10,4)
- descripcion (TEXT)
- metodo_pago (VARCHAR 50)
- referencia_externa (VARCHAR 100)
- orden_id (FK → ordenes.id)
- estado (enum: 'pendiente', 'completada', 'fallida', 'cancelada')
- fecha_creacion
- procesada_por (FK → usuarios.id)
```

**Código conectado:**
- ✅ `models/Order.js` - Crea transacción al crear orden
- ✅ `routes/admin.js` - Ajustes de balance
- ⚠️ **FALTA:** Modelo Transaction.js completo

**Relaciones:**
- `usuario_id` → `usuarios.id` (FK CASCADE)
- `orden_id` → `ordenes.id` (FK SET NULL)
- `procesada_por` → `usuarios.id` (FK SET NULL)

**Trigger:**
- `tr_actualizar_balance` - Actualiza balance en usuarios automáticamente

---

### 5. **TABLA: `sesiones`**
**Schema:**
```sql
- session_id (PK VARCHAR 128)
- expires (INT UNSIGNED)
- data (MEDIUMTEXT)
```

**Código conectado:**
- ✅ `server.js` - express-mysql-session
- ✅ Configuración de sesiones con MySQL

**Uso:**
- Almacena sesiones de usuarios
- Usado por express-session

---

### 6. **TABLA: `configuracion`**
**Schema:**
```sql
- id (PK)
- clave (UNIQUE VARCHAR 100)
- valor (TEXT)
- descripcion (TEXT)
- tipo (enum: 'string', 'number', 'boolean', 'json')
- categoria (VARCHAR 50)
- fecha_actualizacion
```

**Código conectado:**
- ✅ `routes/admin.js` - GET/PUT /api/admin/config
- ⚠️ **FALTA:** Modelo Config.js

**Datos iniciales:**
- sitio_nombre, sitio_descripcion
- markup_default, min_recarga, max_recarga
- whatsapp_numero, registro_abierto, mantenimiento

---

### 7. **TABLA: `logs_sistema`**
**Schema:**
```sql
- id (PK)
- usuario_id (FK → usuarios.id)
- accion (VARCHAR 100)
- descripcion (TEXT)
- ip_address (VARCHAR 45)
- user_agent (TEXT)
- datos_adicionales (JSON)
- nivel (enum: 'info', 'warning', 'error', 'critical')
- fecha_creacion
```

**Código conectado:**
- ✅ `models/User.js` - logAction()
- ✅ `models/Order.js` - Log al crear órdenes

**Relaciones:**
- `usuario_id` → `usuarios.id` (FK SET NULL)

**Trigger:**
- `tr_log_usuarios` - Log automático de cambios de balance

---

## 📊 VISTAS (VIEWS)

### 1. **`v_stats_usuarios`**
```sql
- total_usuarios
- admins
- usuarios_normales
- usuarios_activos
- balance_total
- balance_promedio
```

**Código:**
- ⚠️ **FALTA:** Usar en dashboard admin

### 2. **`v_stats_ordenes`**
```sql
- total_ordenes
- completadas
- pendientes
- en_proceso
- ingresos_totales
- orden_promedio
```

**Código:**
- ⚠️ **FALTA:** Usar en dashboard admin

---

## ✅ RESUMEN DE CONEXIONES

| Tabla | Modelo | Rutas | Frontend | Estado |
|-------|--------|-------|----------|--------|
| usuarios | ✅ User.js | ✅ auth.js, admin.js | ✅ app.js | ✅ COMPLETO |
| servicios_cache | ❌ | ✅ api.js | ✅ app.js | ✅ FUNCIONAL |
| ordenes | ✅ Order.js | ✅ orders.js | ✅ app.js | ✅ COMPLETO |
| transacciones | ⚠️ Parcial | ⚠️ Parcial | ❌ | ⚠️ INCOMPLETO |
| sesiones | ✅ express-session | ✅ server.js | ✅ | ✅ COMPLETO |
| configuracion | ❌ | ⚠️ admin.js | ❌ | ⚠️ INCOMPLETO |
| logs_sistema | ✅ User.logAction | ✅ | ❌ | ⚠️ PARCIAL |

---

## 🔧 PENDIENTES POR IMPLEMENTAR

### 1. **Modelo Transaction.js**
```javascript
// models/Transaction.js
class Transaction {
    static async create(userId, data) { }
    static async getByUserId(userId) { }
    static async getStats(userId) { }
}
```

### 2. **Modelo Config.js**
```javascript
// models/Config.js
class Config {
    static async get(key) { }
    static async set(key, value) { }
    static async getAll() { }
}
```

### 3. **Usar vistas en Admin Dashboard**
```javascript
// routes/admin.js
router.get('/stats', async (req, res) => {
    const userStats = await query('SELECT * FROM v_stats_usuarios');
    const orderStats = await query('SELECT * FROM v_stats_ordenes');
    // ...
});
```

---

## ✅ VERIFICACIÓN FINAL

**Tablas creadas:** ✅ Todas
**Relaciones (FK):** ✅ Todas configuradas
**Triggers:** ✅ Funcionando
**Vistas:** ✅ Creadas (falta usar)
**Código conectado:** ✅ 85% completo

**Sistema funcional para:**
- ✅ Login/Registro
- ✅ Crear órdenes
- ✅ Ver órdenes
- ✅ Balance
- ✅ Servicios
- ⚠️ Admin completo (falta usar vistas)
- ⚠️ Historial de transacciones (falta frontend)
