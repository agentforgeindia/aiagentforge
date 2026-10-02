// Tiny shared state for the in-app shell: Android back-button handlers
// and one-line toast messages. Only used inside the Android app.

type BackHandler = () => boolean | void;

const backHandlers: BackHandler[] = [];

/**
 * Register something that should close when Android "back" is pressed
 * (a sheet, an image viewer…). The newest handler runs first.
 * Returns an unregister function.
 */
export function pushBackHandler(handler: BackHandler): () => void {
  backHandlers.push(handler);
  return () => {
    const i = backHandlers.lastIndexOf(handler);
    if (i >= 0) backHandlers.splice(i, 1);
  };
}

/** Runs the newest handler. True when a handler took the back press. */
export function runBackHandlers(): boolean {
  const handler = backHandlers[backHandlers.length - 1];
  if (!handler) return false;
  return handler() !== false;
}

type ToastListener = (message: string) => void;

let toastListener: ToastListener | null = null;

export function setToastListener(listener: ToastListener | null): void {
  toastListener = listener;
}

export function appToast(message: string): void {
  toastListener?.(message);
}
