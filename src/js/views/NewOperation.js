import supabase from '../modules/supabase.js';

// Guardaremos las áreas aquí para no tener que pedirlas a la BD a cada rato
let allAreas = [];

// --- SELECCIÓN DE ELEMENTOS DEL DOM ---
const form = document.getElementById('new-operation-form');
const depositoSelect = document.getElementById('deposito-select');
const clienteSelect = document.getElementById('cliente-select');
const areaTipoSelect = document.getElementById('area-tipo-select');
const siloSelectorContainer = document.getElementById('silo-selector-container');
const celdaSelectorContainer = document.getElementById('celda-selector-container');
const siloSelector = document.getElementById('silo-selector');
const celdaSelector = document.getElementById('celda-selector');
const submitButton = form.querySelector('button[type="submit"]');

// --- FUNCIONES PARA POBLAR LOS MENÚS DESPLEGABLES ---

/**
 * Rellena un elemento <select> con opciones.
 * @param {HTMLSelectElement} selectElement - El elemento select a poblar.
 * @param {Array} data - El array de objetos con los datos.
 * @param {string} valueField - El nombre del campo para el 'value' del option.
 * @param {string} textField - El nombre del campo para el texto visible del option.
 * @param {string} placeholder - El texto para la primera opción deshabilitada.
 */
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
        // Hacemos las peticiones en paralelo para más eficiencia
        const [depositsRes, clientesRes, areasRes] = await Promise.all([
            supabase.from('Deposits').select('id, name'),
            supabase.from('Clientes').select('id, name'),
            supabase.from('Areas').select('id, deposit_id, type, code')
        ]);

        if (depositsRes.error) throw depositsRes.error;
        if (clientesRes.error) throw clientesRes.error;
        if (areasRes.error) throw areasRes.error;
        
        // Poblamos los selects iniciales
        populateSelect(depositoSelect, depositsRes.data, 'id', 'name', 'Seleccionar Depósito');
        populateSelect(clienteSelect, clientesRes.data, 'id', 'name', 'Seleccionar Cliente');
        
        // Guardamos las áreas y poblamos los selects de silos y celdas
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


// --- MANEJADORES DE EVENTOS ---

function handleAreaTypeChange() {
    const selectedType = areaTipoSelect.value;
    
    // Ocultamos ambos contenedores
    siloSelectorContainer.classList.add('hidden');
    celdaSelectorContainer.classList.add('hidden');

    // Desactivamos los selectores para que no envíen su valor si están ocultos
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

// CORRECCIÓN: Convertimos la función en async para usar await
async function handleFormSubmit(event) {
    event.preventDefault(); // Evitamos que la página se recargue
    submitButton.disabled = true; // Deshabilitamos el botón para evitar doble click
    submitButton.textContent = 'Guardando...';

    // Obtenemos el ID del usuario logueado
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert('Error: No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
        submitButton.disabled = false;
        submitButton.textContent = 'Iniciar Operación';
        return;
    }

    const formData = new FormData(form);
    const operationData = {
        user_id: user.id, // ID del usuario autenticado
        deposit_id: formData.get('deposito'),
        cliente_id: formData.get('cliente'),
        // El 'area_id' será el valor del selector que esté visible
        area_id: formData.get('silo_selector') || formData.get('celda_selector'),
        fecha: new Date().toISOString() // La fecha actual en formato ISO
    };

    // --- LÓGICA DE INSERCIÓN EN SUPABASE ---
    const { data, error } = await supabase
        .from('operaciones') // El nombre de la tabla en minúsculas como en la foto
        .insert([operationData])
        .select() // .select() hace que la operación devuelva el registro insertado

    if (error) {
        console.error('Error al guardar la operación:', error);
        alert(`Error al guardar la operación: ${error.message}`);
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
    } else {
        const newOperationId = data[0].id;
        console.log('Operación guardada con éxito:', data[0]);
        alert(`¡Operación iniciada con éxito! ID: ${newOperationId}`);
        form.reset(); // Limpiamos el formulario
        handleAreaTypeChange(); // Ocultamos los selectores de silo/celda
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons-outlined">play_arrow</span> Iniciar Operación';
        // En el futuro, aquí redirigiremos a la pantalla del checklist
    }
}


// --- FUNCIÓN DE INICIALIZACIÓN ---

export function initNewOperationView() {
    // Solo poblamos los datos si no han sido cargados antes
    if(depositoSelect.options.length <= 1) {
        fetchAndPopulateInitialData();
    }
    
    // Añadimos los listeners a los elementos del formulario
    areaTipoSelect.addEventListener('change', handleAreaTypeChange);
    form.addEventListener('submit', handleFormSubmit);
    
    console.log('✅ Vista de Nueva Operación inicializada.');
}