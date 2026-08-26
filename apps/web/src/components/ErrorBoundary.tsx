"use client";

import { userFacingErrorMessage } from "@/lib/errors";
import { AlertTriangle, RotateCcw } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional label shown in the fallback, e.g. the section name. */
  label?: string;
  /** `page` replaces the page body. `section` keeps the rest of the UI. */
  variant?: "page" | "section";
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

/**
 * Catches render errors in children (including Convex `useQuery` throws) and
 * shows an on-theme fallback instead of crashing the whole app. Reset re-mounts
 * the subtree so the query can retry.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const label = this.props.label;
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${label ? `: ${label}` : ""}]`, error, info.componentStack);
    if (this.props.variant === "section") {
      toast.error(userFacingErrorMessage(error, `Could not load ${label ?? "this section"}.`));
    }
  }

  private reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.label;
    const variant = this.props.variant ?? "page";
    const friendly = userFacingErrorMessage(this.state.message, "Something went wrong. Please try again.");

    if (variant === "section") {
      return (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-5 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Could not load {label ?? "this section"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{friendly}</p>
              </div>
            </div>
            <Button variant="outline" className="rounded-full border-glass-border" onClick={this.reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Something went wrong{label ? ` in ${label}` : ""}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm break-words text-muted-foreground">{friendly}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full border-glass-border" onClick={this.reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" className="rounded-full border-glass-border" onClick={() => window.location.assign("/jobs")}>
            Go to Jobs
          </Button>
        </div>
      </div>
    );
  }
}
