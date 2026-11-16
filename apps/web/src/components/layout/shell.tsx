import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="print:hidden"><Sidebar /></div>
      <div className="flex flex-1 flex-col">
        <div className="print:hidden"><Navbar /></div>
        <main className="flex-1 px-8 py-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
