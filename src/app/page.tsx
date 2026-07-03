"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const router = useRouter();
  const tokens = useAuthStore((state) => state.tokens);

  useEffect(() => {
    router.replace(tokens ? "/tasks" : "/login");
  }, [tokens, router]);

  return null;
}