# 🔧 Configurar API de SMMCoder

## ⚠️ IMPORTANTE: Para que funcionen los servicios

Para que el panel pueda conectarse a SMMCoder y mostrar los servicios reales, necesitas:

### 1. Crear archivo `.env`

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 2. Configurar tu API Key

Edita el archivo `.env` y cambia la API Key:

```env
# Configuración de la API de SMMCoder
SMMCODER_API_URL=https://smmcoder.com/api/v2
SMMCODER_API_KEY=73436bf7bb00c1a621fcb715c89aa407

# Configuración del servidor
PORT=3000
NODE_ENV=development
```

### 3. Configurar WhatsApp

Edita el archivo `config.js` y cambia el número:

```javascript
WHATSAPP_NUMBER: '573001234567', // Tu número real
```

### 4. Ejecutar el panel

```bash
npm start
```

## 🎯 Funcionalidades Implementadas

### ✅ **Páginas Funcionales:**
- **Demo Panel** - Página principal promocional
- **Servicios** - Consulta servicios reales de SMMCoder API
- **Mis Órdenes** - Sistema de órdenes (en desarrollo)
- **Recargar Saldo** - Solicitudes por WhatsApp
- **Características** - Info del panel
- **Precios** - Planes de desarrollo
- **Contactar** - WhatsApp directo

### 🔄 **API Integrada:**
- ✅ Consultar balance real
- ✅ Listar servicios reales
- ✅ Filtros por categoría
- ✅ Búsqueda de servicios
- ✅ Estadísticas automáticas
- ✅ Precios con markup

### 💰 **Sistema de Markup:**
Los precios se muestran con un 20% de markup sobre el precio de SMMCoder:
- Precio SMMCoder: $1.00
- Precio mostrado: $1.20

### 📱 **Multi-Usuario Ready:**
El panel está preparado para:
- Sistema de usuarios (login/registro)
- Balance individual por usuario
- Órdenes por usuario
- Historial personalizado

## 🚨 Próximos Pasos

Para convertir esto en un panel completo multi-usuario necesitarías:

1. **Base de datos** (MySQL/PostgreSQL)
2. **Sistema de autenticación** (JWT)
3. **Gestión de usuarios**
4. **Balance interno por usuario**
5. **Sistema de órdenes completo**
6. **Panel de administración**

¿Quieres que implemente alguna de estas funcionalidades?
