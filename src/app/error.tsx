"use client";

/**
 * Global error boundary — catches runtime errors that would otherwise
 * show a blank white screen. Displays a friendly error message with a
 * retry button.
 */

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console (Sentry/other error tracking can hook in here)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-rose-50 dark:bg-rose-950">
          <AlertTriangle className="size-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or return to the home
          page.
        </p>
        {error.digest && (
          <p className="mb-4 rounded-md bg-muted px-3 py-2 font-mono text-[10px] text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <Button onClick={reset} className="h-10">
            <RotateCcw className="mr-2 size-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            className="h-10"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="mr-2 size-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
