// sw.js (Service Worker)

// Evento 'install': se dispara cuando el SW se instala.
// Ideal para cachear los assets principales de la app (el "app shell").
self.addEventListener('install', (event) => {
    console.log('SW instalado.');
});

// Evento 'fetch': se dispara cada vez que la app hace una petición de red.
// Aquí interceptaremos las peticiones para servir desde el caché si estamos offline.
self.addEventListener('fetch', (event) => {
    // Lógica de cacheo irá aquí.
});