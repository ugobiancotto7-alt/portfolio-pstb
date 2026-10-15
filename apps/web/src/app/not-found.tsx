import Link from "next/link";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="py-28 text-center">
      <p className="font-display text-8xl text-gradient">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page introuvable</h1>
      <Link href="/" className="mt-6 inline-block border-b border-fg pb-0.5 text-sm font-semibold">
        Retour à l&apos;accueil
      </Link>
    </Container>
  );
}
