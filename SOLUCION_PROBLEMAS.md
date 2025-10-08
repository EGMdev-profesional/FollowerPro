# 🔧 Solución de Problemas - FollowerPro

Guía para solucionar problemas comunes en FollowerPro - Panel SMM Profesional.

## 🚨 Problemas Identificados

### 1. Error de Conexión a Base de Datos
```
Error conectando a la base de datos: Access denied for user 'u969924544_papito'@'206.0.176.13'
```
### 2. Variables de Entorno Faltantes
El archivo `.env` no tiene las credenciales correctas de la base de datos.

## ✅ Soluciones Paso a Paso

### Paso 1: Verificar Credenciales en Hostinger

1. **Accede a tu panel de Hostinger**
2. **Ve a "Bases de Datos MySQL"**
3. **Verifica los siguientes datos:**
   - Base de datos: `u969924544_pepito`
   - Usuario: `u969924544_papito`
   - **Contraseña**: Verifica que sea correcta
   - **Host permitido**: Debe ser `%` (cualquier host) o tu IP específica

### Paso 2: Crear/Actualizar el archivo .env

Crea un archivo `.env` en la raíz del proyecto con estas variables:

```env
# Configuración de Base de Datos (Hostinger MariaDB)
DB_HOST=206.0.176.13
DB_PORT=3306
DB_NAME=u969924544_pepito
DB_USER=u969924544_papito
DB_PASSWORD=TU_PASSWORD_REAL_DE_HOSTINGER

# Configuración de Autenticación
JWT_SECRET=panel_smm_jwt_secret_2024_muy_seguro_cambiar
SESSION_SECRET=panel_smm_session_secret_2024_muy_seguro_cambiar

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Administrador por defecto
ADMIN_EMAIL=admin@panelsmm.com
ADMIN_PASSWORD=Admin123!

# API SMMCoder
SMMCODER_API_URL=https://smmcoder.com/api/v2
SMMCODER_API_KEY=73436bf7bb00c1a621fcb715c89aa407
```

### Paso 3: Solucionar el Problema de Acceso

**Opción A: Resetear Contraseña**
1. En Hostinger → Bases de Datos MySQL
2. Encuentra el usuario `u969924544_papito`
3. Haz clic en "Cambiar contraseña"
4. Establece una nueva contraseña segura
5. Actualiza el `.env` con la nueva contraseña

**Opción B: Verificar Permisos de Host**
1. Asegúrate de que el usuario tenga permisos para conectarse desde `%` (cualquier host)
2. Si no, agrega `%` o tu IP específica a los hosts permitidos

**Opción C: Crear Nuevo Usuario (si es necesario)**
1. Crea un nuevo usuario de base de datos
2. Asigna todos los permisos a la base `u969924544_pepito`
3. Actualiza las credenciales en el `.env`

### Paso 4: Verificar la Estructura de la Base de Datos

Asegúrate de que tu base de datos tenga las siguientes tablas:

```sql
-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    telefono VARCHAR(20),
    pais VARCHAR(50),
    balance DECIMAL(10,4) DEFAULT 0.0000,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario',
    estado ENUM('activo', 'inactivo', 'suspendido', 'eliminado') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP NULL
);

-- Tabla de transacciones
CREATE TABLE transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('recarga', 'gasto', 'reembolso') NOT NULL,
    monto DECIMAL(10,4) NOT NULL,
    balance_anterior DECIMAL(10,4) NOT NULL,
    balance_nuevo DECIMAL(10,4) NOT NULL,
    descripcion TEXT,
    metodo_pago VARCHAR(50),
    estado ENUM('pendiente', 'completada', 'fallida') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de órdenes
CREATE TABLE ordenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    service_id INT NOT NULL,
    link TEXT NOT NULL,
    quantity INT NOT NULL,
    charge DECIMAL(10,4) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    order_id INT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de logs del sistema
CREATE TABLE logs_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel ENUM('info', 'warning', 'error') DEFAULT 'info',
    datos_adicionales JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

### Paso 5: Probar la Conexión

Después de configurar el `.env`:

1. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

2. **Verifica que aparezcan estos mensajes:**
   ```
   ✅ Conectado a la base de datos MariaDB
   🚀 FollowerPro ejecutándose en http://localhost:3000
   👑 Panel de administración disponible
   ```

## 🔍 Comandos de Diagnóstico

Si sigues teniendo problemas, puedes probar la conexión manualmente:

```bash
# Instalar cliente MySQL (si no lo tienes)
npm install -g mysql

# Probar conexión directa
mysql -h 206.0.176.13 -u u969924544_papito -p u969924544_pepito
```

## 📞 Contacto con Soporte

Si el problema persiste:

1. **Contacta al soporte de Hostinger**
2. **Proporciona estos datos:**
   - Usuario de base de datos: `u969924544_papito`
   - Base de datos: `u969924544_pepito`
   - Error específico: "Access denied"
   - Solicita verificar permisos y contraseña

## ⚠️ Notas Importantes

- **NUNCA** subas el archivo `.env` a Git (ya está en `.gitignore`)
- **Cambia** las claves JWT y SESSION por valores únicos y seguros
- **Usa contraseñas fuertes** para la base de datos
- **Mantén actualizadas** las dependencias del proyecto

## 🎯 Resultado Esperado

Una vez solucionado, deberías ver:

```
✅ Conectado a la base de datos MariaDB
👑 Usuario administrador creado exitosamente
📧 Email: admin@panelsmm.com
🔑 Password: Admin123!
🚀 FollowerPro ejecutándose en http://localhost:3000
```
