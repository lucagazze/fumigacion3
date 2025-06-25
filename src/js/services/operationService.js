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

export async function registerPillApplication(operationId, totalPills, tons) {
    // Paso 1: Obtener el deposit_id de la operación para saber de dónde descontar el stock.
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

    // Paso 2: Registrar la nueva aplicación de pastillas
    const { error: insertError } = await supabase
        .from('aplicaciones')
        .insert([{
            operacion_id: operationId,
            pastillas_usadas: totalPills,
            toneladas_tratadas: tons
        }]);

    if (insertError) {
        console.error('Error al registrar la aplicación de pastillas:', insertError);
        throw insertError;
    }

    // Paso 3: Llamar a la función RPC de Supabase para actualizar el stock de forma segura
    const { error: rpcError } = await supabase.rpc('actualizar_stock', {
        cantidad: totalPills,
        id_deposito: depositId
    });

    if (rpcError) {
        console.error('Error al actualizar el stock:', rpcError);
        // Idealmente, esto debería ser una transacción. Como no lo es, informamos del problema.
        throw new Error('La actualización del stock falló. La aplicación fue registrada pero el stock no fue descontado. Contacte a un administrador.');
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
