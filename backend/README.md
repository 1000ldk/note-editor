# note-editor backend (iOS向けAPI)

フロントエンド（Next.js + NextAuth、Cookieセッション）とは別に、iOSアプリ用にトークンベースの認証APIを提供する。同じPostgreSQLデータベース（`DATABASE_URL`）をfrontendと共有する。

## 認証方式

- ログイン成功時に `accessToken`（JWT, デフォルト15分）と `refreshToken`（ランダムなopaque文字列, デフォルト30日）を返す
- `accessToken` は `Authorization: Bearer <token>` ヘッダーで保護エンドポイントに送る
- `refreshToken` はハッシュ化してDB（`RefreshToken`テーブル）に保存し、失効・ローテーションが可能
- `/api/auth/refresh` は呼ばれるたびにrefreshTokenをローテーション（古いトークンは無効化）。検証と失効は単一の条件付きUPDATEで行うため、同じトークンを同時に2回提示しても新しいトークンが2本発行されることはない
- **再利用検知**: 既に失効済みのrefreshTokenが提示された場合、そのユーザーの有効なrefreshTokenをすべて失効させる（盗難時のカスケード失効）
- 期限切れ・失効済みの `RefreshToken` 行は6時間ごとに削除される（`deleteExpiredRefreshTokens`）
- `/api/auth/login` はIP+アカウント単位、`/register`・`/refresh` はIP単位でレート制限する
- ログアウトは `/api/auth/logout` でDB上のrefreshTokenを無効化するだけ（access tokenはJWTなので失効までは自然有効期限切れを待つ）

## セットアップ

```bash
cd backend
cp .env.example .env   # DATABASE_URL, JWT_ACCESS_SECRET, ALLOWED_ORIGIN を設定
npm install            # postinstall で prisma generate が走る
psql "$DATABASE_URL" -f prisma/sql/001_create_refresh_token.sql   # 初回のみ
npm run dev
```

> **`prisma db push` / `prisma migrate` を backend で実行しないこと。**
> このDBのスキーマは `frontend/prisma/migrations` が唯一の正であり、
> `backend/prisma/schema.prisma` は型付きクライアント生成のための部分コピーにすぎない。
> backendから push すると、frontend側にしか存在しない列（`Topic.categoryName` / `Topic.color` など）を
> 削除する差分が生成される。`RefreshToken` テーブルは上記のSQLで作成する。

## エンドポイント

| Method | Path               | 説明                                   |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/health`           | ヘルスチェック                          |
| POST   | `/api/auth/register`| ユーザー登録                            |
| POST   | `/api/auth/login`   | ログイン → access/refresh token発行     |
| POST   | `/api/auth/refresh` | refresh tokenをローテーションしaccess発行 |
| POST   | `/api/auth/logout`  | refresh tokenを無効化                   |
| GET    | `/api/me`           | ログイン中ユーザー情報（要access token） |

## 注意

- `prisma/schema.prisma` の `User`/`Account`/`Session`/`VerificationToken`/`Topic`/`Memo` は `frontend/prisma/schema.prisma` と同じDBを指すため、フィールドを変更する場合は両方を同期させること。スキーマ変更は必ずfrontend側のマイグレーションで行い、このファイルにはその結果をコピーするだけにする。
- `RefreshToken` テーブルのみこのバックエンドが所有する。
- bcryptのコストファクター・エラーメッセージ・email正規化は `src/lib/authPolicy.ts` に集約している。`frontend/src/app/api/auth/register/route.ts` と挙動を揃える必要があるため、どちらかを変更したら両方を更新すること。
- `ALLOWED_ORIGIN` は必須。未設定の場合は起動時にエラーになる（デフォルトで全オリジンを許可しないため）。
