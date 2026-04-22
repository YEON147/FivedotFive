import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-mint)] px-6 py-10">
      <section className="w-full max-w-md rounded-[32px] bg-white px-8 py-10 text-center shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
        
        <h1 className="mt-3 text-h1 text-black">메인페이지</h1>
        <p className="mt-3 text-body text-black/70">
          원하는 선물을 담을 위시리스트를 직접 만들어보세요.
        </p>
        <Link
          href="/wishlist"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-point-coral)] px-6 text-button text-black transition-transform duration-200 hover:scale-[1.02]"
        >
          위시리스트 만들러 가기
        </Link>
      </section>
    </main>
  );
}
