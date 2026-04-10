"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminPanel } from "@/components/admin-panel";
import { useAuth } from "@/lib/hooks/use-auth";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  if (!user || user.role !== "ADMIN") {
    return <p className="text-sm text-slate-600">Admin access required.</p>;
  }

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Admin Console</h1>
      <AdminPanel />
    </section>
  );
}
