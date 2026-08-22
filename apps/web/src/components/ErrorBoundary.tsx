"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional label shown in the fallback, e.g. the section name. */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

/**
 * Catches render errors in children and shows an on-theme fallback instead of
 * crashing the whole app. Reset re-mounts the subtree.
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
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ""}]`, error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Something went wrong{this.props.label ? ` in ${this.props.label}` : ""}</h2>
          {this.state.message && <p className="mx-auto mt-2 max-w-md text-sm break-words text-muted-foreground">{this.state.message}</p>}
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
