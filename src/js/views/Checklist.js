// src/js/views/Checklist.js

const dashboardView = document.getElementById('view-dashboard');
const checklistView = document.getElementById('view-checklist');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const userEmailDisplayChecklist = document.getElementById('user-email-display-checklist');
const checklistItemsContainer = document.getElementById('checklist-items-container');
const checklistProgressBadge = document.getElementById('checklist-progress-badge');
const checklistProgressBar = document.getElementById('checklist-progress-bar');
const continueChecklistBtn = document.getElementById('continue-checklist-btn');

const CHECKLIST_ITEMS = [
    "Tapar ventiladores",
    "Sanitizar",
    "Verificar presencia de IV",
    "Colocar cartelería"
];

function goBackToDashboard() {
    if (checklistView) checklistView.classList.add('hidden');
    if (dashboardView) dashboardView.style.display = 'flex';
}

function updateChecklistProgress() {
    const checkedItems = checklistItemsContainer.querySelectorAll('input[type="checkbox"]:checked').length;
    const totalItems = CHECKLIST_ITEMS.length;
    const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

    if (checklistProgressBadge) {
        checklistProgressBadge.textContent = `Progreso: ${checkedItems}/${totalItems}`;
    }
    if (checklistProgressBar) {
        checklistProgressBar.style.width = `${progress}%`;
    }
    if (continueChecklistBtn) {
        continueChecklistBtn.disabled = checkedItems !== totalItems;
    }
}

function renderChecklistItems() {
    if (!checklistItemsContainer) return;
    checklistItemsContainer.innerHTML = ''; // Limpiar para evitar duplicados

    CHECKLIST_ITEMS.forEach((item, index) => {
        const itemId = `checklist-item-${index}`;
        const itemHTML = `
            <div class="checklist-item-wrapper">
                <input type="checkbox" id="${itemId}" name="${itemId}" class="checklist-checkbox">
                <label for="${itemId}" class="checklist-label">${item}</label>
                <button class="btn-icon" aria-label="Adjuntar foto para ${item}">
                    <span class="material-icons-outlined">photo_camera</span>
                    <span>Adjuntar Foto</span>
                </button>
            </div>
        `;
        checklistItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
    });

    const checkboxes = checklistItemsContainer.querySelectorAll('.checklist-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateChecklistProgress);
    });
}

/**
 * Muestra la vista del checklist para una operación específica.
 * @param {object} operation - El objeto de la operación creada.
 * @param {object} user - El objeto del usuario actual.
 */
export function showChecklistView(operation, user) {
    console.log('Navegando a la vista de checklist para la operación:', operation.id);
    
    if (dashboardView) dashboardView.style.display = 'none';
    if (checklistView) checklistView.classList.remove('hidden');
    
    if (userEmailDisplayChecklist && user) {
        userEmailDisplayChecklist.textContent = user.email;
    }

    renderChecklistItems();
    updateChecklistProgress();

    if (backToDashboardBtn) {
        backToDashboardBtn.removeEventListener('click', goBackToDashboard);
        backToDashboardBtn.addEventListener('click', goBackToDashboard);
    }
}