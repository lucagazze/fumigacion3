// src/js/utils/viewUtils.js

export function hideAllViews() {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
}
