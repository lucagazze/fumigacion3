// src/js/views/Calculation.js
import { insertStepIndicator } from './NewOperation.js';
import { hideAllViews } from '../utils/viewUtils.js';
import { completeOperation } from '../services/operationService.js';

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
        <button id="finalize-operation-btn" class="btn-primary mt-4">Finalizar y Registrar Salida de Stock</button>
    `;

    document.getElementById('finalize-operation-btn').addEventListener('click', async () => {
        try {
            // Aquí llamamos al servicio para completar la operación y actualizar el stock
            await completeOperation(operation.id, totalPills, tons);
            alert('¡Operación finalizada y stock actualizado con éxito!');
            // Redirigir al dashboard o mostrar un mensaje de éxito final.
            window.location.reload(); // La forma más simple de volver al inicio.
        } catch (error) {
            console.error('Error al finalizar la operación:', error);
            alert(`Error al finalizar la operación: ${error.message}`);
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


    if (backToChecklistBtn) {
        backToChecklistBtn.removeEventListener('click', goBackToChecklist);
        backToChecklistBtn.addEventListener('click', goBackToChecklist);
    }

    if (treatmentModalitySelect) {
        treatmentModalitySelect.removeEventListener('change', handleModalityChange);
        treatmentModalitySelect.addEventListener('change', handleModalityChange);
    }

    if (calculationForm) {
        // Clonamos y reemplazamos el form para limpiar listeners previos del submit
        const newCalculationForm = calculationForm.cloneNode(true);
        calculationForm.parentNode.replaceChild(newCalculationForm, calculationForm);
        newCalculationForm.addEventListener('submit', (e) => handleCalculationSubmit(e, operation));
    }
}
