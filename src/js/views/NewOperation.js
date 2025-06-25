// src/js/views/NewOperation.js (COMPLETO Y ACTUALIZADO)
import supabase from '../modules/supabase.js';
import { showChecklistView } from './Checklist.js';

let allAreas = [];

const form = document.getElementById('new-operation-form');
const depositoSelect = document.getElementById('deposito-select');
const clienteSelect = document.getElementById('cliente-select');
const areaTipoSelect = document.getElementById('area-tipo-select');
const siloSelectorContainer = document.getElementById('silo-selector-container');
const celdaSelectorContainer = document.getElementById('celda-selector-container');
const siloSelector = document.getElementById('silo-selector');
const celdaSelector = document.getElementById('celda-selector');
const submitButton = form.querySelector('button[type="submit"]');

function populateSelect(selectElement, data, valueField, textField, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[textField];
        selectElement.appendChild(option);
    });
}

async function fetchAndPopulateInitialData() {
    try {
        // CORRECCIÓN: Nombres de tablas en minúscula para coincidir con la BD
        const [depositsRes, clientesRes, areasRes] = await Promise.all([
            supabase.from('deposits').select('id, name'),
            supabase.from('clientes').select('id, name'),
            supabase.from('areas').select('id, deposit_id, type, code')
        ]);

        if (depositsRes.error) throw depositsRes.error;
        if (clientesRes.error) throw clientesRes.error;
        if (areasRes.error) throw areasRes.error;
        
        populateSelect(depositoSelect, depositsRes.data, 'id', 'name', 'Seleccionar Depósito');
        populateSelect(clienteSelect, clientesRes.data, 'id', 'name', 'Seleccionar Cliente');
        
        allAreas = areasRes.data;
        const silos = allAreas.filter(area => area.type === 'Silo');
        const celdas = allAreas.filter(area => area.type === 'Celda');
        populateSelect(siloSelector, silos, 'id', 'code', 'Seleccionar Silo');
        populateSelect(celdaSelector, celdas, 'id', 'code', 'Seleccionar Celda');

    } catch (error) {
        console.error('Error cargando datos iniciales:', error.message);
        alert('No se pudieron cargar los datos iniciales. Revisa la conexión e intenta de nuevo.');
    }
}

function handleAreaTypeChange() {
    const selectedType = areaTipoSelect.value;
    siloSelectorContainer.classList.add('hidden');
    celdaSelectorContainer.classList.add('hidden');
    siloSelector.required = false;
    celdaSelector.required = false;

    if (selectedType === 'Silo') {
        siloSelectorContainer.classList.remove('hidden');
        siloSelector.required = true;
    } else if (selectedType === 'Celda') {
        celdaSelectorContainer.classList.remove('hidden');
        celdaSelector.required = true;
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Error: No se pudo identificar al usuario.');
        submitButton.disabled = false;
        submitButton.textContent = 'Iniciar Operación';
        return;
    }

    const formData = new FormData(form);
    const operationData = {
        user_id: user.id,
        deposit_id: formData.get('deposito'),
        cliente_id: formData.get('cliente'),
        area_id: formData.get('silo_selector') || formData.get('celda_selector'),
        fecha: new Date().toISOString()
    };
    
    const checklistItems = [
        { item: 'Tapar ventiladores', operacion_id: 0 },
        { item: 'Sanitizar', operacion_id: 0 },
        { item: 'Verificar presencia de IV', operacion_id: 0 },
        { item: 'Colocar cartelería', operacion_id: 0 }
    ];
    // CORRECCIÓN: Nombres de tablas en minúscula
    const { data, error } = await supabase.from('operaciones').insert([operationData]).select();

    if (error) {
        console.error('Error al guardar la operación:', error);
        alert(`Error: ${error.message}`);
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
    } else {
        const newOperation = data[0];
        checklistItems.forEach(item => item.operacion_id = newOperation.id);
        
        // CORRECCIÓN: Nombres de tablas en minúscula
        const { error: checklistError } = await supabase.from('checklist').insert(checklistItems);
        
        if (checklistError) {
            console.error('Error al crear el checklist:', checklistError);
            alert(`Se creó la operación, pero falló la creación del checklist: ${checklistError.message}`);
        } else {
            showChecklistView(newOperation, user);
        }

        form.reset();
        handleAreaTypeChange();
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
    }
}

export function initNewOperationView() {
    if(depositoSelect.options.length <= 1) {
        fetchAndPopulateInitialData();
    }
    areaTipoSelect.addEventListener('change', handleAreaTypeChange);
    form.addEventListener('submit', handleFormSubmit);
    console.log('✅ Vista de Nueva Operación inicializada.');
}