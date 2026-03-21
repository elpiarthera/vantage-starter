export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  variant?: ToastVariant;
  title?: string;
  description?: string;
  duration?: number;        // ms, default 5000, 0 = persistent
  dismissible?: boolean;    // default true, show close X
  action?: ToastAction;
  position?: ToastPosition; // only used if toaster not already configured
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

export interface ToastData extends Required<Pick<ToastOptions, 'id' | 'variant' | 'dismissible'>> {
  title?: string;
  description?: string;
  duration: number;
  action?: ToastAction;
  position: ToastPosition;
  onDismiss?: () => void;
  onAutoClose?: () => void;
  createdAt: number;
  // Promise toast support
  promiseState?: 'loading' | 'success' | 'error';
  promiseMessages?: { loading: string; success: string | ((data: unknown) => string); error: string | ((err: unknown) => string) };
}

export type Subscriber = () => void;
