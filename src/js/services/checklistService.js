// src/js/services/checklistService.js
import supabase from '../modules/supabase.js';

export async function createInitialChecklist(operationId, items) {
    const itemsToInsert = items.map(item => ({ ...item, operacion_id: operationId }));
    const { error } = await supabase.from('checklist').insert(itemsToInsert);

    if (error) {
        console.error('Error al crear el checklist inicial:', error);
        throw error;
    }
}

export async function getChecklistProgress(operationId) {
    const { data, error } = await supabase
        .from('checklist_progress')
        .select('item_index, completed')
        .eq('operation_id', operationId);

    if (error) {
        console.error('Error al cargar el progreso del checklist:', error);
        throw error;
    }

    const progressMap = new Map();
    data.forEach(item => {
        progressMap.set(item.item_index, item.completed);
    });
    return progressMap;
}

export async function saveChecklistProgress(operationId, itemIndex, isCompleted) {
    const { error } = await supabase
        .from('checklist_progress')
        .upsert({
            operation_id: operationId,
            item_index: itemIndex,
            completed: isCompleted,
            updated_at: new Date().toISOString()
        }, { onConflict: 'operation_id, item_index' });

    if (error) {
        console.error('Error al guardar el progreso del checklist:', error);
        throw error;
    }
}

export async function getBulkChecklistProgress(operationIds) {
    const { data, error } = await supabase
        .from('checklist_progress')
        .select('operation_id, completed')
        .in('operation_id', operationIds)
        .eq('completed', true);

    if (error) {
        console.error('Error cargando el progreso masivo del checklist:', error);
        return new Map(); // Devolver mapa vacío en caso de error
    }

    const progressMap = new Map();
    data.forEach(p => {
        const count = progressMap.get(p.operation_id) || 0;
        progressMap.set(p.operation_id, count + 1);
    });
    return progressMap;
}
