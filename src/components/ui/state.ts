import type { ToastData, Subscriber } from './types.js';

/**
 * Singleton state manager for toast notifications.
 * Connects the imperative toast() API to the <lui-toaster> web component
 * via the observer pattern (subscribe/notify).
 */
class ToastState {
  private _toasts: ToastData[] = [];
  private _subscribers = new Set<Subscriber>();

  get toasts(): readonly ToastData[] {
    return this._toasts;
  }

  subscribe(fn: Subscriber): () => void {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }

  private _notify(): void {
    this._subscribers.forEach(fn => fn());
  }

  add(toast: ToastData): void {
    this._toasts = [toast, ...this._toasts];
    this._notify();
  }

  dismiss(id: string): void {
    const toast = this._toasts.find(t => t.id === id);
    this._toasts = this._toasts.filter(t => t.id !== id);
    toast?.onDismiss?.();
    this._notify();
  }

  dismissAll(): void {
    this._toasts.forEach(t => t.onDismiss?.());
    this._toasts = [];
    this._notify();
  }

  update(id: string, updates: Partial<ToastData>): void {
    this._toasts = this._toasts.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    this._notify();
  }
}

export const toastState = new ToastState();
