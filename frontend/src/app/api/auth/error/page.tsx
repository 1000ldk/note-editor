"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[500px]">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">認証エラー</h1>
      <p className="text-gray-600 mb-2">ログインできませんでした。</p>
      {error && <p className="text-rose-600 font-mono mb-8 bg-rose-50 px-4 py-2 rounded">Error code: {error}</p>}
      <Link href="/" className="px-6 py-2 bg-primary text-white rounded-md hover:bg-emerald-700 transition shadow-sm font-medium">
        トップページに戻る
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">読み込み中...</div>}>
      <ErrorContent />
    </Suspense>
  )
}