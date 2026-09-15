import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
          <span className="text-lg" aria-hidden>
            🖱️
          </span>
          <span>학과 대항전 클릭 배틀</span>
        </Link>
      </div>
    </header>
  );
}
