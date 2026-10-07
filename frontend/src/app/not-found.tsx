import { ArrowLeft } from "lucide-react";
import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] items-end pb-16 pt-32">
      <Container>
        <p className="text-sm text-ember">404</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-medium leading-[0.95] tracking-tight sm:text-7xl">
          This page isn&rsquo;t on the record.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/65">The link may be out of date, or the page has moved.</p>
        <ButtonLink href="/" variant="outline" icon={ArrowLeft} nudge="none" className="mt-8">
          Back to home
        </ButtonLink>
      </Container>
    </section>
  );
}
