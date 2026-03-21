import { toastState } from './state.js';
import type { ToastData, ToastOptions } from './types.js';

let idCounter = 0;

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `toast-${++idCounter}`;
}

function ensureToaster(): void {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('lui-toaster')) {
    const el = document.createElement('lui-toaster');
    document.body.appendChild(el);
  }
}

/**
 * Imperative toast API.
 *
 * @example
 * ```ts
 * import { toast } from '@lit-ui/toast';
 * toast('Hello world');
 * toast.success('Saved!');
 * toast.error('Something went wrong');
 * toast.promise(fetchData(), { loading: 'Loading...', success: 'Done!', error: 'Failed' });
 * ```
 */
export function toast(
  messageOrOptions: string | ToastOptions,
  options?: ToastOptions,
): string {
  // SSR guard
  if (typeof document === 'undefined') return '';

  const opts: ToastOptions = typeof messageOrOptions === 'string'
    ? { ...options, title: messageOrOptions }
    : messageOrOptions;

  const id = opts.id ?? generateId();

  const data: ToastData = {
    id,
    variant: opts.variant ?? 'default',
    title: opts.title,
    description: opts.description,
    duration: opts.duration ?? 5000,
    dismissible: opts.dismissible ?? true,
    action: opts.action,
    position: opts.position ?? 'bottom-right',
    onDismiss: opts.onDismiss,
    onAutoClose: opts.onAutoClose,
    createdAt: Date.now(),
  };

  ensureToaster();
  toastState.add(data);
  return id;
}

toast.success = (message: string, opts?: ToastOptions): string =>
  toast(message, { ...opts, variant: 'success' });

toast.error = (message: string, opts?: ToastOptions): string =>
  toast(message, { ...opts, variant: 'error' });

toast.warning = (message: string, opts?: ToastOptions): string =>
  toast(message, { ...opts, variant: 'warning' });

toast.info = (message: string, opts?: ToastOptions): string =>
  toast(message, { ...opts, variant: 'info' });

toast.dismiss = (id: string): void => toastState.dismiss(id);

toast.dismissAll = (): void => toastState.dismissAll();

toast.promise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  },
  opts?: ToastOptions,
): Promise<T> => {
  const id = toast(messages.loading, { ...opts, variant: 'loading', duration: 0 });
  promise.then(
    (data) => toastState.update(id, {
      variant: 'success',
      title: typeof messages.success === 'function' ? messages.success(data) : messages.success,
      promiseState: 'success',
      duration: opts?.duration ?? 5000,
      createdAt: Date.now(),
    }),
    (err) => toastState.update(id, {
      variant: 'error',
      title: typeof messages.error === 'function' ? messages.error(err) : messages.error,
      promiseState: 'error',
      duration: opts?.duration ?? 5000,
      createdAt: Date.now(),
    }),
  );
  return promise;
};
