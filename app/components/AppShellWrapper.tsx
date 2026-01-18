"use client";

import { usePathname } from "next/navigation";
import AppShell from "./AppShell";

type AppShellWrapperProps = {
  children: React.ReactNode;
};

const marketingRoutes = new Set(["/"]);

export default function AppShellWrapper({ children }: AppShellWrapperProps) {
  const pathname = usePathname();

  if (marketingRoutes.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <AppShell useContainer={false} containerClassName="min-h-screen">
      {children}
    </AppShell>
  );
}
