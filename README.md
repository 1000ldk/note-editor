# NoteIdeaMapper

noteクリエイターのための、「悩みから記事の種を育てる」アイデア整理・統合ツール。

## 概要
ユーザーの日常の悩みや閃きをメモし、自由空間の「キャンバス」上で線でつないで一つの記事の種（潜在ニーズ）に合体させることができます。
さらに、AIが過去のメモから重複や類似事項を提案してくれるため、似たような記事を量産するのを防ぎます（※AI機能はプレミアム機能想定）。

## 起動方法 (開発環境)

**必須ソフト**: Docker (Docker Compose), Node.js (npm)

ターミナルで以下のコマンドを順に実行してください。

```bash
# 1. コンテナ群(データベース等)の起動
docker compose up -d

# 2. フロントエンドのディレクトリへ移動
cd frontend

# 3. (初回のみ)パッケージのインストール
npm install

# 4. 開発用サーバーの起動
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスすると表示されます。

## AIチェックのテストに関して

現在、OpenAIのAPIキーが未設定の場合は「モックモード」で動作します。
もしお手持ちのOpenAI API Keyを使用したい場合は、`frontend/.env` に以下を追記してコンテナを再起動してください。

```
OPENAI_API_KEY="sk-xxxx..."
```

## アプリケーションの動き
* 開発用のテストアカウントとして以下が作成済みです。
  * ユーザー名: `test`
  * メールアドレス: `test@a.com`
  * パスワードは README には記載していません。必要な場合は、ローカル環境用の `.env` や初期シード手順で設定してください。
* ダッシュボードの「テスト用プラン切替」をクリックすると、無料/有料(AI機能有効)を切り替えることができます。
* 「悩みをメモする」でいくつかメモを作成した後、「キャンバスを開く」からReact Flowのノードを操作して繋げることができます（データはSQLiteに保存されます）。

## トラブルシューティング・エラー解消履歴

### 1. Dockerコンテナ起動時の `npm error ENOTEMPTY` エラー
- **原因**: 開発ホスト（Windows）の `node_modules` とコンテナ（Linux）側の同期が競合・ロックされたため。
- **対応**: `docker-compose.yml` の `volumes` に `- /app/node_modules` を追加し、匿名ボリュームとしてコンテナ内部とホスト環境を分離することで解決。

### 2. NextAuthの `session.user.id` の型エラー
- **原因**: `next-auth` の標準型定義では `User` オブジェクトに `id` プロパティが存在しないため。
- **対応**: `frontend/src/types/next-auth.d.ts` を作成し、`Session` インターフェースを拡張して `id` を追加定義することで解消。

### 3. Windows環境での `npm install` 実行権限エラー
- **原因**: PowerShellの実行ポリシー制限により、npmを実行するためのスクリプト（`npm.ps1`）がブロックされたため。
- **対応**: PowerShellで `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` を実行し、ローカルでのスクリプト実行許可を付与して解決。


どうやらWEB版でもVSCODEが利用でいるらしい。
