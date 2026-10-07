"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { LogoMark } from "./logo";

export const NAV_ITEMS = [
  { href: "/verify", label: "Verify" },
  { href: "/verifications", label: "Records" },
  { href: "/credentials", label: "Credentials" },
  { href: "/check", label: "Check" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Mobile menu: scroll lock, initial focus, Escape, focus trap, resize close.
  useEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const focusables = () =>
      [button, ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a") ?? [])].filter(
        (el): el is HTMLElement => el !== null,
      );

    document.body.style.overflow = "hidden";
    focusables()[1]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      button?.focus();
    };
  }, [open]);

  // Over the orange landing hero the header uses dark text for contrast.
  const onHero = pathname === "/" && !scrolled && !open;
  const solid = scrolled || open;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-200 ${
          solid ? "border-white/15 bg-ink/90 shadow-lg shadow-black/10 backdrop-blur-md" : "border-transparent"
        } ${onHero ? "text-black" : "text-bone"}`}
      >
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Kamano home"
            className={`inline-flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${
              onHero
                ? "focus-visible:ring-black focus-visible:ring-offset-ember-hero"
                : "focus-visible:ring-ember focus-visible:ring-offset-ink"
            }`}
          >
            <LogoMark />
            <span className="text-lg font-medium tracking-tight">Kamano</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const tone = onHero
                ? active
                  ? "text-black after:bg-black"
                  : "text-black/75 hover:text-black after:bg-black"
                : active
                  ? "text-white after:bg-white"
                  : "text-white/70 hover:text-white after:bg-white";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-2 text-sm transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember ${
                    active
                      ? "after:scale-x-100"
                      : "after:origin-right after:scale-x-0 hover:after:origin-left hover:after:scale-x-100"
                  } ${tone}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className={`group hidden min-h-11 items-center gap-2 rounded-md px-5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:inline-flex ${
                onHero
                  ? "bg-black text-white hover:bg-white hover:text-black focus-visible:ring-black focus-visible:ring-offset-ember-hero"
                  : "bg-ember text-black hover:bg-ember-hover focus-visible:ring-white focus-visible:ring-offset-ink"
              }`}
            >
              Verify a document
              <ArrowUpRight
                aria-hidden="true"
                strokeWidth={1.5}
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </Link>
            <button
              ref={buttonRef}
              type="button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember md:hidden ${
                onHero ? "border-black/30 hover:border-black/60 hover:bg-black/10" : "border-white/20 hover:border-white/50 hover:bg-white/10"
              }`}
            >
              {open ? (
                <X aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-40 bg-ink/[0.98] px-5 pb-8 pt-24 backdrop-blur-md md:hidden"
        >
          <nav aria-label="Mobile" className="flex h-full flex-col">
            <div className="flex flex-col border-t border-white/15">
              {[{ href: "/", label: "Home" }, ...NAV_ITEMS, { href: "/audit", label: "Audit log" }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="flex min-h-16 items-center justify-between border-b border-white/15 text-2xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember"
                >
                  {item.label}
                  <ArrowRight aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
                </Link>
              ))}
            </div>
            <Link
              href="/verify"
              className="mt-auto inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-ember px-5 text-base font-medium text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Verify a document <ArrowUpRight aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
