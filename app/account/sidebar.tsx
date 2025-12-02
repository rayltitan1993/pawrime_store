"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../src/lib/utils";
import { Button } from "../../src/components/ui/button";
import { Package, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const sidebarItems = [
  {
    title: "Orders",
    href: "/account",
    icon: Package,
  },
  {
    title: "Settings",
    href: "/account/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-2">
      {sidebarItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
      <Button
        variant="ghost"
        className="justify-start gap-3 px-3 w-full text-muted-foreground hover:text-foreground"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </nav>
  );
}
