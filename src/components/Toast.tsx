// ============================================================
// NiyamAI — Toast Notification Component
// ============================================================

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 400);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`toast ${toast.type}`} role="alert">
      <span style={{ fontWeight: 700 }}>{ICONS[toast.type]}</span>
      {toast.message}
    </div>
  );
}

// Hook for toast management
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, push, dismiss };
}
