// src/js/main.js
import supabase from './modules/supabase.js';
import { initNewOperationView } from './views/NewOperation.js';

// --- ELEMENTOS DEL DOM ---
const loginView = document.getElementById('view-login');
const dashboardView = document.getElementById('view-dashboard');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const errorMessage = document.getElementById('login-error');
const userEmailDisplay = document.getElementById('user-email-display'); 

// --- ESTADO DE LA APLICACIÓN ---
let isDashboardInitialized = false;

// --- MANEJO DE VISTAS Y AUTENTICACIÓN ---
function handleAuthStateChange(session) {
    if (session && session.user) {
        // Usuario logueado
        loginView.style.display = 'none';
        dashboardView.style.display = 'flex';
        
        if (userEmailDisplay) {
            userEmailDisplay.textContent = session.user.email;
        }

        // Inicializamos la vista del dashboard SOLO UNA VEZ
        if (!isDashboardInitialized) {
            initNewOperationView();
            isDashboardInitialized = true;
        }

    } else {
        // Usuario no logueado
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        isDashboardInitialized = false; // Reseteamos el estado si el usuario cierra sesión
    }
}

async function main() {
    // Listener para el formulario de login
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';
        const email = event.target.email.value;
        const password = event.target.password.value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Error de login:', error.message);
            errorMessage.textContent = 'Email o contraseña incorrectos.';
            return;
        }
    });
    
    // Listener para el botón de logout
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error al cerrar sesión:', error.message);
        }
    });

    // Escucha cambios en el estado de autenticación (login, logout)
    supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthStateChange(session);
    });

    console.log('✅ Fagaz PWA iniciada y lista para autenticar.');
}

document.addEventListener('DOMContentLoaded', main);