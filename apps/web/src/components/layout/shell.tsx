import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
