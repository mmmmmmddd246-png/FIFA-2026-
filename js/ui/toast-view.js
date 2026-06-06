// UI: Toast notifications
const t = (key, vals) => window.miniappI18n?.t(key, vals) ?? key;

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none';
  document.body.appendChild(container);
  return container;
}

export function showToast(message, type = 'info', duration = 3000) {
  const wrap = ensureContainer();
  const colors = {
    info: 'bg-cyan-600/90 text-white',
    success: 'bg-emerald-600/90 text-white',
    error: 'bg-red-600/90 text-white',
    warning: 'bg-amber-600/90 text-white',
    goal: 'bg-emerald-500/90 text-white text-lg font-bold',
  };
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto rounded-xl px-5 py-3 shadow-lg backdrop-blur text-sm max-w-xs text-center animate-fade-up ${colors[type] || colors.info}`;
  toast.textContent = message;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
