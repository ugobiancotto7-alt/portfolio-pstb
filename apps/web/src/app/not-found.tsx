import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <Link href="/" className="mt-6 inline-block text-brand-600 hover:underline dark:text-brand-400">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
