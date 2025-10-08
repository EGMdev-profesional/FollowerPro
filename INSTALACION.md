# 🚀 Guía de Instalación Rápida - Landing Page SMM

## ⚡ Instalación de FollowerPro

Guía completa para instalar y configurar FollowerPro - Panel SMM Profesional

### 1. Instalar Node.js
- Descargar desde: https://nodejs.org/
- Versión recomendada: LTS (Long Term Support)

### 2. Instalar Dependencias
```bash
cd FollowerPro
npm install
```

### 3. Configurar WhatsApp
Edita el archivo `config.js` y cambia el número:
```javascript
WHATSAPP_NUMBER: '1234567890', // Tu número real sin espacios
```

### 4. Ejecutar la Landing Page
```bash
npm start
```

### 5. Abrir en Navegador
```
http://localhost:3000
```

## 📱 Configurar tu Número de WhatsApp

1. Abre el archivo `config.js`
2. Cambia `WHATSAPP_NUMBER` por tu número real
3. Formato: Solo números, sin espacios ni símbolos
4. Ejemplo: `'573001234567'` para +57 300 123 4567

## ❗ Problemas Comunes

### "Cannot find module"
```bash
npm install
```

### "WhatsApp no abre"
- Verifica que el número esté en formato correcto
- Asegúrate de incluir código de país

### "Puerto 3000 en uso"
Cambia el puerto en `package.json`:
```json
"start": "PORT=8080 node server.js"
```

## 🎨 Personalización

- **Precios**: Edita `config.js` sección `PRICING`
- **Colores**: Modifica `public/css/style.css` variables CSS
- **Textos**: Cambia contenido en `public/index.html`

---

**¡Tu landing page está lista!** 🎉
