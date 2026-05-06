# NoteIdeaMapper で学ぶ Next.js 学習ログ

## このプロジェクトにおける Next.js の立ち位置

Next.js は「フロントエンドフレームワーク」と紹介されることが多いが、  
このプロジェクトでは **UI・API・認証・DB アクセスをすべて 1 つの Next アプリにまとめた「フルスタック構成」** になっている。  
別途バックエンドサーバーを立てることなく、`frontend/` の中だけで完結している。

---

## 1. ファイルベースルーティング（App Router）

`frontend/src/app/` のフォルダ・ファイル構造が、そのまま URL になる。

| ファイル | URL |
|---|---|
| `frontend/src/app/page.tsx` | `/` （ダッシュボード） |
| `frontend/src/app/memos/page.tsx` | `/memos` |
| `frontend/src/app/memos/[id]/page.tsx` | `/memos/123` など（動的ルート） |
| `frontend/src/app/canvas/page.tsx` | `/canvas` |
| `frontend/src/app/topics/page.tsx` | `/topics` |

### 動的ルートとは
`[id]` のように角括弧をフォルダ名にすると、URL の可変部分を `params.id` として受け取れる。  
例: `/memos/abc123` にアクセスすると `id = "abc123"` がページに渡される。

---

## 2. Route Handlers（サーバー API）

`frontend/src/app/api/**/route.ts` に `GET`, `POST`, `PUT`, `DELETE` などの関数を export すると、  
その関数が HTTP エンドポイントになる。いわゆるバックエンドの API 処理にあたる。

```
frontend/src/app/api/
  memos/
    route.ts          → GET /api/memos, POST /api/memos
    [id]/route.ts     → GET/PUT/DELETE /api/memos/:id
  topics/
    route.ts          → GET /api/topics, POST /api/topics
    [id]/route.ts     → DELETE /api/topics/:id など
  ai/
    check-duplicate/route.ts → POST /api/ai/check-duplicate
  user/
    plan/route.ts     → GET/PUT /api/user/plan
  auth/
    [...nextauth]/route.ts → NextAuth の認証エンドポイント
```

### 書き方の基本

```ts
// frontend/src/app/api/memos/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // ここでDBを叩いたり認証チェックをしたりする
  return NextResponse.json({ data: [] });
}

export async function POST(request: Request) {
  const body = await request.json(); // リクエストボディを取得
  return NextResponse.json({ created: true }, { status: 201 });
}
```

クライアント（ブラウザ）側からは `fetch('/api/memos')` で呼び出せる。  
**同じ Next アプリの中に API があるため、CORS 問題が起きない**のが便利。

---

## 3. "use client" と Server Component の使い分け

Next.js の App Router では、コンポーネントは原則 **サーバー側で実行される（Server Component）**。  
ブラウザの機能（`useState`, `useEffect`, イベント処理など）を使うときは、  
ファイルの先頭に `"use client"` を書く。

このプロジェクトでは**ほぼすべてのページが `"use client"`** になっている。  
理由は、データ取得を `useEffect` + `fetch` でブラウザから行っているため。

```ts
"use client"; // これを書いたファイルはブラウザで動く

import { useState, useEffect } from "react";

export default function MemosPage() {
  const [memos, setMemos] = useState([]);

  useEffect(() => {
    fetch('/api/memos').then(r => r.json()).then(setMemos);
  }, []);
  // ...
}
```

---

## 4. layout.tsx（共通レイアウト）

`frontend/src/app/layout.tsx` はすべてのページを包む「外枠」。  
サイドバーやフォント設定・メタデータなど、ページをまたいで共通なものを書く場所。

```ts
// frontend/src/app/layout.tsx
export const metadata: Metadata = {
  title: "NoteIdeaMapper",
  description: "noteクリエイターのためのアイデア整理・統合ツール",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Sidebar />
          <main>{children}</main>  {/* ← ここに各ページが入る */}
        </Providers>
      </body>
    </html>
  );
}
```

---

## 5. middleware.ts（リクエストの入口でのガード）

ページやAPIにリクエストが届く**前**に実行される特殊なファイル。  
このプロジェクトでは「ログインしていないユーザーを `/login` にリダイレクト」するために使っている。

```ts
// frontend/src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: ["/memos/:path*", "/topics/:path*", "/canvas/:path*"],
  // ↑ この3パスにマッチしたリクエストに対してのみ認証チェックを行う
};
```

`middleware.ts` は `frontend/src/app/` の外、`frontend/src/` 直下に置くのがルール。

---

## 6. NextAuth による認証

`next-auth` は Next.js 向けの認証ライブラリ。  
このプロジェクトでは**メール・パスワードによるログイン（CredentialsProvider）**を使っている。

### 設定（frontend/src/lib/auth.ts）

```ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // DBからユーザーを取得し、bcryptでパスワードを比較
        const user = await prisma.user.findUnique({ where: { email } });
        const ok = await bcrypt.compare(password, user.password);
        return ok ? user : null;
      }
    })
  ],
  session: { strategy: "jwt" }, // セッションをJWTで管理
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub; // セッションにユーザーIDを追加
      return session;
    }
  }
};
```

### API でのセッション取得

```ts
// サーバー側（API Route）でのセッション確認
import { getServerSession } from 'next-auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ログイン済みの場合のみ処理を続ける
}
```

### クライアントでのセッション参照

```ts
// "use client" なコンポーネントでセッションを見る
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
```

`SessionProvider` を `layout.tsx` 内の `Providers.tsx` でラップしているため、  
どのページでも `useSession()` が使える。

---

## 7. Prisma（DB アクセス）

Prisma は TypeScript 向けの ORM（Object Relational Mapper）。  
SQL を直接書かずに、TypeScript のオブジェクト操作でDBを扱える。

### スキーマ（frontend/prisma/schema.prisma）

```prisma
model Memo {
  id        String   @id @default(cuid())
  title     String
  content   String
  status    String   @default("DRAFT")
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topicId   String?
  topic     Topic?   @relation(fields: [topicId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 使い方（API Route の中）

```ts
import { prisma } from '@/lib/prisma';

// 一覧取得
const memos = await prisma.memo.findMany({
  where: { userId: session.user.id },
  orderBy: { updatedAt: 'desc' },
});

// 作成
const memo = await prisma.memo.create({
  data: { title, content, status, userId: session.user.id },
});

// 更新
await prisma.memo.update({ where: { id }, data: { title } });

// 削除
await prisma.memo.delete({ where: { id } });
```

---

## 8. next/font・next/link・next/navigation

### next/font
Google Fonts を**パフォーマンス最適化した形で**読み込む仕組み。  
`layout.tsx` でフォントを定義し、`className` に適用するだけでいい。

```ts
import { Noto_Sans_JP } from "next/font/google";
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"] });
// <body className={notoSansJP.className}>
```

### next/link
通常の `<a>` の代わりに使う。ページ遷移が**クライアントサイドで行われる**ため、  
フルリロードなしで素早く画面が切り替わる。

```tsx
import Link from 'next/link';
<Link href="/memos">メモ一覧</Link>
```

### next/navigation
ルーティング関係のフックが入っている。

```ts
import { useRouter, usePathname, useParams } from 'next/navigation';

const router = useRouter();
router.push('/memos'); // プログラムで画面遷移

const pathname = usePathname(); // 現在のURL
const { id } = useParams();    // [id] の動的パラメータ
```

---

## まとめ：このプロジェクトで Next.js が担っている役割

| 役割 | Next.js の機能 |
|---|---|
| URL とページの対応 | App Router（ファイルベースルーティング） |
| API（DB操作・認証チェック） | Route Handlers（`route.ts`） |
| 認証の入口ガード | `middleware.ts` |
| 認証の本体 | NextAuth（`next-auth`） |
| DB アクセス | Prisma（Next の機能ではないが同梱） |
| 共通レイアウト | `layout.tsx` |
| フォント・リンク・ルーティング | `next/font`, `next/link`, `next/navigation` |

---

## 今後のアーキテクチャ方針（モバイル / iOS対応に向けて）

将来的にiOSなどのモバイルアプリを展開する場合、現在の「Next.jsのフルスタック構成」を活かしつつ、モバイルアプリからもバックエンド（API）として利用できる設計にしていくのがおすすめです。

### 1. 基本方針：Next.jsを「共通APIサーバー」として活用する
サーバーをフロントエンド用とバックエンド用に物理的に別サーバーへ分割すると、インフラ管理やデプロイの手間が倍増します。
まずは現在の **Next.js の API Routes (`frontend/src/app/api/...`) を、Webページからもモバイルアプリからも呼び出せる共通の REST API として整える（論理的な分離）** アプローチが最適です。

### 2. モバイル対応に向けたロードマップ

#### 第1段階：ビジネスロジックの分離（リファクタリング）
現在 `route.ts` に直接書かれているデータベース操作（Prisma）や複雑な処理を、`frontend/src/lib/services/` などの別階層（Service層）に切り出します。
これにより、APIエンドポイントは「リクエストを受け取り、処理を委譲し、結果のJSONを返す」だけのシンプルな役割になり、再利用性と保守性が大きく向上します。

#### 第2段階：モバイル向け認証APIの準備
現在Webページ向けには NextAuth の Cookie ベースの認証を使用していますが、モバイルアプリからの通信では HTTPヘッダー にトークンを載せて送る形が一般的です。
モバイル向けのログインAPI（例: `/api/auth/mobile/login`）を別途作成し、アクセストークン（JWTなど）を発行・検証する仕組みを追加します。

#### 第3段階：モバイルアプリ（React Native / Expo）の開発
Web側で培った React の知識をそのまま流用できる **React Native (Expo)** を用いて iOS/Android アプリ開発をスタートします。
モバイルアプリからは、すでに整えられた Next.js のAPIエンドポイントと通信してデータを取得・更新します。

この構成ルール（画面とAPI処理の分離）を守って開発を進めておけば、将来アプリがさらに巨大になり「バックエンドをGoやRustで完全に独立させたい」となった場合でも、ロジックが綺麗に分離されているため移行が非常に簡単になります。
