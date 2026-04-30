"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { OAuthReturnHandler } from "@/components/oauth-return-handler";
import { createQueryClient } from "@/lib/query-client";
import { authStore } from "@/lib/auth-store";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    authStore.hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <OAuthReturnHandler />
      {children}
    </QueryClientProvider>
  );
}
