"use client";

import { ReactNode, useLayoutEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { authStore } from "@/lib/auth-store";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useLayoutEffect(() => {
    authStore.hydrate();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
