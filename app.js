// --- ESTADO GLOBAL Y VARIABLES ---
let currentToken = localStorage.getItem('jwt_token') || null;
let currentUser = JSON.parse(localStorage.getItem('user_data') || 'null');
let isLoginMode = true;

let skip = 0;
const limit = 5;
let currentVehiculoId = null;
let sugerenciaActual = null;
let vehiculosCache = [];

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
            <span style="font-size: 0.85rem; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 0.35rem;">
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <strong style="color: var(--text-primary);">${currentUser.email}</strong>
            </span>
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
        title.innerHTML = `
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            <span>Iniciar Sesión</span>
        `;
        toggleBtn.textContent = '¿No tienes cuenta? Regístrate';
        submitBtn.textContent = 'Ingresar al Taller';
        roleGroup.classList.add('hidden');
    } else {
        title.innerHTML = `
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <span>Crear Cuenta</span>
        `;
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

            const tokenPayload = JSON.parse(atob(currentToken.split('.')[1]));
            currentUser = { 
                email: tokenPayload.sub, 
                rol: tokenPayload.rol || 'mecanico' 
            };

            localStorage.setItem('user_data', JSON.stringify(currentUser));
            actualizarInterfazAuth();
            cargarVehiculos();
            mostrarNotificacion('¡Bienvenido al taller!');

        } else {
            const res = await fetch(`${CONFIG.API_BASE_URL}/usuarios/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rol })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error al registrar usuario');

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
        vehiculosCache = vehiculos;

        const tbody = document.getElementById('vehicles-tbody');
        tbody.innerHTML = '';

        if (vehiculos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No hay vehículos registrados en esta página.</td></tr>`;
        } else {
            const esAdmin = currentUser && currentUser.rol === 'administrador';

            vehiculos.forEach(v => {
                const tr = document.createElement('tr');
                const isMoto = v.tipo === 'motocicleta';
                const tipoLabel = isMoto ? 'Moto' : 'Carro';
                const kmText = v.kilometraje_actual !== null && v.kilometraje_actual !== undefined ? `${v.kilometraje_actual.toLocaleString('es-CO')} km` : '0 km';

                tr.innerHTML = `
                    <td><strong>#${v.id}</strong></td>
                    <td>
                        <span class="status-badge status-en_proceso">
                            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                ${isMoto 
                                    ? '<circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6h2l3 6.5-1.5 1.5M9 17.5l3-7.5h3"></path>'
                                    : '<rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>'}
                            </svg>
                            <span>${tipoLabel}</span>
                        </span>
                    </td>
                    <td><span style="font-family: monospace; font-weight: 700; color: var(--accent);">${v.placa}</span></td>
                    <td>${v.marca} ${v.modelo}</td>
                    <td>${kmText}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="verMantenimientos(${v.id}, '${v.placa}')">
                                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                                <span>Mantenimientos</span>
                            </button>
                            <button class="btn btn-secondary" onclick="abrirEditarVehiculo(${v.id})">
                                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                <span>Editar</span>
                            </button>
                            <button class="btn btn-danger" ${!esAdmin ? 'disabled title="Se requiere rol de Administrador"' : ''} onclick="eliminarVehiculo(${v.id})">
                                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                <span>Eliminar</span>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

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
    const tipo = document.getElementById('v-tipo').value;
    const placa = document.getElementById('v-placa').value.trim().toUpperCase();
    const marca = document.getElementById('v-marca').value.trim();
    const modelo = document.getElementById('v-modelo').value.trim();
    const kmVal = document.getElementById('v-km').value;
    const kilometraje_actual = kmVal !== '' ? parseInt(kmVal) : 0;
    const fechaCompraVal = document.getElementById('v-fecha-compra').value;
    const fecha_compra = fechaCompraVal ? new Date(fechaCompraVal).toISOString() : null;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/vehiculos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ placa, marca, modelo, tipo, kilometraje_actual, fecha_compra })
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

function abrirEditarVehiculo(vehiculoId) {
    const v = vehiculosCache.find(item => item.id === vehiculoId);
    if (!v) return;

    document.getElementById('ev-id').value = v.id;
    document.getElementById('ev-tipo').value = v.tipo || 'carro';
    document.getElementById('ev-placa').value = v.placa;
    document.getElementById('ev-marca').value = v.marca;
    document.getElementById('ev-modelo').value = v.modelo;
    document.getElementById('ev-km').value = v.kilometraje_actual !== null ? v.kilometraje_actual : 0;
    
    if (v.fecha_compra) {
        const fechaStr = new Date(v.fecha_compra).toISOString().split('T')[0];
        document.getElementById('ev-fecha-compra').value = fechaStr;
    } else {
        document.getElementById('ev-fecha-compra').value = '';
    }

    const editPanel = document.getElementById('edit-vehicle-panel');
    editPanel.classList.remove('hidden');
    editPanel.scrollIntoView({ behavior: 'smooth' });
}

function cerrarEditarVehiculo() {
    document.getElementById('edit-vehicle-panel').classList.add('hidden');
    document.getElementById('edit-vehicle-form').reset();
}

async function handleUpdateVehicle(event) {
    event.preventDefault();
    const vehiculoId = parseInt(document.getElementById('ev-id').value);
    const tipo = document.getElementById('ev-tipo').value;
    const placa = document.getElementById('ev-placa').value.trim().toUpperCase();
    const marca = document.getElementById('ev-marca').value.trim();
    const modelo = document.getElementById('ev-modelo').value.trim();
    const kmVal = document.getElementById('ev-km').value;
    const kilometraje_actual = kmVal !== '' ? parseInt(kmVal) : 0;
    const fechaCompraVal = document.getElementById('ev-fecha-compra').value;
    const fecha_compra = fechaCompraVal ? new Date(fechaCompraVal).toISOString() : null;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/vehiculos/${vehiculoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ placa, marca, modelo, tipo, kilometraje_actual, fecha_compra })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al actualizar vehículo');

        mostrarNotificacion(`Vehículo #${vehiculoId} actualizado correctamente`);
        cerrarEditarVehiculo();
        cargarVehiculos();

        if (currentVehiculoId === vehiculoId) {
            cargarRecomendacionProximoMantenimiento(vehiculoId);
        }

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

// --- GESTIÓN DE MANTENIMIENTOS Y RECOMENDACIÓN INTELIGENTE ---
async function verMantenimientos(vehiculoId, placa) {
    currentVehiculoId = vehiculoId;
    document.getElementById('m-vehiculo-id').value = vehiculoId;
    document.getElementById('maintenance-title-text').textContent = `Mantenimientos del Vehículo: ${placa} (#${vehiculoId})`;
    document.getElementById('maintenance-section').classList.remove('hidden');

    document.getElementById('maintenance-section').scrollIntoView({ behavior: 'smooth' });

    cargarRecomendacionProximoMantenimiento(vehiculoId);
    cargarMantenimientosVehiculo(vehiculoId);
}

async function cargarRecomendacionProximoMantenimiento(vehiculoId) {
    const banner = document.getElementById('recommendation-banner');
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/vehiculos/${vehiculoId}/proximo-mantenimiento`);
        if (!res.ok) {
            banner.classList.add('hidden');
            return;
        }

        sugerenciaActual = await res.json();
        document.getElementById('rec-description').textContent = sugerenciaActual.descripcion_sugerida;
        banner.classList.remove('hidden');
    } catch (err) {
        banner.classList.add('hidden');
    }
}

function usarMantenimientoSugerido() {
    if (!sugerenciaActual) return;
    document.getElementById('m-descripcion').value = sugerenciaActual.descripcion_sugerida;
    document.getElementById('m-km').value = sugerenciaActual.kilometraje_objetivo;
    
    if (sugerenciaActual.fecha_sugerida) {
        const fechaStr = new Date(sugerenciaActual.fecha_sugerida).toISOString().split('T')[0];
        document.getElementById('m-fecha-programada').value = fechaStr;
    }
    
    mostrarNotificacion('Mantenimiento sugerido cargado en el formulario');
}

function cerrarMantenimientos() {
    document.getElementById('maintenance-section').classList.add('hidden');
    currentVehiculoId = null;
    sugerenciaActual = null;
}

async function cargarMantenimientosVehiculo(vehiculoId) {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/mantenimientos/?vehiculo_id=${vehiculoId}&skip=0&limit=50`);
        const mantenimientos = await res.json();

        if (!res.ok) throw new Error('Error al cargar mantenimientos');

        const tbody = document.getElementById('maintenances-tbody');
        tbody.innerHTML = '';

        if (mantenimientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No hay mantenimientos registrados para este vehículo.</td></tr>`;
        } else {
            const esAdmin = currentUser && currentUser.rol === 'administrador';

            mantenimientos.forEach(m => {
                const tr = document.createElement('tr');
                const costo = m.costo_estimado !== null && m.costo_estimado !== undefined ? `$ ${m.costo_estimado.toLocaleString('es-CO')} COP` : 'N/A';
                const km = m.kilometraje !== null && m.kilometraje !== undefined ? `${m.kilometraje.toLocaleString('es-CO')} km` : 'N/A';
                const fechaProg = m.fecha_programada ? new Date(m.fecha_programada).toLocaleDateString('es-CO') : 'Manual';

                tr.innerHTML = `
                    <td><strong>#${m.id}</strong></td>
                    <td>${m.descripcion}</td>
                    <td><span class="status-badge status-${m.estado}">${m.estado.replace('_', ' ')}</span></td>
                    <td>${costo}</td>
                    <td>${km}</td>
                    <td>${fechaProg}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="cambiarEstadoMantenimiento(${m.id}, '${m.descripcion}', '${m.estado}', ${m.costo_estimado || 0}, ${m.kilometraje || 0})">
                                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                <span>Cambiar Estado</span>
                            </button>
                            <button class="btn btn-danger" ${!esAdmin ? 'disabled title="Se requiere rol de Administrador"' : ''} onclick="eliminarMantenimiento(${m.id})">
                                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                <span>Eliminar</span>
                            </button>
                        </div>
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
    const kmVal = document.getElementById('m-km').value;
    const kilometraje = kmVal !== '' ? parseInt(kmVal) : null;
    const fechaProgVal = document.getElementById('m-fecha-programada').value;
    const fecha_programada = fechaProgVal ? new Date(fechaProgVal).toISOString() : null;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/mantenimientos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ vehiculo_id, descripcion, estado, costo_estimado, kilometraje, fecha_programada })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al agregar mantenimiento');

        mostrarNotificacion('Mantenimiento agregado correctamente');
        document.getElementById('maintenance-form').reset();
        document.getElementById('m-vehiculo-id').value = vehiculo_id;
        cargarMantenimientosVehiculo(vehiculo_id);
        cargarRecomendacionProximoMantenimiento(vehiculo_id);
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

async function cambiarEstadoMantenimiento(mantenimientoId, descripcion, estadoActual, costoEstimado, kilometraje) {
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
                costo_estimado: costoEstimado,
                kilometraje: kilometraje || null
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al actualizar el mantenimiento');

        mostrarNotificacion(`Estado de mantenimiento #${mantenimientoId} actualizado a ${nuevoEstado}`);
        cargarMantenimientosVehiculo(currentVehiculoId);
        cargarRecomendacionProximoMantenimiento(currentVehiculoId);
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
        cargarRecomendacionProximoMantenimiento(currentVehiculoId);
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}
