import SiteFooter from "./SiteFooter";

// Closing section for inner pages that don't end with their own footer.
export default function PageFooter() {
  return (
    <section id="page-footer" className="surface surface-ink relative w-full overflow-x-clip px-6 pb-16 pt-12 md:px-14 lg:px-20">
      <div className="relative z-10 mx-auto max-w-6xl">
        <SiteFooter />
      </div>
    </section>
  );
}
