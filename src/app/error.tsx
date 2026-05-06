"use client";

import { AppErrorFallback } from "@/components/AppErrorFallback";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppErrorFallback reset={reset} />;
}
