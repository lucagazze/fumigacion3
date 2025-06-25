// src/js/views/NewOperation.js
import supabase from '../modules/supabase.js';
import { showChecklistView } from './Checklist.js';

let allAreas = [];
let lastOperationData = {};

const form = document.getElementById('new-operation-form');
const clienteSelect = document.getElementById('cliente-select');
const areaTipoSelect = document.getElementById('area-tipo-select');
const siloSelectorContainer = document.getElementById('silo-selector-container');
const celdaSelectorContainer = document.getElementById('celda-selector-container');
const siloSelector = document.getElementById('silo-selector');
const celdaSelector = document.getElementById('celda-selector');
const submitButton = form.querySelector('button[type="submit"]');
const lastOperationContainer = document.getElementById('last-operation-container');
const lastOperationDetails = document.getElementById('last-operation-details');
const openOperationsList = document.getElementById('open-operations-list');

function populateSelect(selectElement, data, valueField, textField, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    data.sort((a, b) => a[textField].localeCompare(b[textField]));
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[textField];
        selectElement.appendChild(option);
    });
}

async function fetchAndPopulateInitialData() {
    try {
        const [clientesRes, areasRes] = await Promise.all([
            supabase.from('clientes').select('id, name'),
            supabase.from('areas').select('id, deposit_id, type, code')
        ]);

        if (clientesRes.error) throw clientesRes.error;
        if (areasRes.error) throw areasRes.error;
        
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
    submitButton.textContent = 'Verificando...';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Error: No se pudo identificar al usuario.');
        submitButton.disabled = false;
        submitButton.textContent = 'Iniciar Operación';
        return;
    }

    const formData = new FormData(form);
    const cliente_id = formData.get('cliente');
    const area_id = formData.get('silo_selector') || formData.get('celda_selector');

    // Verificar si ya existe una operación en curso para esta combinación
    const { data: existingOperation, error: checkError } = await supabase
        .from('operaciones')
        .select('*')
        .eq('cliente_id', cliente_id)
        .eq('area_id', area_id)
        .eq('status', 'in-progress')
        .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116: No rows found, lo cual es bueno en este caso.
        console.error('Error al verificar operaciones existentes:', checkError);
        alert('No se pudo verificar si la operación ya existe. Inténtalo de nuevo.');
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
        return;
    }

    if (existingOperation) {
        alert('Ya existe una operación en curso para este cliente y área. Te llevaremos a ella.');
        showChecklistView(existingOperation, user);
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
        return;
    }

    // Si no existe, continuar con la creación
    submitButton.textContent = 'Guardando...';
    const selectedArea = allAreas.find(area => area.id == area_id);

    if (!selectedArea) {
        alert('Área no válida. Por favor, seleccione un silo o celda.');
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
        return;
    }

    const operationData = {
        user_id: user.id,
        cliente_id: cliente_id,
        area_id: area_id,
        deposit_id: selectedArea.deposit_id, // Corregido: Obtener deposit_id del área
        fecha: new Date().toISOString(),
        status: 'in-progress' // Añadido para filtrar operaciones en curso
    };
    
    const checklistItems = [
        { item: 'Tapar ventiladores' },
        { item: 'Sanitizar' },
        { item: 'Verificar presencia de IV' },
        { item: 'Colocar cartelería' }
    ];

    const { data, error } = await supabase.from('operaciones').insert([operationData]).select().single();

    if (error) {
        console.error('Error al guardar la operación:', error);
        alert(`Error: ${error.message}`);
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
    } else {
        const newOperation = data;
        const itemsToInsert = checklistItems.map(item => ({ ...item, operacion_id: newOperation.id }));
        
        const { error: checklistError } = await supabase.from('checklist').insert(itemsToInsert);
        
        if (checklistError) {
            console.error('Error al crear el checklist:', checklistError);
            alert(`Se creó la operación, pero falló la creación del checklist: ${checklistError.message}`);
        } else {
            showChecklistView(newOperation, user);
        }

        form.reset();
        handleAreaTypeChange();
        fetchAndRenderOpenOperations(user); // Actualizar la lista de operaciones abiertas
    }

    submitButton.disabled = false;
    submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
}

async function fetchAndRenderOpenOperations(user) {
    if (!openOperationsList) return;

    const { data: operations, error } = await supabase
        .from('operaciones')
        .select(`
            id, fecha,
            clientes ( name ),
            areas ( type, code )
        `)
        .eq('user_id', user.id)
        .eq('status', 'in-progress')
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error cargando operaciones abiertas:', error);
        openOperationsList.innerHTML = '<p class="text-red-500">No se pudieron cargar las operaciones.</p>';
        return;
    }

    if (operations.length === 0) {
        openOperationsList.innerHTML = '<p class="text-gray-500">No tienes operaciones en curso.</p>';
        return;
    }

    openOperationsList.innerHTML = operations.map(op => {
        const clientName = op.clientes?.name || 'N/A';
        const areaName = op.areas ? `${op.areas.type} ${op.areas.code}` : 'N/A';
        return `
            <div class="open-operation-item" data-operation-id='${op.id}'>
                <div class="operation-info">
                    <span class="client-name">${clientName}</span>
                    <span class="area-name">${areaName}</span>
                </div>
                <button class="btn-primary btn-continue">
                    <span>Continuar</span>
                    <span class="material-icons-outlined">arrow_forward</span>
                </button>
            </div>
        `;
    }).join('');

    openOperationsList.querySelectorAll('.open-operation-item').forEach(item => {
        item.addEventListener('click', () => {
            const operationId = item.dataset.operationId;
            const selectedOperation = operations.find(op => op.id == operationId);
            showChecklistView(selectedOperation, user);
        });
    });
}

export async function initNewOperationView() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        fetchAndRenderOpenOperations(user);
    }
    form.addEventListener('submit', handleFormSubmit);
    areaTipoSelect.addEventListener('change', handleAreaTypeChange);
    fetchAndPopulateInitialData();
}