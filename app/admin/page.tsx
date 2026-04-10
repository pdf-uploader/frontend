"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminPanel } from "@/components/admin-panel";
import { isAdminUser } from "@/lib/auth-user";
import { useAuth } from "@/lib/hooks/use-auth";

export default function AdminPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && !isAdminUser(user)) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  if (token && !user) {
    return <p className="text-sm text-slate-600">Loading profile...</p>;
  }

  if (!user || !isAdminUser(user)) {
    return <p className="text-sm text-slate-600">Admin access required.</p>;
  }

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Admin Console</h1>
      <AdminPanel />
    </section>
  );
}
