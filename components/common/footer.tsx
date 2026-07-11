// @app/components/common/footer.tsx
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <Link
              target="_blank"
              href={"https://bekke-research.com/"}
              className="flex items-center gap-2"
            >
              <Image
                src="/logo.webp"
                className="w-7 h-auto"
                alt="Logo"
                width={100}
                height={10}
              />
              <p className="font-serif text-2xl italic tracking-tight text-foreground">
                Veritas
              </p>
            </Link>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Veritas is a research tool for evidence review. It helps determine
              whether references can be located and linked to recognised
              authorities — not whether their claims are true.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:gap-8">
            <div>
              <p className="font-medium text-foreground">Explore</p>
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href="/verify"
                  className="transition-colors hover:text-foreground"
                >
                  Verification workspace
                </Link>
                <Link
                  href="/about"
                  className="transition-colors hover:text-foreground"
                >
                  Methodology
                </Link>
              </div>
            </div>
            <div>
              <p className="font-medium text-foreground">Policy</p>
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-foreground"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />
        <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Veritas</span>
          <span>
            Designed for academic integrity, editorial review, and evidence-led
            verification.
          </span>
        </div>
      </div>
    </footer>
  );
}
