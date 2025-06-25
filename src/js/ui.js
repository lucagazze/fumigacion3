// src/js/ui.js

/**
 * Muestra un mensaje de error en un elemento específico.
 * @param {string} elementId - El ID del elemento del mensaje de error.
 * @param {string} message - El mensaje a mostrar.
 */
export function showErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
    }
}

/**
 * Oculta un mensaje de error.
 * @param {string} elementId - El ID del elemento del mensaje de error.
 */
export function hideErrorMessage(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('visible');
    }
}