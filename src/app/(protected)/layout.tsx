"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useAuthHasHydrated } from "@/store/useAuthStore";
import { Navbar } from "@/components/layout/Navbar";
import { Spinner } from "@/components/ui/spinner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const tokens = useAuthStore((state) => state.tokens);
  const hasHydrated = useAuthHasHydrated();

  useEffect(() => {
    if (hasHydrated && !tokens) {
      router.replace("/login");
    }
  }, [hasHydrated, tokens, router]);

  if (!hasHydrated || !tokens) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner size="sm" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}