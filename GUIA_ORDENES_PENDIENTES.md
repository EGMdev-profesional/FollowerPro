# 📤 Guía: Procesar Órdenes Pendientes

## 🎯 ¿Qué hace esta funcionalidad?

Cuando creas una orden pero **no tienes fondos en tu cuenta de SMMCoder**, la orden se crea localmente pero no se envía a la API externa. Esta funcionalidad te permite **reenviar esas órdenes pendientes** una vez que hayas recargado tu cuenta.

---

## 🔍 ¿Cómo identificar órdenes pendientes?

Las órdenes pendientes tienen estas características:

- ✅ **Estado**: "Pending"
- ✅ **Order ID**: Comienza con "ORD-" (ID local, no externo)
- ✅ **Notas**: Puede tener "Pendiente de envío a API (fondos insuficientes en proveedor)"

---

## 🚀 ¿Cómo usar el botón "Procesar Pendientes"?

### Paso 1: Recarga tu cuenta de SMMCoder
Antes de procesar órdenes pendientes, asegúrate de tener fondos suficientes en tu cuenta de SMMCoder.

### Paso 2: Accede al Panel de Administración
1. Inicia sesión como administrador
2. Ve a la sección **"Administración"**
3. Haz clic en la pestaña **"Órdenes"**

### Paso 3: Procesar Órdenes
1. Haz clic en el botón **"Procesar Pendientes"** (botón amarillo con ícono de avión)
2. Confirma la acción en el diálogo que aparece
3. Espera a que el sistema procese las órdenes

### Paso 4: Ver Resultados
El sistema te mostrará un resumen:
```
✅ Procesadas: X
❌ Fallidas: Y
📊 Total: Z
```

---

## 📊 ¿Qué hace el sistema al procesar?

1. **Busca órdenes pendientes** (hasta 50 a la vez)
2. **Intenta enviar cada orden** a la API de SMMCoder
3. **Actualiza el estado** de las órdenes exitosas:
   - Cambia el `order_id` al ID externo de SMMCoder
   - Cambia el estado de "Pending" a "In progress"
   - Elimina las notas de error
4. **Registra errores** en las órdenes que fallan

---

## ⚠️ Casos de Error

### Error: "not_enough_funds"
**Causa**: No tienes fondos suficientes en SMMCoder  
**Solución**: Recarga tu cuenta de SMMCoder y vuelve a intentar

### Error: "Service not found"
**Causa**: El servicio ya no existe en SMMCoder  
**Solución**: Cancela la orden y crea una nueva con un servicio válido

### Error: "Invalid link"
**Causa**: El link proporcionado no es válido  
**Solución**: Cancela la orden y crea una nueva con un link correcto

---

## 🔄 Proceso Automático

El sistema procesa las órdenes con estas características:

- ⏱️ **Pausa entre órdenes**: 500ms (para no sobrecargar la API)
- 📊 **Límite por ejecución**: 50 órdenes
- 🔄 **Orden de procesamiento**: Por fecha de creación (más antiguas primero)
- ⚡ **Timeout**: 15 segundos por orden

---

## 💡 Consejos

1. **Verifica tu balance en SMMCoder** antes de procesar órdenes
2. **Procesa en horarios de baja demanda** para mejor rendimiento
3. **Revisa los logs del servidor** para ver detalles del proceso
4. **Actualiza la lista de órdenes** después de procesar para ver los cambios

---

## 📝 Logs del Servidor

Cuando procesas órdenes, verás en la consola del servidor:

```
🔄 Procesando órdenes pendientes...
📊 Encontradas 15 órdenes pendientes
📤 Procesando orden #14...
📡 Enviando orden #14 a SMMCoder API...
✅ Orden #14 procesada con ID externo: 123456
📤 Procesando orden #15...
❌ Error procesando orden #15: not_enough_funds
✅ Proceso completado: 1 exitosas, 1 fallidas
```

---

## 🎯 Ejemplo de Uso

### Escenario:
Tienes 5 órdenes pendientes porque no tenías fondos en SMMCoder.

### Pasos:
1. Recargas $50 en tu cuenta de SMMCoder
2. Vas al panel de admin → Órdenes
3. Haces clic en "Procesar Pendientes"
4. El sistema procesa las 5 órdenes
5. Resultado: 5 exitosas, 0 fallidas
6. Las órdenes ahora tienen estado "In progress" y un ID externo

---

## 🔧 Solución de Problemas

### Problema: El botón no hace nada
**Solución**: Abre la consola del navegador (F12) y busca errores

### Problema: Todas las órdenes fallan
**Solución**: Verifica que tu API key de SMMCoder sea correcta en el archivo `.env`

### Problema: Algunas órdenes se procesan y otras no
**Solución**: Revisa las notas de las órdenes fallidas para ver el error específico

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica tu configuración en `.env`
3. Asegúrate de tener fondos en SMMCoder
4. Verifica que los servicios existan en SMMCoder

---

**Última actualización:** 2025-10-06
