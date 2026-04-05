"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { PenTool, Network } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<{ plan: string; points: number; rank: string }>({
    plan: "FREE",
    points: 0,
    rank: "ブロンズ",
  });

  useEffect(() => {
    if (session) {
      fetch("/api/user/plan")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setUserData(data);
          }
        });
    }
  }, [session]);

  const togglePlan = async () => {
    const newPlan = userData.plan === "FREE" ? "PREMIUM" : "FREE";
    await fetch("/api/user/plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    setUserData(prev => ({ ...prev, plan: newPlan }));
  };

  if (status === "loading") {
    return <div className="text-gray-500 py-10 text-center">読み込み中...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-10">
        <h2 className="text-5xl font-extrabold mb-6 font-sans text-on-surface">アイデアを、ひとつの記事に。</h2>
        <p className="text-on-surface-variant mb-12 whitespace-pre-wrap text-center leading-loose font-serif text-xl">
          日々の悩みをメモし、AIを使った重複判定で整理。{`\n`}
          自由空間でアイデアをつなぎ合わせて、{`\n`}あなただけのnote記事の種を作りましょう。
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="bg-primary hover:bg-primary-container text-white font-bold py-4 px-10 rounded-full transition-colors shadow-lg active:scale-95"
          >
            ログインして始める
          </Link>
          <Link
            href="/register"
            className="bg-surface-container hover:bg-surface-container-high text-primary font-bold py-4 px-10 rounded-full transition-colors shadow-sm active:scale-95 border border-primary/20"
          >
            新規登録
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-10 py-12 space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 font-sans">こんにちは、{session.user?.name || "ユーザー"}さん</h2>
          <div className="flex items-center gap-4 mt-3">
            <p className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
              プラン: <span className="font-bold text-emerald-600">{userData.plan}</span>
            </p>
            <p className="text-sm font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
              ランク: {userData.rank}
            </p>
            <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center">
              ⭐ {userData.points} pt
            </p>
            <button onClick={togglePlan} className="text-xs underline text-gray-400 hover:text-gray-600">
              (プラン切替テスト)
            </button>
          </div>
        </div>
        <button
          id="logout-btn"
          onClick={() => signOut()}
          className="mt-4 md:mt-0 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          ログアウト
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/memos" className="group block">
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 whisper-shadow group-hover:border-primary/30 transition-all hover:-translate-y-1 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-5 text-primary">
              <div className="p-3 bg-primary/10 rounded-xl">
                <PenTool size={26} />
              </div>
              <h3 className="text-2xl font-bold font-sans text-on-surface">メモを書く</h3>
            </div>
            <p className="text-on-surface-variant/90 text-sm leading-relaxed font-serif">
              アイデアや長文を禅スタイルで書き出せるエディタです。集中して文章を書きたいときに最適です。
            </p>
          </div>
        </Link>

        <Link href="/topics" className="group block">
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 whisper-shadow group-hover:border-primary/30 transition-all hover:-translate-y-1 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-5 text-primary">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Network size={26} />
              </div>
              <h3 className="text-2xl font-bold font-sans text-on-surface">悩みを記録</h3>
            </div>
            <p className="text-on-surface-variant/90 text-sm leading-relaxed font-serif">
              思いついたトピックや日常のちょっとした悩みを素早く記録します。PremiumプランでAI重複チェックが可能です。
            </p>
          </div>
        </Link>

        <Link href="/canvas" className="group block">
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 whisper-shadow group-hover:border-primary/30 transition-all hover:-translate-y-1 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-5 text-primary">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Network size={26} />
              </div>
              <h3 className="text-2xl font-bold font-sans text-on-surface">キャンバス</h3>
            </div>
            <p className="text-on-surface-variant/90 text-sm leading-relaxed font-serif">
              記録した悩みを自由空間に配置し、線で繋ぎ合わせてテーマに昇華します。視覚的に整理しましょう。
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
