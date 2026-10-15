"use client";

import { ExternalLink, Package, Settings, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/site";

const items = [
  { href: "/admin", label: "الطلبات", icon: ShoppingCart, match: (p: string) => p === "/admin" || p.startsWith("/admin/orders") },
  { href: "/admin/products", label: "المنتجات", icon: Package, match: (p: string) => p.startsWith("/admin/products") },
  { href: "/admin/settings", label: "الإعدادات والمحتوى", icon: Settings, match: (p: string) => p.startsWith("/admin/settings") },
  { href: "/admin/team", label: "المسؤولون", icon: Users, match: (p: string) => p.startsWith("/admin/team") },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام لوحة التحكم" className="overflow-x-auto px-2 pb-2 lg:px-3 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 whitespace-nowrap rounded-[var(--radius-md)] px-3 text-[0.95rem] font-medium transition-colors",
                  active ? "bg-ink text-paper" : "text-ink hover:bg-mist",
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/"
            target="_blank"
            className="flex min-h-11 items-center gap-3 whitespace-nowrap rounded-[var(--radius-md)] px-3 text-[0.95rem] text-muted hover:bg-mist"
          >
            <ExternalLink aria-hidden className="size-5" strokeWidth={1.75} />
            عرض المتجر
          </Link>
        </li>
      </ul>
    </nav>
  );
}
