// src/js/views/Calculation.js
import { insertStepIndicator } from './NewOperation.js';
import { hideAllViews } from '../utils/viewUtils.js';
import { registerPillApplication } from '../services/operationService.js';

const calculationView = document.getElementById('view-calculation');
const checklistView = document.getElementById('view-checklist');
const backToChecklistBtn = document.getElementById('back-to-checklist-btn');
const calculationForm = document.getElementById('calculation-form');
const calculationResult = document.getElementById('calculation-result');

// Nuevos elementos del formulario
const treatmentModalitySelect = document.getElementById('treatment-modality');
const truckLoadContainer = document.getElementById('truck-load-container');
const truckQuantityInput = document.getElementById('truck-quantity');
const directTnContainer = document.getElementById('direct-tn-container');
const directTnInput = document.getElementById('direct-tn');
const treatmentTypeSelect = document.getElementById('treatment-type');


function goBackToChecklist() {
    if (calculationView) calculationView.classList.add('hidden');
    if (checklistView) checklistView.classList.remove('hidden');
}

function handleModalityChange() {
    const modality = treatmentModalitySelect.value;
    truckLoadContainer.classList.add('hidden');
    directTnContainer.classList.add('hidden');
    truckQuantityInput.required = false;
    directTnInput.required = false;

    if (modality === 'descarga') {
        truckLoadContainer.classList.remove('hidden');
        truckQuantityInput.required = true;
    } else if (modality === 'traslado') {
        directTnContainer.classList.remove('hidden');
        directTnInput.required = true;
    }
}

async function handleCalculationSubmit(e, operation) {
    e.preventDefault();
    const modality = treatmentModalitySelect.value;
    const treatmentType = treatmentTypeSelect.value;

    let tons = 0;
    if (modality === 'descarga') {
        tons = (parseFloat(truckQuantityInput.value) || 0) * 28;
    } else if (modality === 'traslado') {
        tons = parseFloat(directTnInput.value) || 0;
    }

    let pillsPerTon = 0;
    if (treatmentType === 'preventivo') {
        pillsPerTon = 2;
    } else if (treatmentType === 'curativo') {
        pillsPerTon = 3;
    }

    if (tons <= 0 || pillsPerTon <= 0) {
        calculationResult.innerHTML = `<span class="error-message">Por favor, completa todos los campos correctamente.</span>`;
        return;
    }

    const totalPills = Math.ceil(tons * pillsPerTon);

    calculationResult.innerHTML = `
        <div class="calculation-summary">
            <p><strong>Modalidad:</strong> ${modality}</p>
            <p><strong>Toneladas Totales:</strong> ${tons.toLocaleString()}</p>
            <p><strong>Tipo de Tratamiento:</strong> ${treatmentType}</p>
            <p><strong>Dosis:</strong> ${pillsPerTon} pastillas/tn</p>
            <hr>
            <p class="result-final"><strong>Total de Pastillas a Utilizar:</strong> ${totalPills}</p>
        </div>
        <button id="register-application-btn" class="btn-primary mt-4">Registrar Aplicación y Descontar Stock</button>
    `;

    document.getElementById('register-application-btn').addEventListener('click', async () => {
        try {
            // Aquí llamamos al nuevo servicio para registrar la aplicación sin finalizar la operación
            await registerPillApplication(operation.id, totalPills, tons);
            alert('¡Aplicación registrada y stock actualizado con éxito! La operación sigue "en curso". Puede registrar otra aplicación o volver al checklist.');
            
            // Limpiamos el formulario para una posible nueva aplicación
            calculationForm.reset();
            calculationResult.innerHTML = '';
            handleModalityChange();

        } catch (error) {
            console.error('Error al registrar la aplicación:', error);
            alert(`Error al registrar la aplicación: ${error.message}`);
        }
    });
}


export function showCalculationView(operation, user) {
    hideAllViews();
    calculationView.classList.remove('hidden');
    insertStepIndicator('view-calculation', 3);

    // Resetear formulario y resultado
    if (calculationForm) calculationForm.reset();
    if (calculationResult) calculationResult.innerHTML = '';
    handleModalityChange();

    // Listeners robustos y únicos
    if (backToChecklistBtn) {
        backToChecklistBtn.onclick = goBackToChecklist;
    }
    if (treatmentModalitySelect) {
        treatmentModalitySelect.onchange = handleModalityChange;
    }
    if (calculationForm) {
        calculationForm.onsubmit = (e) => handleCalculationSubmit(e, operation);
    }
}
