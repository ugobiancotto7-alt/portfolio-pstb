import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Articles" };

export default async function ArticlesPage() {
  const { items } = await api.articles();
  return (
    <Container>
      <PageHeader n="03" label="Articles" title="Articles">
        Comptes rendus d&apos;événements, projets et cours marquants.
      </PageHeader>
      {items.length === 0 ? (
        <p className="mt-10 text-muted">Aucun article publié pour l&apos;instant.</p>
      ) : (
        <>
          {/* Le plus récent à la une, les suivants en grille */}
          <div data-reveal className="mt-14">
            <ArticleCard article={items[0]} featured />
          </div>
          {items.length > 1 && (
            <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {items.slice(1).map((a, i) => (
                <div key={a.id} data-reveal style={{ "--i": i } as CSSProperties}>
                  <ArticleCard article={a} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
}
