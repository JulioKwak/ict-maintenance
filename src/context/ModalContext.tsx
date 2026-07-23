import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ConfirmOptions {
  title?: string
  tone?: 'default' | 'danger'
  confirmLabel?: string
  cancelLabel?: string
}

interface AlertOptions {
  title?: string
  tone?: 'default' | 'danger'
}

interface ModalState {
  kind: 'alert' | 'confirm'
  message: string
  title?: string
  tone: 'default' | 'danger'
  confirmLabel?: string
  cancelLabel?: string
}

interface ModalContextType {
  alert: (message: string, options?: AlertOptions) => Promise<void>
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>
}

const ModalContext = createContext<ModalContextType | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null)
  const resolverRef = useRef<((result: boolean) => void) | null>(null)

  const close = useCallback((result: boolean) => {
    setState(null)
    resolverRef.current?.(result)
    resolverRef.current = null
  }, [])

  const alert = useCallback((message: string, options?: AlertOptions) => {
    return new Promise<void>(resolve => {
      resolverRef.current = () => resolve()
      setState({ kind: 'alert', message, title: options?.title, tone: options?.tone ?? 'default' })
    })
  }, [])

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve
      setState({
        kind: 'confirm',
        message,
        title: options?.title,
        tone: options?.tone ?? 'default',
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
      })
    })
  }, [])

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-sm" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
            <div className="flex items-center gap-2 p-5 pb-0">
              {state.tone === 'danger'
                ? <AlertTriangle size={16} style={{ color: '#ff3b30' }} />
                : <CheckCircle2 size={16} style={{ color: '#0066cc' }} />}
              <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>
                {state.title ?? (state.kind === 'confirm' ? '확인' : '알림')}
              </h3>
            </div>
            <div className="p-5">
              <p style={{ fontSize: '14px', color: '#333333', lineHeight: 1.47, whiteSpace: 'pre-wrap' }}>
                {state.message}
              </p>
              <div className="flex gap-3 mt-4">
                {state.kind === 'confirm' && (
                  <button type="button" onClick={() => close(false)} className="btn-secondary flex-1">
                    {state.cancelLabel ?? '취소'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={state.tone === 'danger' ? 'btn-danger flex-1' : 'btn-primary flex-1'}
                  autoFocus
                >
                  {state.kind === 'confirm' ? (state.confirmLabel ?? '확인') : '확인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
