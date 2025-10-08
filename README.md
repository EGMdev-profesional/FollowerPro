# FollowerPro - Panel SMM Profesional

Panel SMM avanzado desarrollado con Node.js, Express, MySQL y tecnologías modernas para la gestión de servicios de redes sociales. Desarrollo de paneles SMM personalizados conectados a SMMCoder API.

## 🌟 Características

- **Landing Page Profesional**: diseño moderno y atractivo
- **Secciones Informativas**: Demo, características, precios y contacto
- **Integración WhatsApp**: Contacto directo con clientes potenciales
- **Responsive Design**: Optimizado para móvil y desktop
- **Planes de Precios**: Tres opciones de desarrollo
- **Call-to-Action**: Botones estratégicos para conversión

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API**: Axios para peticiones HTTP
- **Estilos**: CSS Grid/Flexbox + Variables CSS
- **Iconos**: Font Awesome 6

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- NPM o Yarn
- Cuenta activa en SMMCoder con API Key

## 🚀 Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd FollowerPro
   ```
2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar número de WhatsApp**

   Editar el archivo `config.js` con tu número:
   ```javascript
   WHATSAPP_NUMBER: '1234567890', // Cambiar por tu número real
   ```

4. **Ejecutar la aplicación**
   ```bash
   # Modo desarrollo
   npm run dev

   # Modo producción
   npm start
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🔧 Configuración de API

### Obtener API Key de SMMCoder

1. Inicia sesión en [SMMCoder.com](https://smmcoder.com)
2. Ve a la sección **API** en tu panel
3. Copia tu API Key
4. Pégala en el archivo `.env`

### Endpoints Disponibles

El panel utiliza los siguientes endpoints de SMMCoder:

- `GET /api/balance` - Consultar balance
- `GET /api/services` - Listar servicios
- `POST /api/order` - Crear nueva orden
- `GET /api/order/:id` - Consultar estado de orden
- `POST /api/refill` - Crear refill
- `POST /api/cancel` - Cancelar orden

## 📱 Funcionalidades

### Dashboard
- **Estadísticas en tiempo real**: Balance, órdenes totales, pendientes y completadas
- **Creación rápida de órdenes**: Formulario integrado con validación
- **Cálculo automático de costos**: Basado en cantidad y precio del servicio

### Servicios
- **Catálogo completo**: Todos los servicios disponibles con detalles
- **Filtrado inteligente**: Búsqueda por nombre o categoría
- **Información detallada**: Precios, límites, tipo y características

### Órdenes
- **Consulta de estado**: Por ID de orden individual
- **Historial**: Tabla con todas las órdenes (próximamente)
- **Acciones**: Refill y cancelación cuando esté disponible

### Balance
- **Vista en tiempo real**: Saldo actual de la cuenta
- **Actualización manual**: Botón de refresh
- **Múltiples displays**: En header y página dedicada

## 🎨 Personalización

### Colores y Temas
Puedes personalizar los colores editando las variables CSS en `/public/css/style.css`:

```css
:root {
    --primary-color: #6366f1;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    /* ... más variables */
}
```

### Agregar Nuevas Funcionalidades
1. Añadir rutas en `/routes/api.js`
2. Crear funciones en `/public/js/app.js`
3. Actualizar la interfaz en `/public/index.html`

## 🔒 Seguridad

- **Variables de entorno**: API Keys nunca expuestas al frontend
- **Validación de datos**: Tanto en frontend como backend
- **Manejo de errores**: Respuestas seguras sin exposición de datos sensibles

## 📊 Estructura del Proyecto

```
FollowerPro/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
├── routes/
│   └── api.js
├── .env.example
├── package.json
├── server.js
└── README.md
```

## 🐛 Solución de Problemas

### Error de Conexión API
- Verifica que tu API Key sea correcta
- Confirma que tienes saldo en tu cuenta SMMCoder
- Revisa la URL del endpoint en `.env`

### Servicios No Cargan
- Verifica la conexión a internet
- Comprueba que SMMCoder esté operativo
- Revisa los logs del servidor

### Órdenes No Se Crean
- Confirma que tienes saldo suficiente
- Verifica que la cantidad esté dentro de los límites
- Asegúrate de que el link sea válido

## 🚀 Despliegue

### Heroku
```bash
# Instalar Heroku CLI
heroku create tu-panel-smm
heroku config:set SMMCODER_API_KEY=tu_api_key
heroku config:set SMMCODER_API_URL=https://smmcoder.com/api/v2
git push heroku main
```

### VPS/Servidor Propio
```bash
# PM2 para producción
npm install -g pm2
pm2 start server.js --name "followerpro-panel"
pm2 startup
pm2 save
```

## 📈 Próximas Funcionalidades

- [ ] Historial completo de órdenes
- [ ] Sistema de notificaciones push
- [ ] Estadísticas avanzadas con gráficos
- [ ] Modo oscuro
- [ ] API propia para terceros
- [ ] Sistema de usuarios múltiples

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de [SMMCoder API](https://smmcoder.com/api)
2. Abre un issue en este repositorio
3. Contacta al desarrollador

---

**Desarrollado con ❤️ por ElixirStudio**

*¿Te gusta el proyecto? ¡Dale una ⭐ en GitHub!*
