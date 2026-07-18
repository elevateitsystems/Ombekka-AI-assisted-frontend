// @app/components/common/headers.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link
          target="_blank"
          href="https://bekke-research.com/"
          className="flex items-center gap-3"
        >
          <Image
            src="/logo.webp"
            className="w-7 h-auto"
            alt="Logo"
            width={100}
            height={10}
          />
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-soft">
            V
          </div> */}
          <div>
            <p className="font-serif text-xl italic tracking-tight text-foreground">
              Mnemic
            </p>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:block">
              document forensics
            </p>
          </div>
        </Link>

        <NavigationMenu>
          <NavigationMenuList className="gap-2">
            {[
              { lable: "Home", href: "/" },
              { lable: "Verify", href: "/verify" },
              { lable: "About", href: "/about" },
            ]?.map((item) => (
              <NavigationMenuItem key={item?.href}>
                <NavigationMenuLink asChild>
                  <Link
                    // key={item?.href}
                    href={item?.href}
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-active:bg-accent/70 data-state-open:bg-accent/70",
                      isActive(item?.href) &&
                        "bg-accent text-accent-foreground",
                    )}
                  >
                    {item?.lable}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
