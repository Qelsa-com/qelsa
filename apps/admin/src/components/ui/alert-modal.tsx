"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Info } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AlertTone = "default" | "danger";

export type AlertOptions = {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: AlertTone;
};

type AlertFn = (options: AlertOptions) => Promise<boolean>;

const AlertContext = createContext<AlertFn | null>(null);

function AlertModal({
  options,
  onResolve,
}: {
  options: AlertOptions;
  onResolve: (confirmed: boolean) => void;
}) {
  const danger = options.tone === "danger";
  return (
    <AlertDialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onResolve(false);
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[22px] border border-white/12 bg-[#0b0d17] p-0 text-white shadow-2xl">
          <div className="flex items-start gap-3 p-5 sm:p-6">
            <span
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                danger
                  ? "border border-rose-400/25 bg-rose-400/10 text-rose-300"
                  : "border border-sky-400/25 bg-sky-400/10 text-sky-300"
              }`}
            >
              {danger ? <AlertTriangle className="size-4" /> : <Info className="size-4" />}
            </span>
            <div className="min-w-0">
              <AlertDialogPrimitive.Title className="text-base font-bold leading-snug text-white">
                {options.title}
              </AlertDialogPrimitive.Title>
              {options.description ? (
                <AlertDialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-white/55">
                  {options.description}
                </AlertDialogPrimitive.Description>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] p-4 sm:flex-row sm:justify-end sm:p-5">
            <AlertDialogPrimitive.Cancel className="inline-flex h-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white">
              {options.cancelText ?? "Cancel"}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={() => onResolve(true)}
              className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-bold text-white transition-opacity hover:opacity-90 ${
                danger ? "bg-rose-500 hover:bg-rose-500" : "bg-sky-500 hover:bg-sky-500"
              }`}
            >
              {options.confirmText ?? "Continue"}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const resolve = useCallback((confirmed: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setOptions(null);
    resolver?.(confirmed);
  }, []);

  const alert = useCallback<AlertFn>((next) => {
    resolverRef.current?.(false);
    return new Promise<boolean>((resolvePromise) => {
      resolverRef.current = resolvePromise;
      setOptions(next);
    });
  }, []);

  return (
    <AlertContext.Provider value={alert}>
      {children}
      {options ? <AlertModal options={options} onResolve={resolve} /> : null}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const alert = useContext(AlertContext);
  if (!alert) throw new Error("useAlert must be used within AlertProvider");
  return alert;
}
