import { DocsFooterNav } from "@/components/docs-footer-nav";
import { DocsSidebar } from "@/components/docs-sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-8">
        <DocsSidebar />
      </aside>
      <article className="prose-rvct min-w-0">
        {children}
        <DocsFooterNav />
      </article>
    </div>
  );
}
