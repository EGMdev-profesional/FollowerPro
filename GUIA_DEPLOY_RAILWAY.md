# 🚀 Guía Completa: Deploy en Railway

## 📊 ANÁLISIS DEL PROYECTO

### 🏗️ Arquitectura del Proyecto

**Panel SMM (FollowerPro)** - Sistema completo de gestión de servicios de redes sociales

#### **Stack Tecnológico:**
- **Backend:** Node.js + Express.js
- **Base de Datos:** MySQL/MariaDB
- **Autenticación:** JWT + Express Sessions + bcryptjs
- **API Externa:** SMMCoder API (https://smmcoder.com/api/v2)
- **Frontend:** HTML5, CSS3, JavaScript Vanilla

#### **Estructura del Proyecto:**
```
PanelSud/
├── config/
│   └── database.js          # Configuración de MySQL con pool de conexiones
├── models/
│   ├── User.js              # Modelo de usuarios (registro, login, balance)
│   └── Order.js             # Modelo de órdenes (crear, actualizar, consultar)
├── routes/
│   ├── api.js               # Rutas de API SMMCoder (servicios, órdenes)
│   ├── auth.js              # Rutas de autenticación (login, registro)
│   ├── orders.js            # Rutas de gestión de órdenes
│   └── admin.js             # Rutas de administración
├── public/
│   ├── dashboard.html       # Panel principal del usuario
│   ├── login.html           # Página de login
│   ├── register.html        # Página de registro
│   ├── index.html           # Landing page
│   ├── css/                 # Estilos
│   └── js/                  # Scripts del frontend
├── database_schema.sql      # Schema completo de la BD
├── server.js                # Servidor principal
├── package.json             # Dependencias
└── .env                     # Variables de entorno
```

---

## 📋 ANÁLISIS DEL SCHEMA DE BASE DE DATOS

### **Tablas Principales:**

#### 1. **usuarios** (Gestión de usuarios)
- `id` - Primary Key
- `email` - Único, para login
- `password` - Hash bcrypt
- `nombre`, `apellido` - Datos personales
- `balance` - Saldo del usuario (DECIMAL 10,4)
- `rol` - ENUM('admin', 'usuario')
- `estado` - ENUM('activo', 'inactivo', 'suspendido')
- `api_key` - Para API propia (opcional)
- `fecha_registro`, `ultima_conexion`

#### 2. **servicios_cache** (Caché de servicios de SMMCoder)
- `id` - Primary Key
- `service_id` - ID del servicio en SMMCoder (UNIQUE)
- `name`, `type`, `category` - Información del servicio
- `rate` - Precio base del proveedor
- `min`, `max` - Límites de cantidad
- `refill`, `cancel` - Características del servicio
- `markup` - Margen de ganancia (default 20%)
- `precio_final` - Columna calculada: `rate * (1 + markup/100)`
- `activo` - Para activar/desactivar servicios

#### 3. **ordenes** (Órdenes de usuarios)
- `id` - Primary Key
- `usuario_id` - Foreign Key a usuarios
- `order_id` - ID de la orden en SMMCoder
- `service_id` - ID del servicio
- `link` - URL del perfil/post
- `quantity` - Cantidad solicitada
- `charge` - Costo cobrado al usuario
- `status` - Estado de la orden
- `start_count`, `remains` - Progreso de la orden

#### 4. **transacciones** (Historial financiero)
- `id` - Primary Key
- `usuario_id` - Foreign Key
- `tipo` - ENUM('recarga', 'gasto', 'refund', 'bonus')
- `monto` - Cantidad de la transacción
- `balance_anterior`, `balance_nuevo` - Auditoría
- `descripcion` - Detalle de la transacción
- `metodo_pago` - Método usado (PayPal, etc.)
- `orden_id` - Relación con orden (opcional)

#### 5. **logs_sistema** (Auditoría)
- Registra todas las acciones importantes
- `accion`, `descripcion`, `nivel` (info, warning, error, critical)
- `datos_adicionales` - JSON para metadata

#### 6. **configuracion** (Configuración del sistema)
- Almacena configuraciones dinámicas
- `clave`, `valor`, `tipo`, `categoria`

### **Características Avanzadas del Schema:**

✅ **Triggers automáticos:**
- `tr_actualizar_balance` - Actualiza balance al insertar transacción
- `tr_log_usuarios` - Registra cambios en balance

✅ **Vistas (Views):**
- `v_stats_usuarios` - Estadísticas de usuarios
- `v_stats_ordenes` - Estadísticas de órdenes

✅ **Índices optimizados:**
- Índices en campos frecuentemente consultados
- Foreign Keys con ON DELETE CASCADE/SET NULL

✅ **Columnas calculadas:**
- `precio_final` en servicios_cache (GENERATED ALWAYS AS)

---

## 🔑 FUNCIONALIDADES PRINCIPALES

### **1. Sistema de Usuarios:**
- ✅ Registro con validación
- ✅ Login con sesiones seguras
- ✅ Roles (admin/usuario)
- ✅ Gestión de balance
- ✅ Historial de transacciones

### **2. Gestión de Servicios:**
- ✅ Sincronización automática con SMMCoder API
- ✅ Caché local en BD (fallback si API falla)
- ✅ Sistema de markup configurable
- ✅ Activar/desactivar servicios

### **3. Sistema de Órdenes:**
- ✅ Crear órdenes desde el panel
- ✅ Consultar estado en tiempo real
- ✅ Historial completo de órdenes
- ✅ Descuento automático de balance
- ✅ Registro de transacciones

### **4. Panel de Administración:**
- ✅ Gestión de usuarios
- ✅ Recargas manuales
- ✅ Estadísticas del sistema
- ✅ Logs de auditoría
- ✅ Configuración del sistema

### **5. Integración SMMCoder API:**
- ✅ Balance
- ✅ Servicios
- ✅ Crear órdenes
- ✅ Consultar estado
- ✅ Refill
- ✅ Cancelar órdenes

---

## 🚂 PASOS PARA DESPLEGAR EN RAILWAY

### **PASO 1: Preparar el Proyecto**

#### 1.1 Crear archivo `.gitignore`
```
node_modules/
.env
*.log
.DS_Store
Thumbs.db
```

#### 1.2 Actualizar `package.json`
Asegúrate de tener:
```json
{
  "name": "smmcoder-subpanel",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "mysql2": "^3.6.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-session": "^1.17.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  }
}
```

#### 1.3 Crear repositorio Git
```bash
git init
git add .
git commit -m "Initial commit - Panel SMM"
```

---

### **PASO 2: Crear Cuenta en Railway**

1. Ve a [Railway.app](https://railway.app)
2. Haz clic en **"Start a New Project"**
3. Conecta tu cuenta de GitHub
4. Autoriza Railway

---

### **PASO 3: Subir Proyecto a GitHub**

#### 3.1 Crear repositorio en GitHub
1. Ve a [GitHub.com](https://github.com)
2. Clic en **"New Repository"**
3. Nombre: `panel-smm` (o el que prefieras)
4. **NO** inicialices con README
5. Clic en **"Create repository"**

#### 3.2 Subir código
```bash
git remote add origin https://github.com/TU_USUARIO/panel-smm.git
git branch -M main
git push -u origin main
```

---

### **PASO 4: Crear Proyecto en Railway**

1. En Railway, clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona tu repositorio `panel-smm`
4. Railway detectará automáticamente que es Node.js

---

### **PASO 5: Agregar Base de Datos MySQL**

#### 5.1 Agregar servicio MySQL
1. En tu proyecto de Railway, clic en **"+ New"**
2. Selecciona **"Database"**
3. Selecciona **"Add MySQL"**
4. Railway creará una instancia de MySQL

#### 5.2 Obtener credenciales
1. Clic en el servicio **MySQL**
2. Ve a la pestaña **"Variables"**
3. Copia estas variables (las necesitarás):
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_URL` (conexión completa)

---

### **PASO 6: Configurar Variables de Entorno**

#### 6.1 En Railway, ve a tu servicio de Node.js
1. Clic en la pestaña **"Variables"**
2. Clic en **"+ New Variable"**

#### 6.2 Agregar estas variables:

```env
# API de SMMCoder
SMMCODER_API_URL=https://smmcoder.com/api/v2
SMMCODER_API_KEY=0ba272f02c61164fb45eea31fbcde422

# Base de Datos (usar las de Railway MySQL)
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}

# Autenticación (generar strings seguros)
JWT_SECRET=railway_jwt_secret_super_seguro_2024_cambiar_esto
SESSION_SECRET=railway_session_secret_super_seguro_2024_cambiar_esto

# Servidor
PORT=3000
NODE_ENV=production

# Admin por defecto
ADMIN_EMAIL=admin@panelsmm.com
ADMIN_PASSWORD=Admin123!
```

**💡 Tip:** Railway permite usar referencias como `${{MySQL.MYSQL_HOST}}` para conectar servicios automáticamente.

---

### **PASO 7: Inicializar Base de Datos**

#### Opción A: Usar Railway CLI (Recomendado)

##### 7.1 Instalar Railway CLI
```bash
npm install -g @railway/cli
```

##### 7.2 Login en Railway
```bash
railway login
```

##### 7.3 Conectar al proyecto
```bash
railway link
```

##### 7.4 Conectar a MySQL
```bash
railway connect MySQL
```

##### 7.5 Importar schema
```bash
railway run mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < database_schema.sql
```

#### Opción B: Usar phpMyAdmin (Alternativa)

Si Railway ofrece phpMyAdmin:
1. Accede a phpMyAdmin desde Railway
2. Selecciona tu base de datos
3. Ve a **"Importar"**
4. Sube el archivo `database_schema.sql`
5. Clic en **"Continuar"**

#### Opción C: Crear script de inicialización

Crea `init-database.js`:
```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    const fs = require('fs');
    const schema = fs.readFileSync('./database_schema.sql', 'utf8');
    
    await connection.query(schema);
    console.log('✅ Base de datos inicializada');
    
    await connection.end();
}

initDatabase().catch(console.error);
```

Ejecutar:
```bash
railway run node init-database.js
```

---

### **PASO 8: Desplegar la Aplicación**

#### 8.1 Railway despliega automáticamente
- Cada push a `main` despliega automáticamente
- Puedes ver el progreso en la pestaña **"Deployments"**

#### 8.2 Verificar logs
```bash
railway logs
```

O en la interfaz web:
- Clic en tu servicio
- Pestaña **"Deployments"**
- Clic en el deployment activo
- Ver **"View Logs"**

---

### **PASO 9: Obtener URL Pública**

#### 9.1 Generar dominio
1. En tu servicio de Node.js
2. Pestaña **"Settings"**
3. Sección **"Networking"**
4. Clic en **"Generate Domain"**
5. Railway te dará una URL como: `https://tu-proyecto.up.railway.app`

#### 9.2 Dominio personalizado (Opcional)
1. En **"Settings"** → **"Networking"**
2. Clic en **"Custom Domain"**
3. Agrega tu dominio
4. Configura DNS según instrucciones

---

### **PASO 10: Verificar Funcionamiento**

#### 10.1 Acceder a la aplicación
```
https://tu-proyecto.up.railway.app
```

#### 10.2 Probar login
- Email: `admin@panelsmm.com`
- Password: `Admin123!`

#### 10.3 Verificar servicios
1. Ve a "Servicios"
2. Espera la sincronización
3. Deberían aparecer los servicios de SMMCoder

#### 10.4 Crear orden de prueba
1. Selecciona un servicio
2. Ingresa link y cantidad
3. Verifica que se descuente del balance

---

## 🔧 COMANDOS ÚTILES DE RAILWAY CLI

```bash
# Ver logs en tiempo real
railway logs

# Ejecutar comandos en el servidor
railway run [comando]

# Conectar a la base de datos
railway connect MySQL

# Ver variables de entorno
railway variables

# Abrir proyecto en navegador
railway open

# Ver estado del proyecto
railway status

# Reiniciar servicio
railway restart
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Problema 1: Error de conexión a BD**
**Síntomas:** `Cannot connect to database`

**Solución:**
1. Verifica que MySQL esté corriendo en Railway
2. Revisa las variables de entorno
3. Asegúrate de usar las referencias correctas: `${{MySQL.MYSQL_HOST}}`
4. Verifica logs: `railway logs`

### **Problema 2: Servicios no cargan**
**Síntomas:** Lista de servicios vacía

**Solución:**
1. Verifica API Key de SMMCoder en variables
2. Revisa que la tabla `servicios_cache` exista
3. Verifica logs del servidor
4. Prueba sincronización manual desde el panel

### **Problema 3: Sesiones no persisten**
**Síntomas:** Se desloguea constantemente

**Solución:**
1. Verifica `SESSION_SECRET` en variables
2. Asegúrate de que `cookie.secure` esté en `true` para HTTPS
3. Revisa configuración de CORS en `server.js`

### **Problema 4: Build falla**
**Síntomas:** Deployment failed

**Solución:**
```bash
# Verificar package.json
# Asegurar que "start" script existe
"scripts": {
  "start": "node server.js"
}

# Verificar versión de Node
"engines": {
  "node": ">=18.0.0"
}
```

### **Problema 5: Puerto incorrecto**
**Síntomas:** Application failed to respond

**Solución:**
```javascript
// En server.js, asegurar:
const PORT = process.env.PORT || 3000;
```

Railway asigna el puerto automáticamente vía `process.env.PORT`.

---

## 📊 MONITOREO Y MANTENIMIENTO

### **Ver métricas**
1. En Railway, clic en tu servicio
2. Pestaña **"Metrics"**
3. Verás: CPU, RAM, Network

### **Configurar alertas**
1. Pestaña **"Settings"**
2. **"Notifications"**
3. Configura webhooks o emails

### **Backups de BD**
```bash
# Conectar a MySQL
railway connect MySQL

# Crear backup
mysqldump -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > backup.sql

# Restaurar
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backup.sql
```

### **Actualizar código**
```bash
# Hacer cambios
git add .
git commit -m "Actualización"
git push origin main

# Railway despliega automáticamente
```

---

## 🔐 SEGURIDAD

### **Checklist de Seguridad:**

- [ ] Cambiar `ADMIN_PASSWORD` por defecto
- [ ] Generar `JWT_SECRET` y `SESSION_SECRET` únicos y largos
- [ ] Configurar `cookie.secure: true` en producción
- [ ] Habilitar HTTPS (Railway lo hace automáticamente)
- [ ] No exponer `.env` en el repositorio
- [ ] Configurar CORS correctamente
- [ ] Limitar intentos de login (rate limiting)
- [ ] Validar inputs en frontend y backend

### **Generar secrets seguros:**
```bash
# En terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📈 OPTIMIZACIONES

### **1. Habilitar compresión**
```javascript
const compression = require('compression');
app.use(compression());
```

### **2. Caché de servicios**
Ya implementado en `servicios_cache` table.

### **3. Rate limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de requests
});

app.use('/api/', limiter);
```

### **4. Logs estructurados**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 🎯 CHECKLIST FINAL DE DEPLOYMENT

Antes de considerar el deploy completo:

- [ ] Repositorio en GitHub creado
- [ ] Proyecto creado en Railway
- [ ] MySQL agregado y configurado
- [ ] Variables de entorno configuradas
- [ ] Base de datos inicializada con schema
- [ ] Aplicación desplegada exitosamente
- [ ] URL pública generada
- [ ] Login funciona correctamente
- [ ] Servicios se sincronizan desde SMMCoder
- [ ] Órdenes se pueden crear
- [ ] Balance se actualiza correctamente
- [ ] Panel de admin accesible
- [ ] Logs sin errores críticos
- [ ] HTTPS habilitado
- [ ] Contraseña de admin cambiada

---

## 💰 COSTOS DE RAILWAY

### **Plan Gratuito (Hobby):**
- $5 USD de crédito gratis/mes
- Suficiente para proyectos pequeños
- 512 MB RAM
- 1 GB Disco

### **Plan Pro:**
- $20 USD/mes
- Recursos escalables
- Soporte prioritario
- Dominios ilimitados

**💡 Tip:** El plan gratuito es suficiente para empezar y hacer pruebas.

---

## 📞 SOPORTE

### **Railway:**
- 📚 Docs: https://docs.railway.app
- 💬 Discord: https://discord.gg/railway
- 🐦 Twitter: @Railway

### **SMMCoder API:**
- 📚 Docs: https://smmcoder.com/api
- 📧 Soporte: Desde tu panel de SMMCoder

---

## 🎉 ¡FELICIDADES!

Si completaste todos los pasos, tu **Panel SMM está en producción en Railway** 🚀

### **Próximos pasos recomendados:**

1. ✅ Cambiar contraseña de administrador
2. ✅ Recargar saldo en SMMCoder
3. ✅ Configurar dominio personalizado
4. ✅ Configurar backups automáticos
5. ✅ Agregar Google Analytics (opcional)
6. ✅ Configurar notificaciones por email
7. ✅ Implementar sistema de tickets
8. ✅ Agregar más métodos de pago

---

## 📝 DIFERENCIAS: RAILWAY vs HOSTINGER

| Característica | Railway | Hostinger |
|---------------|---------|-----------|
| **Tipo** | PaaS (Platform as a Service) | Hosting tradicional |
| **Deploy** | Git push automático | FTP/SSH manual |
| **Base de datos** | MySQL incluido | phpMyAdmin incluido |
| **Escalabilidad** | Automática | Manual |
| **SSL** | Automático | Certbot manual |
| **Logs** | Dashboard integrado | SSH/archivos |
| **Precio inicial** | $5 gratis/mes | Desde $2.99/mes |
| **Facilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recomendación:** Railway es más fácil y moderno, ideal para desarrollo. Hostinger es más económico para producción a largo plazo.

---

**Última actualización:** 2025-10-07  
**Versión:** 1.0  
**Autor:** ElixirStudio

---

## 🔗 RECURSOS ADICIONALES

- [Railway Docs](https://docs.railway.app)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [MySQL Optimization](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [SMMCoder API Docs](https://smmcoder.com/api)

---

**¿Necesitas ayuda?** Revisa los logs con `railway logs` o consulta la documentación oficial.
