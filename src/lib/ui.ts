// Lightweight bridge to the dialogs and toast rendered by <UIRoot />.

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("sfc:toast", { detail: message }));
}

export function showInfo(title: string, label: string, body: string) {
  window.dispatchEvent(new CustomEvent("sfc:info", { detail: { title, label, body } }));
}
