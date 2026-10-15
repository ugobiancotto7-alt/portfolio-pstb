import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/pstb-logo.jpg" alt="Paris School of Technology & Business" width={40} height={40} className="rounded-md" />
          <p>Bachelor Data &amp; IA · Paris School of Technology &amp; Business</p>
        </div>
        <p>© {new Date().getFullYear()} Ugo, Tim &amp; Marcelo</p>
      </div>
    </footer>
  );
}
