# 🔐 Guía: Cambio de Contraseña

## ✅ Implementación Completada

Se ha implementado un sistema completo de cambio de contraseña para usuarios logueados.

---

## 🎯 Características

### Para Usuarios:
- ✅ Cambiar contraseña desde el panel
- ✅ Ver información de la cuenta
- ✅ Validación de contraseña actual
- ✅ Confirmación de nueva contraseña
- ✅ Mínimo 6 caracteres

### Para Administradores:
- ✅ Script para cambiar contraseña desde terminal
- ✅ Cambiar contraseña de cualquier admin
- ✅ Sin necesidad de conocer la contraseña actual

---

## 📋 Cómo Usar (Usuarios)

### Paso 1: Acceder a Configuración
1. Inicia sesión en el panel
2. Haz clic en **"Configuración"** en el menú lateral
3. Verás la página de configuración de cuenta

### Paso 2: Cambiar Contraseña
1. En la sección **"Cambiar Contraseña"**:
   - Ingresa tu **contraseña actual**
   - Ingresa tu **nueva contraseña** (mínimo 6 caracteres)
   - Confirma la **nueva contraseña**
2. Haz clic en **"Cambiar Contraseña"**
3. ¡Listo! Tu contraseña ha sido actualizada

### Validaciones:
- ✅ La contraseña actual debe ser correcta
- ✅ La nueva contraseña debe tener mínimo 6 caracteres
- ✅ Las contraseñas deben coincidir
- ✅ La nueva contraseña debe ser diferente a la actual

---

## 🛡️ Cómo Usar (Administradores)

### Cambiar Contraseña desde Terminal:

```bash
node cambiar-password-admin.js
```

### Ejemplo de Uso:
```
🔐 CAMBIAR CONTRASEÑA DE ADMINISTRADOR
==================================================

📧 Email del administrador: admin@panelsmm.com
✅ Usuario encontrado: Administrador (admin@panelsmm.com)

🔑 Nueva contraseña: MiNuevaPassword123
🔑 Confirma la contraseña: MiNuevaPassword123

🔄 Hasheando contraseña...
✅ ¡Contraseña actualizada exitosamente!

📋 Nuevas credenciales:
   Email: admin@panelsmm.com
   Contraseña: MiNuevaPassword123

💡 Guarda estas credenciales en un lugar seguro
```

---

## 📁 Archivos Modificados/Creados

### Backend:
1. **`routes/auth.js`**
   - ✅ Endpoint `/api/auth/change-password` (ya existía)
   - ✅ Endpoint `/api/user/profile` (nuevo)

2. **`server.js`**
   - ✅ Ruta `/api/user` agregada

3. **`cambiar-password-admin.js`**
   - ✅ Script para cambiar contraseña de admin

### Frontend:
1. **`public/dashboard.html`**
   - ✅ Menú item "Configuración" agregado
   - ✅ Página de configuración completa
   - ✅ Formulario de cambio de contraseña
   - ✅ Información de la cuenta

2. **`public/login.html`**
   - ✅ Link "¿Olvidaste tu contraseña?" eliminado

3. **`public/js/app.js`**
   - ✅ Función `loadUserSettings()`
   - ✅ Función `setupSettingsEvents()`
   - ✅ Función `handleChangePassword()`
   - ✅ Integración con `loadPageData()`

4. **`public/css/style-purple.css`**
   - ✅ Estilos para `.settings-container`
   - ✅ Estilos para `.settings-card`
   - ✅ Estilos para `.settings-form`
   - ✅ Estilos para `.account-info`

---

## 🔒 Seguridad

### Medidas Implementadas:
1. ✅ **Verificación de contraseña actual** - El usuario debe conocer su contraseña actual
2. ✅ **Hashing con bcrypt** - Las contraseñas se hashean con bcrypt (10 rounds)
3. ✅ **Validación de sesión** - Solo usuarios autenticados pueden cambiar contraseña
4. ✅ **Validación de longitud** - Mínimo 6 caracteres
5. ✅ **Confirmación de contraseña** - Evita errores de tipeo
6. ✅ **Logs de auditoría** - Se registra el cambio de contraseña en logs_sistema

---

## 📊 Información de la Cuenta

En la página de configuración, los usuarios pueden ver:
- 📧 **Email** - Email de la cuenta
- 👤 **Nombre** - Nombre completo
- 📅 **Fecha de Registro** - Cuándo se creó la cuenta
- 💰 **Balance Actual** - Saldo disponible

---

## ⚠️ Notas Importantes

### Para Usuarios:
- ❌ **NO hay recuperación de contraseña** - Si olvidas tu contraseña, contacta al administrador
- ✅ **Guarda tu contraseña** - No hay forma de recuperarla automáticamente
- ✅ **Usa contraseñas seguras** - Combina letras, números y símbolos

### Para Administradores:
- ✅ **Puedes cambiar cualquier contraseña de admin** usando el script
- ✅ **No necesitas la contraseña actual** para usar el script
- ⚠️ **Solo funciona con cuentas de administrador**

---

## 🐛 Solución de Problemas

### Problema: "Contraseña actual incorrecta"
**Solución**: Verifica que estés ingresando la contraseña correcta. Si olvidaste tu contraseña, contacta al administrador.

### Problema: "Las contraseñas no coinciden"
**Solución**: Asegúrate de que la nueva contraseña y la confirmación sean exactamente iguales.

### Problema: "La contraseña debe tener al menos 6 caracteres"
**Solución**: Usa una contraseña más larga (mínimo 6 caracteres).

### Problema: El formulario no responde
**Solución**: 
1. Abre la consola del navegador (F12)
2. Busca errores
3. Recarga la página
4. Intenta nuevamente

---

## 🎯 Flujo Completo

```
Usuario → Configuración → Cambiar Contraseña
    ↓
Ingresa contraseña actual
    ↓
Ingresa nueva contraseña (mín. 6 caracteres)
    ↓
Confirma nueva contraseña
    ↓
Validaciones en Frontend
    ↓
Envío a /api/auth/change-password
    ↓
Validación de contraseña actual en Backend
    ↓
Hash de nueva contraseña (bcrypt)
    ↓
Actualización en base de datos
    ↓
Log de auditoría
    ↓
✅ Contraseña actualizada
```

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que estés logueado
2. Asegúrate de conocer tu contraseña actual
3. Si olvidaste tu contraseña, contacta al administrador
4. El administrador puede cambiar tu contraseña usando el script

---

**Última actualización**: 2025-10-06 21:07  
**Estado**: ✅ Completamente funcional
