// src/js/views/Checklist.js

const dashboardView = document.getElementById('view-dashboard');
const checklistView = document.getElementById('view-checklist');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const userEmailDisplayChecklist = document.getElementById('user-email-display-checklist');

function goBackToDashboard() {
    checklistView.classList.add('hidden');
    dashboardView.style.display = 'flex';
}

/**
 * Muestra la vista del checklist para una operación específica.
 * @param {object} operation - El objeto de la operación creada.
 * @param {object} user - El objeto del usuario actual.
 */
export function showChecklistView(operation, user) {
    console.log('Navegando a la vista de checklist para la operación:', operation.id);
    
    // Oculta la vista del dashboard y muestra la del checklist
    dashboardView.style.display = 'none';
    checklistView.classList.remove('hidden');
    
    // Mostramos el email del usuario en la cabecera del checklist
    userEmailDisplayChecklist.textContent = user.email;

    // TODO: Poblar la lista de ítems del checklist para la operation.id

    // Añadimos el listener para el botón de volver
    backToDashboardBtn.addEventListener('click', goBackToDashboard);
}