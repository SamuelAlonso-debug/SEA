import type { ReactNode } from "react";
import { MarketingNavbar } from "@/components/landing/landing-navbar";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar />
      <main>{children}</main>
    </div>
  );
}
