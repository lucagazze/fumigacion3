// src/js/auth.js
import supabase from './modules/supabase.js';

/**
 * Maneja el intento de inicio de sesión.
 * @param {Object} supabase - Instancia del cliente de Supabase.
 * @param {string} email - Email del usuario.
 * @param {string} password - Contraseña del usuario.
 */
export async function handleLogin(email, password) {
    const loginButton = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = 'Ingresando...';
    }
    if (loginError) {
        loginError.classList.add('hidden');
        loginError.textContent = '';
    }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        if (loginError) {
            loginError.textContent = 'Credenciales inválidas. Por favor, intenta de nuevo.';
            loginError.classList.remove('hidden');
        }
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = 'Ingresar';
        }
    }
    // Si el login es exitoso, el onAuthStateChange en main.js se encargará del resto.
}

/**
 * Maneja el cierre de sesión.
 * @param {Object} supabase - Instancia del cliente de Supabase.
 */
export async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Hubo un error al cerrar sesión.');
    }
}