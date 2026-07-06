"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { AdminLogin } from "./admin-login";
import { AdminDashboard } from "./admin-dashboard";
import { Footer } from "./footer";

export function AdminRoute() {
  const router = useRouter();
  const { adminAuthed, adminAuthChecked, checkAdminAuth } = useStore();

  useEffect(() => {
    if (!adminAuthChecked) checkAdminAuth();
  }, [adminAuthChecked, checkAdminAuth]);

  const goHome = () => router.push("/");

  if (!adminAuthed) {
    return <AdminLogin onExit={goHome} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard
        onExit={goHome}
        onLogout={async () => {
          const { adminLogout } = useStore.getState();
          await adminLogout();
          router.push("/");
        }}
      />
      <Footer />
    </div>
  );
}
