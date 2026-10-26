import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Nie ma takiej strony</h1>
      <p className="mt-2 text-muted-foreground">Być może model zniknął z katalogu albo link jest błędny.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/narciarstwo/narty-zjazdowe" className="bg-primary px-4 py-2 font-semibold text-white">
          Katalog nart
        </Link>
        <Link href="/narciarstwo/osrodki" className="border border-border px-4 py-2">
          Ośrodki
        </Link>
      </div>
    </div>
  );
}
