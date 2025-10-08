# 🔧 Solución al Problema de Creación de Órdenes

## 📋 Problema Identificado

El error **"Servicio no encontrado o inactivo"** ocurre porque:

1. ❌ La tabla `servicios_cache` está **vacía** o no tiene el servicio solicitado
2. ❌ La columna `precio_final` puede no existir en la tabla
3. ❌ Los servicios de la API de SMMCoder no se han sincronizado correctamente

## 🎯 Solución Paso a Paso

### Paso 1: Verificar el Estado del Sistema

Ejecuta el script de diagnóstico:

```bash
node diagnostico-completo.js
```

Este script te dirá exactamente qué está mal y qué necesitas hacer.

### Paso 2: Corregir la Estructura de la Tabla

Si el diagnóstico indica problemas con la tabla, ejecuta:

```bash
node fix-servicios-cache.js
```

Este script:
- ✅ Verifica que la tabla `servicios_cache` exista
- ✅ Agrega la columna `precio_final` si no existe
- ✅ Agrega la columna `markup` si no existe
- ✅ Muestra servicios de ejemplo

### Paso 3: Sincronizar Servicios desde la API

1. **Inicia el servidor:**
   ```bash
   npm start
   ```

2. **Abre el panel en tu navegador:**
   ```
   http://localhost:3000
   ```

3. **Espera la sincronización automática:**
   - Al cargar la página, el sistema intentará cargar servicios desde la API de SMMCoder
   - Verás en la consola del servidor mensajes como:
     ```
     📡 Solicitando servicios de SMMCoder API...
     📥 Respuesta recibida: { success: true, count: 4523 }
     🔄 Iniciando sincronización de 4523 servicios...
     📊 Progreso: 100% (4523/4523)
     ✅ 4523 servicios sincronizados exitosamente
     ```

4. **Si la API no responde:**
   - El sistema intentará cargar servicios desde la BD local
   - Si no hay servicios locales, verás un error
   - Verifica tu configuración en `.env`:
     ```
     SMMCODER_API_URL=https://smmcoder.com/api/v2
     SMMCODER_API_KEY=tu_api_key_aqui
     ```

### Paso 4: Verificar que Todo Funcione

1. **Verifica en phpMyAdmin:**
   - Abre la tabla `servicios_cache`
   - Deberías ver miles de servicios
   - Verifica que el servicio que intentas usar existe

2. **Busca un servicio específico:**
   ```sql
   SELECT * FROM servicios_cache WHERE service_id = 1921;
   ```

3. **Intenta crear una orden:**
   - Selecciona un servicio
   - Ingresa un link válido
   - Ingresa una cantidad válida
   - Haz clic en "Crear Orden"

## 🔍 Verificación Manual en phpMyAdmin

Si quieres verificar manualmente:

```sql
-- Ver cuántos servicios hay
SELECT COUNT(*) as total FROM servicios_cache WHERE activo = 1;

-- Ver servicios de ejemplo
SELECT service_id, name, rate, markup, precio_final 
FROM servicios_cache 
WHERE activo = 1 
LIMIT 10;

-- Buscar un servicio específico por ID
SELECT * FROM servicios_cache WHERE service_id = 1921;

-- Buscar servicios por nombre
SELECT * FROM servicios_cache WHERE name LIKE '%TikTok%' LIMIT 10;
```

## 🐛 Problemas Comunes

### Problema 1: "precio_final is null"

**Solución:**
```bash
node fix-servicios-cache.js
```

### Problema 2: "Servicio no encontrado"

**Causas posibles:**
1. El servicio no existe en la API de SMMCoder
2. El servicio no se ha sincronizado a tu BD local
3. El servicio está inactivo

**Solución:**
1. Verifica que el servicio existe en la API
2. Ejecuta una sincronización manual
3. Verifica en phpMyAdmin: `SELECT * FROM servicios_cache WHERE service_id = [ID]`

### Problema 3: "API externa no responde"

**Solución:**
1. Verifica tu conexión a internet
2. Verifica que la API_URL y API_KEY sean correctas en `.env`
3. Prueba la API manualmente:
   ```bash
   curl -X POST https://smmcoder.com/api/v2 \
     -d "key=TU_API_KEY" \
     -d "action=services"
   ```

### Problema 4: "Balance insuficiente"

**Solución:**
1. Verifica tu balance: `SELECT balance FROM usuarios WHERE id = [TU_ID]`
2. Recarga saldo desde el panel de administración
3. O actualiza manualmente:
   ```sql
   UPDATE usuarios SET balance = 100.00 WHERE id = [TU_ID];
   ```

## 📊 Logs Útiles

### En el Servidor (Node.js)

Busca estos mensajes en la consola:

```
✅ Conectado a la base de datos MariaDB
✅ Tabla servicios_cache verificada/creada
📡 Solicitando servicios de SMMCoder API...
📥 Respuesta recibida: { success: true, count: 4523 }
🔄 Iniciando sincronización de 4523 servicios...
✅ 4523 servicios sincronizados exitosamente
```

### En el Navegador (Consola)

Busca estos mensajes:

```
📋 Creando orden: { service_id: 1921, link: "...", quantity: 98 }
✅ Orden creada: { order: { id: 123, ... } }
```

Si ves errores:
```
❌ Error creando orden: Servicio no encontrado o inactivo
```

## 🚀 Resumen Rápido

```bash
# 1. Diagnóstico
node diagnostico-completo.js

# 2. Corregir tabla (si es necesario)
node fix-servicios-cache.js

# 3. Iniciar servidor
npm start

# 4. Abrir navegador
# http://localhost:3000

# 5. Esperar sincronización automática
# (Ver consola del servidor)

# 6. Intentar crear orden
```

## 💡 Cambios Realizados

### 1. `models/Order.js`
- ✅ Agregado cálculo de respaldo para `precio_final`
- ✅ Mejor manejo de errores

### 2. `routes/api.js`
- ✅ Mejor manejo de errores en `/services`
- ✅ Fallback a BD local si API falla
- ✅ Logs más detallados

### 3. `public/js/app.js`
- ✅ Corregido endpoint de creación de órdenes
- ✅ Mejor manejo de errores
- ✅ Logs en consola para debugging

### 4. Scripts Nuevos
- ✅ `fix-servicios-cache.js` - Corrige estructura de tabla
- ✅ `diagnostico-completo.js` - Diagnóstico completo del sistema

## 📞 Soporte

Si después de seguir estos pasos sigues teniendo problemas:

1. Ejecuta `node diagnostico-completo.js` y copia el output completo
2. Revisa los logs del servidor
3. Revisa la consola del navegador (F12)
4. Verifica la tabla `servicios_cache` en phpMyAdmin

---

**Última actualización:** 2025-10-05
