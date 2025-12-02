import type { Metadata } from "next";
import { Sidebar } from "./sidebar";

export const metadata: Metadata = {
  title: "Account Dashboard",
  description: "Manage your account and orders.",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <Sidebar />
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
