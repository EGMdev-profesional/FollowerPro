# 🚀 Guía Completa: Deploy en Hostinger

## 📋 Requisitos Previos

### 1. Plan de Hostinger Adecuado
Necesitas uno de estos planes:
- ✅ **Business Hosting** (Recomendado)
- ✅ **Cloud Hosting**
- ✅ **VPS Hosting**

❌ **NO funciona con**: Shared Hosting básico (no tiene Node.js)

### 2. Acceso a Hostinger
- Email y contraseña de tu cuenta
- Acceso al panel hPanel
- Acceso FTP o SSH

---

## 🎯 PASO 1: Preparar el Proyecto Localmente

### 1.1 Crear archivo `.gitignore`

Crea un archivo `.gitignore` en la raíz del proyecto:

```
node_modules/
.env
*.log
.DS_Store
Thumbs.db
```

### 1.2 Crear archivo de producción `.env.production`

Crea un archivo `.env.production` (NO lo subas, es solo plantilla):

```env
# Configuración de la API de SMMCoder
SMMCODER_API_URL=https://smmcoder.com/api/v2
SMMCODER_API_KEY=TU_API_KEY_AQUI

# Configuración de Base de Datos (Hostinger)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_panelsmm
DB_USER=u123456789_panelsmm
DB_PASSWORD=TU_PASSWORD_AQUI

# Configuración de Autenticación
JWT_SECRET=GENERA_UN_STRING_ALEATORIO_LARGO_Y_SEGURO
SESSION_SECRET=GENERA_OTRO_STRING_ALEATORIO_DIFERENTE

# Configuración del servidor
PORT=3000
NODE_ENV=production

# Administrador por defecto
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD=CambiaEstaPassword123!
```

### 1.3 Actualizar `package.json`

Asegúrate de tener estos scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "init-db": "node init-database.js"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 1.4 Comprimir el proyecto

Comprime todo el proyecto en un archivo `.zip` **EXCEPTO**:
- ❌ `node_modules/`
- ❌ `.env` (el local)
- ❌ Archivos de log

---

## 🎯 PASO 2: Configurar Base de Datos en Hostinger

### 2.1 Acceder a hPanel
1. Inicia sesión en [Hostinger](https://www.hostinger.com)
2. Ve a **hPanel** → **Bases de datos** → **MySQL Databases**

### 2.2 Crear Base de Datos
1. Haz clic en **"Crear nueva base de datos"**
2. Nombre: `panelsmm` (o el que prefieras)
3. Usuario: Se creará automáticamente (ej: `u123456789_panelsmm`)
4. Contraseña: Genera una segura
5. Guarda estos datos:
   ```
   Host: localhost
   Database: u123456789_panelsmm
   Username: u123456789_panelsmm
   Password: [la que generaste]
   Port: 3306
   ```

### 2.3 Acceder a phpMyAdmin
1. Haz clic en **"Administrar"** en tu base de datos
2. Se abrirá phpMyAdmin
3. **Guarda esta URL** para después

---

## 🎯 PASO 3: Subir Archivos a Hostinger

### Opción A: Subir vía FTP (Más fácil)

#### 3.1 Obtener credenciales FTP
1. En hPanel, ve a **Archivos** → **Administrador de archivos**
2. O ve a **FTP Accounts** para crear/ver credenciales
3. Anota:
   ```
   Host: ftp.tudominio.com
   Username: u123456789
   Password: [tu password]
   Port: 21
   ```

#### 3.2 Conectar con FileZilla
1. Descarga [FileZilla](https://filezilla-project.org/)
2. Abre FileZilla
3. Conecta con las credenciales FTP
4. Navega a la carpeta `public_html` o `domains/tudominio.com/public_html`

#### 3.3 Subir archivos
1. Sube el archivo `.zip` del proyecto
2. O sube todos los archivos directamente (excepto `node_modules`)
3. Espera a que termine la subida

### Opción B: Subir vía SSH (Más rápido)

#### 3.1 Habilitar acceso SSH
1. En hPanel, ve a **Avanzado** → **SSH Access**
2. Habilita SSH
3. Anota las credenciales

#### 3.2 Conectar vía SSH
```bash
ssh u123456789@tudominio.com
```

#### 3.3 Subir archivos
Desde tu PC local:
```bash
scp -r PanelSud u123456789@tudominio.com:~/public_html/
```

---

## 🎯 PASO 4: Configurar el Servidor

### 4.1 Acceder vía SSH
```bash
ssh u123456789@tudominio.com
```

### 4.2 Navegar a la carpeta del proyecto
```bash
cd public_html
# o
cd domains/tudominio.com/public_html
```

### 4.3 Descomprimir (si subiste .zip)
```bash
unzip PanelSud.zip
cd PanelSud
```

### 4.4 Instalar dependencias
```bash
npm install --production
```

### 4.5 Crear archivo `.env`
```bash
nano .env
```

Pega la configuración (usa las credenciales de tu BD de Hostinger):
```env
SMMCODER_API_URL=https://smmcoder.com/api/v2
SMMCODER_API_KEY=73436bf7bb00c1a621fcb715c89aa407

DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_panelsmm
DB_USER=u123456789_panelsmm
DB_PASSWORD=TU_PASSWORD_AQUI

JWT_SECRET=tu_jwt_secret_super_seguro_123456789
SESSION_SECRET=tu_session_secret_super_seguro_987654321

PORT=3000
NODE_ENV=production

ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD=Admin123!
```

Guarda con `Ctrl+O`, Enter, `Ctrl+X`

---

## 🎯 PASO 5: Inicializar Base de Datos

### 5.1 Ejecutar script de inicialización
```bash
node init-database.js
```

Deberías ver:
```
✅ Conectado a la base de datos
✅ Tabla usuarios creada
✅ Tabla servicios_cache creada
✅ Tabla ordenes creada
✅ Usuario administrador creado
```

### 5.2 Verificar en phpMyAdmin
1. Abre phpMyAdmin
2. Selecciona tu base de datos
3. Verifica que existan las tablas:
   - usuarios
   - servicios_cache
   - ordenes
   - transacciones
   - logs_sistema
   - configuracion

---

## 🎯 PASO 6: Configurar PM2 (Process Manager)

### 6.1 Instalar PM2 globalmente
```bash
npm install -g pm2
```

### 6.2 Iniciar la aplicación con PM2
```bash
pm2 start server.js --name "panelsmm"
```

### 6.3 Configurar PM2 para auto-inicio
```bash
pm2 startup
pm2 save
```

### 6.4 Verificar que esté corriendo
```bash
pm2 status
pm2 logs panelsmm
```

---

## 🎯 PASO 7: Configurar Nginx/Apache

### Opción A: Nginx (Recomendado)

#### 7.1 Crear configuración de Nginx
```bash
sudo nano /etc/nginx/sites-available/panelsmm
```

Pega esto:
```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 7.2 Activar configuración
```bash
sudo ln -s /etc/nginx/sites-available/panelsmm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Opción B: Apache

#### 7.1 Habilitar módulos necesarios
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
```

#### 7.2 Crear configuración
```bash
sudo nano /etc/apache2/sites-available/panelsmm.conf
```

Pega esto:
```apache
<VirtualHost *:80>
    ServerName tudominio.com
    ServerAlias www.tudominio.com

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog ${APACHE_LOG_DIR}/panelsmm_error.log
    CustomLog ${APACHE_LOG_DIR}/panelsmm_access.log combined
</VirtualHost>
```

#### 7.3 Activar configuración
```bash
sudo a2ensite panelsmm.conf
sudo systemctl reload apache2
```

---

## 🎯 PASO 8: Configurar SSL (HTTPS)

### 8.1 Instalar Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### 8.2 Obtener certificado SSL
```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### 8.3 Verificar renovación automática
```bash
sudo certbot renew --dry-run
```

---

## 🎯 PASO 9: Verificar que Todo Funcione

### 9.1 Verificar el servidor
```bash
pm2 status
pm2 logs panelsmm
```

### 9.2 Probar en el navegador
1. Abre `https://tudominio.com`
2. Deberías ver la página de login
3. Inicia sesión con las credenciales de admin

### 9.3 Verificar servicios
1. Ve a "Servicios"
2. Espera a que se sincronicen desde SMMCoder API
3. Verifica que aparezcan los servicios

### 9.4 Crear una orden de prueba
1. Ve a "Crear Orden"
2. Selecciona un servicio
3. Crea una orden de prueba

---

## 🔧 Comandos Útiles de PM2

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs panelsmm

# Reiniciar aplicación
pm2 restart panelsmm

# Detener aplicación
pm2 stop panelsmm

# Eliminar aplicación
pm2 delete panelsmm

# Ver información detallada
pm2 show panelsmm

# Monitorear recursos
pm2 monit
```

---

## 🐛 Solución de Problemas

### Problema 1: "Cannot connect to database"
**Solución**:
1. Verifica credenciales en `.env`
2. Asegúrate de que la BD existe en phpMyAdmin
3. Verifica que el usuario tenga permisos

### Problema 2: "Port 3000 already in use"
**Solución**:
```bash
# Ver qué está usando el puerto
lsof -i :3000

# Matar el proceso
kill -9 [PID]

# O cambiar el puerto en .env
PORT=3001
```

### Problema 3: "Module not found"
**Solución**:
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install --production
```

### Problema 4: "Permission denied"
**Solución**:
```bash
# Dar permisos a la carpeta
chmod -R 755 /path/to/project
chown -R $USER:$USER /path/to/project
```

### Problema 5: PM2 no inicia al reiniciar servidor
**Solución**:
```bash
pm2 startup
pm2 save
```

---

## 📊 Monitoreo y Mantenimiento

### Logs del servidor
```bash
# Ver logs de PM2
pm2 logs panelsmm --lines 100

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver logs de Apache
sudo tail -f /var/log/apache2/access.log
sudo tail -f /var/log/apache2/error.log
```

### Backup de Base de Datos
```bash
# Crear backup
mysqldump -u usuario -p nombre_bd > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u usuario -p nombre_bd < backup_20250106.sql
```

### Actualizar el proyecto
```bash
# Detener PM2
pm2 stop panelsmm

# Actualizar archivos (vía FTP o Git)
# ...

# Instalar nuevas dependencias
npm install --production

# Reiniciar PM2
pm2 restart panelsmm
```

---

## 🎯 Checklist Final

Antes de considerar el deploy completo, verifica:

- [ ] Base de datos creada y configurada
- [ ] Archivo `.env` con credenciales correctas
- [ ] Dependencias instaladas (`npm install`)
- [ ] Base de datos inicializada (`node init-database.js`)
- [ ] PM2 corriendo (`pm2 status`)
- [ ] Nginx/Apache configurado
- [ ] SSL instalado (HTTPS)
- [ ] Login funciona
- [ ] Servicios se sincronizan
- [ ] Órdenes se pueden crear
- [ ] Panel de admin accesible

---

## 📞 Soporte Hostinger

Si tienes problemas específicos de Hostinger:
- 💬 Chat en vivo: https://www.hostinger.com
- 📧 Email: support@hostinger.com
- 📚 Base de conocimiento: https://support.hostinger.com

---

## 🎉 ¡Felicidades!

Si llegaste hasta aquí y todo funciona, **¡tu panel SMM está en producción!** 🚀

**Próximos pasos recomendados**:
1. Cambiar contraseña de admin
2. Recargar saldo en SMMCoder
3. Configurar backups automáticos
4. Configurar dominio personalizado
5. Agregar Google Analytics (opcional)

---

**Última actualización**: 2025-10-06  
**Versión**: 1.0
