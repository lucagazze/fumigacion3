// src/js/views/Checklist.js
import supabase from '../modules/supabase.js';
import { showCalculationView } from './Calculation.js';
import { hideAllViews } from '../utils/viewUtils.js';
import { insertStepIndicator } from './NewOperation.js';

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

/**
 * Guarda el estado de un item del checklist en la base de datos.
 * @param {number} operationId - El ID de la operación.
 * @param {number} itemIndex - El índice del item en el array CHECKLIST_ITEMS.
 * @param {boolean} isCompleted - Si el item está completado o no.
 */
async function saveChecklistProgress(operationId, itemIndex, isCompleted) {
    try {
        const { data, error } = await supabase
            .from('checklist_progress')
            .upsert({
                operation_id: operationId,
                item_index: itemIndex,
                completed: isCompleted
            }, {
                onConflict: 'operation_id, item_index'
            });

        if (error) throw error;
        
        // Actualizar la UI después de guardar
        updateChecklistProgress(operationId);
    } catch (error) {
        console.error('Error al guardar el progreso del checklist:', error.message);
    }
}

/**
 * Carga el progreso del checklist para una operación específica.
 * @param {number} operationId - El ID de la operación.
 * @returns {Promise<Map<number, boolean>>} Un mapa con el índice del item y su estado.
 */
async function loadChecklistProgress(operationId) {
    try {
        const { data, error } = await supabase
            .from('checklist_progress')
            .select('item_index, completed')
            .eq('operation_id', operationId);

        if (error) throw error;

        const progressMap = new Map();
        data.forEach(item => {
            progressMap.set(item.item_index, item.completed);
        });
        return progressMap;
    } catch (error) {
        console.error('Error al cargar el progreso del checklist:', error.message);
        return new Map();
    }
}

function goBackToDashboard() {
    hideAllViews();
    if (dashboardView) {
        dashboardView.classList.remove('hidden');
    }
    insertStepIndicator('view-dashboard', 1);
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
        const isComplete = checkedItems === totalItems;
        continueChecklistBtn.disabled = !isComplete;
        continueChecklistBtn.textContent = isComplete ? 'Ir al Cálculo' : 'Continuar';
    }
}

async function renderChecklistItems(operationId) {
    if (!checklistItemsContainer) return;
    checklistItemsContainer.innerHTML = ''; // Limpiar para evitar duplicados

    const progressMap = await loadChecklistProgress(operationId);

    CHECKLIST_ITEMS.forEach((item, index) => {
        const itemId = `checklist-item-${index}`;
        const isChecked = progressMap.get(index) || false;
        const itemHTML = `
            <div class="checklist-item-wrapper">
                <input type="checkbox" id="${itemId}" name="${itemId}" class="checklist-checkbox" ${isChecked ? 'checked' : ''}>
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
    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', (event) => {
            saveChecklistProgress(operationId, index, event.target.checked);
            updateChecklistProgress();
        });
    });

    updateChecklistProgress();
}

/**
 * Muestra la vista del checklist para una operación específica.
 * @param {object} operation - El objeto de la operación creada.
 * @param {object} user - El objeto del usuario actual.
 */
export async function showChecklistView(operation, user) {
    hideAllViews();
    if (checklistView) checklistView.classList.remove('hidden');
    insertStepIndicator('view-checklist', 2);
    if (userEmailDisplayChecklist && user) {
        userEmailDisplayChecklist.textContent = user.email;
    }
    await renderChecklistItems(operation.id);
    
    if (backToDashboardBtn) {
        backToDashboardBtn.onclick = goBackToDashboard;
    }

    if (continueChecklistBtn) {
        continueChecklistBtn.onclick = () => {
            if (!continueChecklistBtn.disabled) {
                showCalculationView(operation, user);
            }
        };
    }
}