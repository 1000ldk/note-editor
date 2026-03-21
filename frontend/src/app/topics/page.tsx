"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";

export default function TopicsPage() {
  const { status } = useSession();
  const [topics, setTopics] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [aiMessage, setAiMessage] = useState<{ isDuplicate: boolean; message: string; duplicateId?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopics();
    fetch("/api/user/plan").then((r) => r.json()).then((d) => setPlan(d.plan));
  }, []);

  const fetchTopics = async () => {
    const res = await fetch("/api/topics");
    if (res.ok) {
      setTopics(await res.json());
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setAiMessage(null);

    // AI Check for Premium users
    let shouldProceed = true;
    if (plan === "PREMIUM") {
      try {
        const aiRes = await fetch("/api/ai/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetText: title }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.isDuplicate) {
            setAiMessage({
              isDuplicate: true,
              message: aiData.message,
              duplicateId: aiData.duplicateTopicId,
            });
            shouldProceed = false; // Stop auto-saving, let user decide
          }
        }
      } catch (err) {
        console.error("AI Check Failed", err);
      }
    }

    if (shouldProceed) {
      await saveTopic(title);
    }
    setLoading(false);
  };

  const saveTopic = async (textToSave: string, parentId?: string) => {
    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: textToSave, parentId }),
    });
    if (res.ok) {
      setTitle("");
      setAiMessage(null);
      fetchTopics();
    }
  };

  const forceSave = async () => {
    await saveTopic(title);
  };

  const mergeSave = async () => {
    if (aiMessage?.duplicateId) {
      await saveTopic(title, aiMessage.duplicateId);
    }
  };

  const deleteTopic = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      await fetch(`/api/topics/${id}`, { method: "DELETE" });
      fetchTopics();
    }
  };

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <Link href="/" className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 mb-4">
          <ArrowLeft size={16} className="mr-1" /> ダッシュボードに戻る
        </Link>
        <h2 className="text-2xl font-bold">悩みをメモする</h2>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <form onSubmit={handleAddTopic}>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="今、どんなことで悩んでいますか？どんなアイディアを思いつきましたか？"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            rows={4}
            disabled={loading}
          />

          {plan === "FREE" && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600 flex items-center gap-2">
              <span className="bg-gray-200 px-2 py-1 rounded text-xs font-bold text-gray-500">FREEプラン</span>
              AIによる重複チェック機能はロックされています。
            </div>
          )}

          {plan === "PREMIUM" && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800 flex items-center gap-2">
              <Sparkles size={16} />
              「保存」時にAIが過去の悩みとの重複・関連を自動チェックします。
            </div>
          )}

          {aiMessage?.isDuplicate && (
            <div className="mt-4 p-4 border border-rose-200 bg-rose-50 rounded-xl">
              <div className="flex items-center gap-2 text-rose-700 font-bold mb-2">
                <AlertCircle size={18} />
                過去のメモと似ている可能性があります
              </div>
              <p className="text-sm text-rose-800 mb-4">{aiMessage.message}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={mergeSave}
                  className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-lg hover:bg-rose-700"
                >
                  既存のメモの下に合体して保存
                </button>
                <button
                  type="button"
                  onClick={forceSave}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50"
                >
                  気にせず新規として保存
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-right">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-gray-900 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "判定中..." : "保存する"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold border-b pb-2">過去のメモ一覧</h3>
        {topics.map((topic) => (
          <div key={topic.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-start group hover:border-gray-300 transition-colors">
            <div>
              <p className="whitespace-pre-wrap text-sm text-gray-800">{topic.title}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(topic.createdAt).toLocaleString("ja-JP")}
                {topic.parentId && <span className="ml-2 text-emerald-600">(合体済み)</span>}
              </p>
            </div>
            <button
              onClick={() => deleteTopic(topic.id)}
              className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 hover:text-rose-600"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
