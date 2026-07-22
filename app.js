// --- ESTADO GLOBAL Y VARIABLES ---
let currentToken = localStorage.getItem('jwt_token') || null;
let currentUser = JSON.parse(localStorage.getItem('user_data') || 'null');
let isLoginMode = true;

let skip = 0;
const limit = 5;
let currentVehiculoId = null;

// --- INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarInterfazAuth();
    if (currentToken) {
        cargarVehiculos();
    }
});

// --- FUNCIONES DE NOTIFICACIÓN (TOASTS) ---
function mostrarNotificacion(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// --- MANEJO DE VISTAS Y ESTADO DE SESIÓN ---
function actualizarInterfazAuth() {
    const authPanel = document.getElementById('auth-panel');
    const appPanel = document.getElementById('app-panel');
    const userStatusBar = document.getElementById('user-status-bar');

    if (currentToken && currentUser) {
        authPanel.classList.add('hidden');
        appPanel.classList.remove('hidden');

        const roleClass = currentUser.rol === 'administrador' ? 'role-administrador' : 'role-mecanico';

        userStatusBar.innerHTML = `
            <span style="font-size: 0.9rem;">👤 <strong>${currentUser.email}</strong></span>
            <span class="role-badge ${roleClass}">${currentUser.rol}</span>
            <button class="btn btn-secondary" onclick="cerrarSesion()">Cerrar Sesión</button>
        `;
    } else {
        authPanel.classList.remove('hidden');
        appPanel.classList.add('hidden');
        userStatusBar.innerHTML = '';
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const toggleBtn = document.getElementById('toggle-auth-btn');
    const submitBtn = document.getElementById('auth-submit-btn');
    const roleGroup = document.getElementById('role-group');

    if (isLoginMode) {
        title.textContent = '🔑 Iniciar Sesión';
        toggleBtn.textContent = '¿No tienes cuenta? Regístrate';
        submitBtn.textContent = 'Ingresar al Taller';
        roleGroup.classList.add('hidden');
    } else {
        title.textContent = '📝 Crear Cuenta';
        toggleBtn.textContent = '¿Ya tienes cuenta? Inicia Sesión';
        submitBtn.textContent = 'Registrarse';
        roleGroup.classList.remove('hidden');
    }
}

function cerrarSesion() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    currentToken = null;
    currentUser = null;
    actualizarInterfazAuth();
    mostrarNotificacion('Sesión cerrada correctamente');
}

// --- PETICIONES DE AUTENTICACIÓN ---
async function handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const rol = document.getElementById('auth-role').value;

    try {
        if (isLoginMode) {
            // Login con OAuth2 Form-Data
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(`${CONFIG.API_BASE_URL}/usuarios/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error al iniciar sesión');

            currentToken = data.access_token;
            localStorage.setItem('jwt_token', currentToken);

            // Decodificar payload JWT para extraer email (sub) y determinar usuario
            const tokenPayload = JSON.parse(atob(currentToken.split('.')[1]));
            currentUser = { email: tokenPayload.sub, rol: 'mecanico' }; // Rol provisional

            // Intentar inferir si es admin probando endpoint o guardando el rol
            const savedRole = localStorage.getItem(`user_role_${tokenPayload.sub}`);
            if (savedRole) currentUser.rol = savedRole;

            localStorage.setItem('user_data', JSON.stringify(currentUser));
            actualizarInterfazAuth();
            cargarVehiculos();
            mostrarNotificacion('¡Bienvenido al taller!');

        } else {
            // Registro de usuario
            const res = await fetch(`${CONFIG.API_BASE_URL}/usuarios/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rol })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error al registrar usuario');

            // Guardar rol registrado localmente para recordarlo en el login
            localStorage.setItem(`user_role_${email}`, data.rol);
            mostrarNotificacion('Usuario registrado con éxito. Ahora inicia sesión.', 'success');
            toggleAuthMode();
        }
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

// --- GESTIÓN DE VEHÍCULOS ---
async function cargarVehiculos() {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/vehiculos/?skip=${skip}&limit=${limit}`);
        const vehiculos = await res.json();

        if (!res.ok) throw new Error('Error al cargar vehículos');

        const tbody = document.getElementById('vehicles-tbody');
        tbody.innerHTML = '';

        if (vehiculos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No hay vehículos registrados en esta página.</td></tr>`;
        } else {
            const esAdmin = currentUser && currentUser.rol === 'administrador';

            vehiculos.forEach(v => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>#${v.id}</strong></td>
                    <td><span style="font-family: monospace; font-weight: bold; color: var(--accent);">${v.placa}</span></td>
                    <td>${v.marca}</td>
                    <td>${v.modelo}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="verMantenimientos(${v.id}, '${v.placa}')">🛠️ Mantenimientos</button>
                        <button class="btn btn-danger" ${!esAdmin ? 'disabled title="Se requiere rol de Administrador"' : ''} onclick="eliminarVehiculo(${v.id})">🗑️ Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Paginación
        document.getElementById('prev-page-btn').disabled = skip === 0;
        document.getElementById('next-page-btn').disabled = vehiculos.length < limit;
        document.getElementById('page-indicator').textContent = `Página ${Math.floor(skip / limit) + 1}`;

    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

function cambiarPagina(direccion) {
    skip += direccion * limit;
    if (skip < 0) skip = 0;
    cargarVehiculos();
}

async function handleCreateVehicle(event) {
    event.preventDefault();
    const placa = document.getElementById('v-placa').value.trim().toUpperCase();
    const marca = document.getElementById('v-marca').value.trim();
    const modelo = document.getElementById('v-modelo').value.trim();

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/vehiculos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ placa, marca, modelo })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'No se pudo registrar el vehículo');

        mostrarNotificacion(`Vehículo ${data.placa} registrado con éxito`);
        document.getElementById('vehicle-form').reset();
        cargarVehiculos();
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

async function eliminarVehiculo(vehiculoId) {
    if (!confirm(`¿Estás seguro de eliminar el vehículo #${vehiculoId} y sus mantenimientos asociados?`)) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/vehiculos/${vehiculoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al eliminar vehículo');

        mostrarNotificacion(data.mensaje || 'Vehículo eliminado correctamente');
        cargarVehiculos();
        if (currentVehiculoId === vehiculoId) cerrarMantenimientos();

    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

// --- GESTIÓN DE MANTENIMIENTOS ---
async function verMantenimientos(vehiculoId, placa) {
    currentVehiculoId = vehiculoId;
    document.getElementById('m-vehiculo-id').value = vehiculoId;
    document.getElementById('maintenance-title').textContent = `🛠️ Mantenimientos del Vehículo: ${placa} (#${vehiculoId})`;
    document.getElementById('maintenance-section').classList.remove('hidden');

    // Scroll suave a la sección
    document.getElementById('maintenance-section').scrollIntoView({ behavior: 'smooth' });

    cargarMantenimientosVehiculo(vehiculoId);
}

function cerrarMantenimientos() {
    document.getElementById('maintenance-section').classList.add('hidden');
    currentVehiculoId = null;
}

async function cargarMantenimientosVehiculo(vehiculoId) {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/mantenimientos/?vehiculo_id=${vehiculoId}&skip=0&limit=50`);
        const mantenimientos = await res.json();

        if (!res.ok) throw new Error('Error al cargar mantenimientos');

        const tbody = document.getElementById('maintenances-tbody');
        tbody.innerHTML = '';

        if (mantenimientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No hay mantenimientos registrados para este vehículo.</td></tr>`;
        } else {
            const esAdmin = currentUser && currentUser.rol === 'administrador';

            mantenimientos.forEach(m => {
                const tr = document.createElement('tr');
                const fecha = new Date(m.fecha_creacion).toLocaleDateString('es-CO');
                const costo = m.costo_estimado ? `$ ${m.costo_estimado.toLocaleString('es-CO')}` : 'N/A';

                tr.innerHTML = `
                    <td><strong>#${m.id}</strong></td>
                    <td>${m.descripcion}</td>
                    <td><span class="status-badge status-${m.estado}">${m.estado.replace('_', ' ')}</span></td>
                    <td>${costo}</td>
                    <td>${fecha}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="cambiarEstadoMantenimiento(${m.id}, '${m.descripcion}', '${m.estado}', ${m.costo_estimado || 0})">✏️ Cambiar Estado</button>
                        <button class="btn btn-danger" ${!esAdmin ? 'disabled title="Se requiere rol de Administrador"' : ''} onclick="eliminarMantenimiento(${m.id})">🗑️ Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

async function handleCreateMaintenance(event) {
    event.preventDefault();
    const vehiculo_id = parseInt(document.getElementById('m-vehiculo-id').value);
    const descripcion = document.getElementById('m-descripcion').value.trim();
    const estado = document.getElementById('m-estado').value;
    const costoVal = document.getElementById('m-costo').value;
    const costo_estimado = costoVal !== '' ? parseInt(costoVal) : null;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/mantenimientos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ vehiculo_id, descripcion, estado, costo_estimado })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al agregar mantenimiento');

        mostrarNotificacion('Mantenimiento agregado correctamente');
        document.getElementById('maintenance-form').reset();
        document.getElementById('m-vehiculo-id').value = vehiculo_id;
        cargarMantenimientosVehiculo(vehiculo_id);
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

async function cambiarEstadoMantenimiento(mantenimientoId, descripcion, estadoActual, costoEstimado) {
    const nuevoEstado = prompt(`Ingresa el nuevo estado para el mantenimiento #${mantenimientoId}:\nOpciones: pendiente, en_proceso, completado`, estadoActual);
    if (!nuevoEstado || nuevoEstado === estadoActual) return;

    if (!['pendiente', 'en_proceso', 'completado'].includes(nuevoEstado)) {
        alert('Estado no válido. Debe ser: pendiente, en_proceso o completado');
        return;
    }

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/mantenimientos/${mantenimientoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                descripcion,
                estado: nuevoEstado,
                costo_estimado: costoEstimado
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al actualizar el mantenimiento');

        mostrarNotificacion(`Estado de mantenimiento #${mantenimientoId} actualizado a ${nuevoEstado}`);
        cargarMantenimientosVehiculo(currentVehiculoId);
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

async function eliminarMantenimiento(mantenimientoId) {
    if (!confirm(`¿Estás seguro de eliminar el mantenimiento #${mantenimientoId}?`)) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/mantenimientos/${mantenimientoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al eliminar mantenimiento');

        mostrarNotificacion(data.mensaje || 'Mantenimiento eliminado correctamente');
        cargarMantenimientosVehiculo(currentVehiculoId);
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}
