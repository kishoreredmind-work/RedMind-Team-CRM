
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Custom Premium styled global window.alert override
window.alert = (message: string) => {
  let dialog = document.getElementById('custom-alert-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'custom-alert-dialog';
    document.body.appendChild(dialog);
  }
  
  dialog.className = "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200";
  dialog.innerHTML = `
    <div class="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-300">
      <div class="inline-flex p-4 bg-slate-100 rounded-2xl text-slate-800 mb-6">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h3 class="text-xl font-black text-slate-900 mb-2">Notification</h3>
      <p class="text-slate-500 text-xs font-bold leading-relaxed mb-6">${message.replace(/\n/g, '<br/>')}</p>
      <button id="custom-alert-ok" class="w-full bg-black text-white py-4 rounded-full font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">OK</button>
    </div>
  `;
  
  const handleClose = () => {
    dialog!.className = "hidden";
  };

  document.getElementById('custom-alert-ok')?.addEventListener('click', handleClose);
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
