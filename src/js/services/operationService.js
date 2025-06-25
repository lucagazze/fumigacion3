// src/js/services/operationService.js
import supabase from '../modules/supabase.js';

export async function getOpenOperations(userId) {
    const { data, error } = await supabase
        .from('operaciones')
        .select('id, fecha, clientes ( name ), areas ( type, code )')
        .eq('user_id', userId)
        .eq('status', 'in-progress')
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error cargando operaciones abiertas:', error);
        throw error;
    }
    return data;
}

export async function findExistingOperation(cliente_id, area_id) {
    const { data, error } = await supabase
        .from('operaciones')
        .select('*')
        .eq('cliente_id', cliente_id)
        .eq('area_id', area_id)
        .eq('status', 'in-progress')
        .single();

    // No consideramos "no rows found" como un error bloqueante
    if (error && error.code !== 'PGRST116') {
        console.error('Error al verificar operaciones existentes:', error);
        throw error;
    }
    return data;
}

export async function createOperation(operationData) {
    const { data, error } = await supabase
        .from('operaciones')
        .insert([operationData])
        .select()
        .single();

    if (error) {
        console.error('Error al crear la operación:', error);
        throw error;
    }
    return data;
}

export async function updateOperationStatus(operationId, status, completed_at = null) {
    const updateData = { status };
    if (completed_at) {
        updateData.completed_at = completed_at;
    }

    const { error } = await supabase
        .from('operaciones')
        .update(updateData)
        .eq('id', operationId);

    if (error) {
        console.error(`Error al actualizar estado de la operación a ${status}:`, error);
        throw error;
    }
}

export async function completeOperation(operationId, totalPills, tons) {
    // Paso 1: Actualizar la operación con los detalles del cálculo y marcarla como completada
    const { error: updateError } = await supabase
        .from('operaciones')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            pastillas_usadas: totalPills,
            toneladas_tratadas: tons
        })
        .eq('id', operationId);

    if (updateError) {
        console.error('Error al actualizar la operación:', updateError);
        throw updateError;
    }

    // Paso 2: Obtener el deposit_id de la operación para saber de dónde descontar el stock.
    const { data: operationData, error: operationError } = await supabase
        .from('operaciones')
        .select('deposit_id')
        .eq('id', operationId)
        .single();

    if (operationError || !operationData || !operationData.deposit_id) {
        console.error('Error al obtener el depósito para la operación:', operationError);
        throw new Error('No se pudo determinar el depósito para descontar el stock.');
    }

    const depositId = operationData.deposit_id;

    // Paso 3: Llamar a la función RPC de Supabase para actualizar el stock de forma segura
    const { error: rpcError } = await supabase.rpc('actualizar_stock', {
        cantidad: totalPills,
        id_deposito: depositId
    });

    if (rpcError) {
        console.error('Error al actualizar el stock:', rpcError);
        // Opcional: Revertir el estado de la operación si la actualización de stock falla
        await updateOperationStatus(operationId, 'in-progress');
        throw new Error('La actualización del stock falló. La operación no se ha finalizado.');
    }

    return { success: true };
}

export async function getCompletedOperations(userId) {
    const { data, error } = await supabase
        .from('operaciones')
        .select('id, completed_at, pastillas_usadas, toneladas_tratadas, clientes ( name ), areas ( type, code )')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

    if (error) {
        console.error('Error cargando operaciones completadas:', error);
        throw error;
    }
    return data;
}
