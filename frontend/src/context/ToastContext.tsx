import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { hub } from '../ws/stomp';
import type { NotificationMessage } from '../types';

interface Toast {
  id: number;
  level: 'info' | 'success' | 'warn' | 'error';
  text: string;
  time: string;
}

interface ToastCtx {
  push: (level: Toast['level'], text: string) => void;
}

const Ctx = createContext<ToastCtx>({ push: () => {} });
export const useToast = () => useContext(Ctx);

let seq = 1;
const ICONS: Record<string, string> = { info: 'ℹ', success: '✓', warn: '⚠', error: '✕' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((level: Toast['level'], text: string) => {
    const id = seq++;
    const time = new Date().toLocaleTimeString('en-GB');
    setToasts(t => [...t, { id, level, text, time }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5200);
  }, []);

  // Backend-driven notifications (order confirmed, out of stock, retry, ...)
  useEffect(() => {
    return hub.subscribe('/topic/notifications', (m: NotificationMessage) => {
      push(m.level ?? 'info', m.text);
    });
  }, [push]);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.level}`}>
            <span className="tico">{ICONS[t.level]}</span>
            <div>
              <div className="tx">{t.text}</div>
              <div className="tt">{t.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
