import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">소모임</h1>
      <p className="mb-8 text-lg text-gray-600">
        관심사가 비슷한 사람들과 모임을 만들고 참여하세요
      </p>
      <div className="flex gap-4">
        <Link
          href="/meetings"
          className="rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
        >
          모임 둘러보기
        </Link>
        <Link
          href="/auth/login"
          className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-50"
        >
          로그인
        </Link>
      </div>
    </main>
  );
}
