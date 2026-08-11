import Container from "@/app/components-home/ui/Container";
import Section from "@/app/components-home/ui/Section";

/**
 * Suspense fallback for a department listing.
 *
 * Deliberately shaped like the real listing — banner, chip strip, toolbar,
 * sidebar, four-column grid — so the page doesn't reflow when the products
 * arrive. A generic spinner would be less work and would cost a visible layout
 * shift on every navigation.
 *
 * This is a plain component rather than a `loading.tsx`, and that distinction
 * is load-bearing. `loading.tsx` wraps the *whole* route segment, so the
 * response status is flushed before the page has decided whether the department
 * exists — a missing department then renders correct not-found UI under an HTTP
 * 200. Used as an explicit boundary inside the page instead, the existence
 * check stays in the shell (real 404s) and only the product query streams.
 */
export default function ListingSkeleton() {
  return (
    <>
      <Section flush label="Loading department">
        <div className="h-promo animate-pulse rounded-xl bg-mist" />
      </Section>

      <Container className="pt-5">
        <ul className="-mx-1 flex gap-2 overflow-hidden px-1 pb-1">
          {Array.from({ length: 7 }, (_, i) => (
            <li key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-mist" />
          ))}
        </ul>
      </Container>

      <div className="mt-4 border-y border-line bg-white">
        <Container>
          <div className="flex h-12 items-center justify-between">
            <div className="h-3 w-24 animate-pulse rounded bg-mist" />
            <div className="h-9 w-40 animate-pulse rounded-md bg-mist" />
          </div>
        </Container>
      </div>

      <Container className="pt-6">
        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="space-y-4">
              <div className="h-4 w-20 animate-pulse rounded bg-mist" />
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="space-y-2 border-b border-line pb-4">
                  <div className="h-2.5 w-16 animate-pulse rounded bg-mist" />
                  <div className="h-8 w-full animate-pulse rounded bg-mist" />
                  <div className="h-8 w-full animate-pulse rounded bg-mist" />
                </div>
              ))}
            </div>
          </aside>

          <ul className="grid min-w-0 flex-1 grid-cols-2 gap-card sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
                <div className="aspect-[4/3] animate-pulse bg-mist" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-mist" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-mist" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-mist" />
                  <div className="h-8 w-full animate-pulse rounded-md bg-mist" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </>
  );
}
