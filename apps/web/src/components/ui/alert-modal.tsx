"use client";

import { AlertTriangle, Info } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

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
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onResolve(false);
      }}
    >
      <AlertDialogContent className="w-full max-w-[calc(100%-2rem)] gap-0 rounded-[22px] border border-white/12 bg-[#0b0d17] p-0 text-white shadow-2xl sm:max-w-[420px]">
        <AlertDialogHeader className="flex-row items-start gap-3 p-5 text-left sm:p-6">
          <span
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
              danger
                ? "border border-rose-400/25 bg-rose-400/10 text-rose-300"
                : "border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan"
            }`}
          >
            {danger ? <AlertTriangle className="size-4" /> : <Info className="size-4" />}
          </span>
          <div className="min-w-0">
            <AlertDialogTitle className="text-base font-bold leading-snug text-white">
              {options.title}
            </AlertDialogTitle>
            {options.description ? (
              <AlertDialogDescription className="mt-1.5 text-sm leading-relaxed text-white/55">
                {options.description}
              </AlertDialogDescription>
            ) : null}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col-reverse gap-2 border-t border-white/[0.07] p-4 sm:flex-row sm:justify-end sm:p-5">
          <AlertDialogCancel className="mt-0 h-auto rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white">
            {options.cancelText ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onResolve(true)}
            className={`h-auto rounded-full px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 ${
              danger
                ? "bg-rose-500 hover:bg-rose-500"
                : "bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680]"
            }`}
          >
            {options.confirmText ?? "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
