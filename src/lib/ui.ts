// Lightweight bridge to the dialogs and toast rendered by <UIRoot />.

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("btg:toast", { detail: message }));
}

export function showInfo(title: string, label: string, body: string) {
  window.dispatchEvent(new CustomEvent("btg:info", { detail: { title, label, body } }));
}
