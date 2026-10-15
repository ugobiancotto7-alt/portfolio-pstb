import type { Metadata } from "next";
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
        <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </Container>
  );
}
