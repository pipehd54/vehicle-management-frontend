# Vehicle Management Frontend 🚗🛠️

Aplicación web cliente (Single Page Application - SPA) construida con **HTML5, CSS3 y Vanilla JavaScript** para consumir la API REST del taller mecánico [vehicle-management-backend](https://github.com/pipet/vehicle-management-backend).

Este repositorio forma parte de un proyecto de portafolio para demostrar la comunicación independiente cliente-servidor con autenticación JWT y control de acceso basado en roles (RBAC).

---

## 🎨 Características

- **Autenticación e Inicio de Sesión:** Permite registrarse o iniciar sesión obteniendo un token JWT que se almacena en el cliente.
- **Diferenciación de Roles (RBAC en UI):**
  - **Mecánico:** Puede ver vehículos, registrar vehículos, agregar mantenimientos y cambiar estados (`pendiente`, `en_proceso`, `completado`).
  - **Administrador:** Además de las funciones anteriores, tiene habilitados los botones de eliminación de vehículos y órdenes de trabajo.
- **Gestión de Vehículos:** Listado con paginación (`skip`, `limit`) y registro de nuevos vehículos.
- **Gestión de Mantenimientos:** Filtrado de órdenes por vehículo en tiempo real.
- **Diseño Moderno y Responsivo:** CSS3 nativo con tema oscuro, notificaciones *toast*, tablas responsivas y badges de estado.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico**
- **CSS3 Nativo** (Variables CSS, Flexbox, Grid, Animaciones)
- **Vanilla JavaScript ES6+** (`Fetch API`, `Async/Await`, Manipulación del DOM)

---

## 🚀 Cómo ejecutar localmente

1. Clona este repositorio en una carpeta independiente:
   ```bash
   git clone https://github.com/tu-usuario/vehicle-management-frontend.git
   ```

2. Asegúrate de que el Backend (`vehicle-management-backend`) esté ejecutándose en `http://localhost:8000`.

3. Abre el archivo `index.html` en tu navegador preferido o utilízalo con una extensión como **Live Server** en VS Code.

---

## 🌐 Configurar para Producción (Vercel / Netlify / GitHub Pages)

1. En el archivo `config.js`, actualiza la URL base apuntando a tu API desplegada en Railway:
   ```javascript
   const CONFIG = {
       API_BASE_URL: 'https://tu-api-en-railway.up.railway.app'
   };
   ```

2. Despliega esta carpeta en **Vercel** o **Netlify** importando el repositorio de GitHub. ¡No requiere proceso de compilación (*build step*)!

---

## 🔗 Repositorio Backend

- **Backend REST API:** [vehicle-management-backend](https://github.com/pipet/vehicle-management-backend)
