# Vehicle Management Frontend 🚗🛠️

Aplicación web cliente (Single Page Application - SPA) construida con **HTML5, CSS3 y Vanilla JavaScript** para consumir la API REST del taller mecánico [vehicle-management-backend](https://github.com/pipehd54/vehicle-management-backend).

Este repositorio forma parte de un proyecto de portafolio para demostrar la comunicación independiente cliente-servidor con autenticación JWT y control de acceso basado en roles (RBAC).

---

## 🌐 Aplicación en Producción

- **Demo en Vivo (Vercel):** [https://vehicle-management-frontend-ruby.vercel.app/](https://vehicle-management-frontend-ruby.vercel.app/)
- **API Backend en Producción (Railway):** [https://vehicle-management-backend-production-e9f4.up.railway.app](https://vehicle-management-backend-production-e9f4.up.railway.app/)
- **Documentación Interactiva Swagger:** [https://vehicle-management-backend-production-e9f4.up.railway.app/docs](https://vehicle-management-backend-production-e9f4.up.railway.app/docs)

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

1. Clona este repositorio:
   ```bash
   git clone https://github.com/pipehd54/vehicle-management-frontend.git
   ```

2. Asegúrate de que el Backend (`vehicle-management-backend`) esté ejecutándose en `http://localhost:8000` o configura `config.js` apuntando a tu servidor de producción.

3. Abre el archivo `index.html` en tu navegador preferido o utilízalo con una extensión como **Live Server** en VS Code.

---

## 🔗 Enlaces Relacionados

- **Repositorio Backend:** [https://github.com/pipehd54/vehicle-management-backend](https://github.com/pipehd54/vehicle-management-backend)
