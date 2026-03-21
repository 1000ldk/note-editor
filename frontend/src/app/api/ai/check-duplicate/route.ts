import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OpenAI } from "openai";

// Instantiate OpenAI. It's OK if API key is empty strings initially.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ユーザー情報・プランの確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.plan !== "PREMIUM") {
      return new NextResponse("Payment Required (Premium feature)", { status: 402 });
    }

    const { targetText } = await req.json();
    if (!targetText) {
      return new NextResponse("Missing target text", { status: 400 });
    }

    // ユーザーの既存のトピックを取得
    const topics = await prisma.topic.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50, // 上限を設けてAIのトークン溢れを防止
    });

    if (topics.length === 0) {
      return NextResponse.json({ isDuplicate: false, message: "既存トピックはありません" });
    }

    // AIのAPIキーがない場合はダミーの判定を返す（開発環境の動作確認用）
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy") {
      console.warn("No OPENAI_API_KEY set. Returning mock duplicate response.");
      // 偶然にも「テスト」という文字が含まれていたらモックで重複とする
      const mockDuplicate = topics.find((t: any) => t.title.includes("テスト") || targetText.includes(t.title));
      if (mockDuplicate) {
        return NextResponse.json({
          isDuplicate: true,
          duplicateTopicId: mockDuplicate.id,
          message: `「${mockDuplicate.title}」と似ている可能性があります。`,
        });
      }
      return NextResponse.json({ isDuplicate: false, message: "重複は見つかりませんでした(Mock)" });
    }

    const topicsListText = topics.map((t: any) => `ID:${t.id} - ${t.title}`).join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `あなたはユーザーの「悩みやアイディア」が、過去のメモと重複しているか・関連しているかを判定するAIです。
以下の過去のメモ一覧と、新たに入力されたテキストを比較してください。
もし関連性が高い、または重複しているものがあれば、その「ID」と「理由」を返してください。
なければ isDuplicate: false としてください。
必ず以下のJSONフォーマットで返答してください。
{ "isDuplicate": boolean, "duplicateTopicId": "関連するID", "message": "理由や提案" }
`,
        },
        {
          role: "user",
          content: `【過去のメモ】\n${topicsListText}\n\n【新たな入力】\n${targetText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiRes = response.choices[0].message.content;
    const result = aiRes ? JSON.parse(aiRes) : { isDuplicate: false };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI_CHECK_DUPLICATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
