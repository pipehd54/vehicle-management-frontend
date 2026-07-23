# Vehicle Management Client

Aplicación web cliente (Single Page Application - SPA) construida con **HTML5, CSS3 y Vanilla JavaScript** que consume la API REST del sistema de gestión de taller mecánico [vehicle-management-backend](https://github.com/pipehd54/vehicle-management-backend).

El proyecto demuestra una arquitectura cliente-servidor desacoplada con autenticación mediante Json Web Tokens (JWT), control de acceso basado en roles (RBAC) y un sistema de recomendaciones preventivas según el cronograma oficial del manual del propietario.

---

## Enlaces del Proyecto

- **Aplicación en Producción (Vercel):** [https://vehicle-management-frontend-ruby.vercel.app/](https://vehicle-management-frontend-ruby.vercel.app/)
- **API Backend en Producción (Railway):** [https://vehicle-management-backend-production-e9f4.up.railway.app](https://vehicle-management-backend-production-e9f4.up.railway.app/)
- **Documentación Swagger / OpenAPI:** [https://vehicle-management-backend-production-e9f4.up.railway.app/docs](https://vehicle-management-backend-production-e9f4.up.railway.app/docs)
- **Repositorio Backend:** [https://github.com/pipehd54/vehicle-management-backend](https://github.com/pipehd54/vehicle-management-backend)

---

## Características Principales

### Autenticación y Control de Acceso (RBAC)
- **Inicio de Sesión y Registro:** Gestión de sesiones persistentes mediante JWT (`localStorage`).
- **Rol Mecánico:** Permite visualizar vehículos, registrar unidades, actualizar kilometrajes y crear o modificar estados de órdenes de trabajo (`pendiente`, `en_proceso`, `completado`).
- **Rol Administrador:** Opciones avanzadas que incluyen permisos de eliminación para vehículos y órdenes de mantenimiento.

### Gestión de Vehículos y Mantenimientos
- **Categorización por Tipo:** Compatibilidad con carros y motocicletas, registrando marca, modelo, placa, fecha de compra y kilometraje actual.
- **Edición Dinámica:** Actualización de kilometraje en tiempo real con recálculo automático de intervalos.
- **Recomendación Inteligente de Mantenimiento:** Integración con el motor del backend para calcular el próximo servicio preventivo (kilometraje objetivo, kilómetros faltantes y plazo en días según el servicio anterior).

### Arquitectura de Interfaz y Diseño UX/UI
- **Diseño Responsivo (Mobile-First):** Layouts fluidos mediante CSS Grid y Flexbox adaptables a dispositivos móviles, tablets y monitores de escritorio.
- **Sistema de Iconos Vectoriales (SVG):** Iconografía integrada mediante vectores limpios para garantizar nitidez multiplataforma.
- **Tema Oscuro Profesional:** Paleta de colores neutros con alto contraste tipográfico y notificaciones emergentes de estado (*Toast Alerts*).

---

## Tecnologías Utilizadas

- **HTML5 Semántico:** Estructura modular y accesible.
- **CSS3 Nativo:** Variables CSS, Flexbox, CSS Grid y Media Queries sin dependencias externas.
- **JavaScript ES6+:** Manipulación asíncrona del DOM (`Fetch API`, `Async/Await`, `Event Loop`).

---

## Estructura del Proyecto

```text
vehicle-management-frontend/
├── index.html       # Estructura principal de la aplicación SPA
├── styles.css       # Sistema de diseño, variables CSS y estilos responsive
├── app.js           # Lógica de la aplicación, peticiones API y manejo de estado
├── config.js        # Configuración de URLs de producción y entorno local
└── README.md        # Documentación del proyecto
```

---

## Ejecución en Entorno Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/pipehd54/vehicle-management-frontend.git
   ```

2. Accede al directorio del proyecto:
   ```bash
   cd vehicle-management-frontend
   ```

3. Revisa el archivo `config.js` y asegúrate de que Apunte a tu servidor local (`http://localhost:8000`) o a la API en producción.

4. Abre el archivo `index.html` en un navegador web o ejecútalo mediante una extensión de servidor estático como **Live Server**.

---

## Licencia y Uso

Este proyecto ha sido desarrollado con fines de portafolio y demostración de arquitectura de software web.
