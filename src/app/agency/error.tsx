"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Agency error:", error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-rose-50 dark:bg-rose-950">
          <AlertTriangle className="size-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">
          Agency Error
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          An error occurred while loading the agency console.
        </p>
        <Button onClick={reset} className="h-10">
          <RotateCcw className="mr-2 size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
