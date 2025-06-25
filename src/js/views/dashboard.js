// src/js/views/dashboard.js

/**
 * Renderiza la vista principal del dashboard del operario.
 * @param {HTMLElement} container - El elemento donde se renderizará.
 * @param {Object} user - El objeto de usuario de Supabase.
 * @param {Function} onLogout - Función para cerrar sesión.
 */
export function renderDashboardView(container, user, onLogout) {
    container.innerHTML = `
        <header class="app-header">
            <div class="header-logo">
                <img src="https://www.svgrepo.com/show/443292/bug.svg" alt="Fagaz Logo" width="32">
                <h1>Fagaz Servicios</h1>
            </div>
            <div class="header-user">
                <span id="user-email-display">${user.email}</span>
                <button id="logout-button" title="Cerrar Sesión">
                    <span class="material-icons-outlined">logout</span>
                </button>
            </div>
        </header>
        <main id="app-main" class="view">
            <div class="form-container">
                <h2>Bienvenido, Operario</h2>
                <p>Inicia una nueva operación de fumigación o continúa una existente.</p>
                <button id="start-new-op-btn" class="btn-primary">
                    <span class="material-icons-outlined">add_circle</span>
                    Iniciar Nueva Operación
                </button>
                <div id="open-operations-list" class="mt-4">
                    </div>
            </div>
        </main>
    `;

    document.getElementById('logout-button').addEventListener('click', onLogout);
    
    document.getElementById('start-new-op-btn').addEventListener('click', () => {
        // Aquí irá la lógica para renderizar el formulario de nueva operación
        alert('Funcionalidad para iniciar nueva operación en desarrollo.');
    });

    // Cargar y mostrar operaciones abiertas (funcionalidad futura)
    loadOpenOperations(); 
}

function loadOpenOperations() {
    // Lógica para buscar en IndexedDB o Supabase operaciones no finalizadas
    const listContainer = document.getElementById('open-operations-list');
    // listContainer.innerHTML = '<p>No tienes operaciones pendientes.</p>';
}