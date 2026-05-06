"use client";

import { AppErrorFallback } from "@/components/AppErrorFallback";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AppErrorFallback reset={reset} />
      </body>
    </html>
  );
}
