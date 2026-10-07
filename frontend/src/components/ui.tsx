import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, type LucideIcon } from "lucide-react";

/* ---------------------------------------------------------------- layout */

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function Section({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`py-16 sm:py-20 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/** App page header: eyebrow on the left, large title on the right. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-white/15 pb-12 pt-32 sm:pt-36">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="text-sm text-ember">{eyebrow}</p>
          </div>
          <div className="lg:col-span-8">
            <h1 className="max-w-4xl text-4xl font-medium leading-tight tracking-tight sm:text-6xl">{title}</h1>
            {description && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">{description}</p>
            )}
            {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Section title row with an optional "(05)" style count. */
export function IndexHeading({
  eyebrow,
  title,
  count,
  tone = "dark",
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  count?: number;
  tone?: "dark" | "light";
  as?: "h2" | "h3";
}) {
  const muted = tone === "dark" ? "text-white/55" : "text-black/60";
  const border = tone === "dark" ? "border-white/20" : "border-black/20";
  return (
    <div className={`flex items-end justify-between gap-6 border-b ${border} pb-6`}>
      <div>
        {eyebrow && <p className={`text-sm ${muted}`}>{eyebrow}</p>}
        <Heading className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">{title}</Heading>
      </div>
      {count !== undefined && (
        <span className={`text-lg ${muted}`} aria-label={`${count} items`}>
          ({String(count).padStart(2, "0")})
        </span>
      )}
    </div>
  );
}

export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-md border border-white/15 bg-ink-raised p-6 sm:p-8 ${className}`}>{children}</div>;
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-white/55">{label}</p>
      <p className="mt-2 text-3xl font-medium tracking-tight">{value}</p>
    </div>
  );
}

/* --------------------------------------------------------------- buttons */

type Variant = "ember" | "light" | "dark" | "outline" | "outline-dark" | "danger";
type Nudge = "up-right" | "right" | "down-right" | "none";

const BASE =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  ember:
    "bg-ember text-black hover:bg-ember-hover focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
  light: "bg-white text-black hover:bg-black hover:text-white focus-visible:ring-black",
  dark: "bg-black text-white hover:bg-white hover:text-black focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ember",
  outline:
    "border border-white/25 text-bone hover:border-white hover:bg-white hover:text-black focus-visible:ring-ember",
  "outline-dark": "border border-black/40 text-black hover:border-black hover:bg-black/10 focus-visible:ring-black",
  danger:
    "border border-red-400/50 text-red-200 hover:border-red-300 hover:bg-red-500/15 focus-visible:ring-red-300",
};

const NUDGE: Record<Nudge, string> = {
  "up-right": "group-hover:translate-x-1 group-hover:-translate-y-1",
  right: "group-hover:translate-x-1",
  "down-right": "group-hover:translate-x-1 group-hover:translate-y-1",
  none: "",
};

function TrailingIcon({ icon: Icon, nudge }: { icon?: LucideIcon; nudge: Nudge }) {
  if (!Icon) return null;
  return (
    <Icon aria-hidden="true" strokeWidth={1.5} className={`h-4 w-4 transition-transform duration-200 ${NUDGE[nudge]}`} />
  );
}

type Shared = { variant?: Variant; icon?: LucideIcon; nudge?: Nudge; className?: string; children: ReactNode };

export function ButtonLink({
  href,
  variant = "ember",
  icon,
  nudge = "up-right",
  className = "",
  external = false,
  children,
}: Shared & { href: string; external?: boolean }) {
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
        <TrailingIcon icon={icon} nudge={nudge} />
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      <TrailingIcon icon={icon} nudge={nudge} />
    </Link>
  );
}

export function Button({
  variant = "ember",
  icon,
  nudge = "up-right",
  loading = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}: Shared & Omit<ComponentProps<"button">, "children" | "className"> & { loading?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
      {children}
      {!loading && <TrailingIcon icon={icon} nudge={nudge} />}
    </button>
  );
}

/* --------------------------------------------------------------- feedback */

const NOTICE = {
  error: { icon: CircleAlert, cls: "border-red-400/40 bg-red-400/10 text-red-100" },
  warning: { icon: TriangleAlert, cls: "border-amber-300/40 bg-amber-300/10 text-amber-50" },
  success: { icon: CircleCheck, cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-50" },
  info: { icon: Info, cls: "border-white/20 bg-white/5 text-white/80" },
} as const;

export function Notice({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: keyof typeof NOTICE;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, cls } = NOTICE[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-md border p-4 text-sm ${cls} ${className}`}>
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
      <div className="leading-relaxed">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-1 opacity-90" : ""}>{children}</div>}
      </div>
    </div>
  );
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-40 items-center gap-3 text-white/65">
      <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-ember" strokeWidth={1.5} />
      {label}…
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-white/20 p-8 sm:p-12">
      <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
      <p className="mt-3 max-w-xl text-white/65">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- forms */

export const inputClass =
  "min-h-12 w-full rounded-md border border-white/20 bg-ink px-4 text-base text-bone placeholder:text-white/40 transition-colors hover:border-white/40 focus-visible:border-ember focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember aria-[invalid=true]:border-red-400";

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-bone">
        {label}
        {required ? (
          <span className="text-ember" aria-hidden="true"> *</span>
        ) : (
          <span className="font-normal text-white/55"> (optional)</span>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-white/55">
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
