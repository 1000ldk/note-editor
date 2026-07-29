# note-editor backend (iOS向けAPI)

フロントエンド（Next.js + NextAuth、Cookieセッション）とは別に、iOSアプリ用にトークンベースの認証APIを提供する。同じPostgreSQLデータベース（`DATABASE_URL`）をfrontendと共有する。

## 認証方式

- ログイン成功時に `accessToken`（JWT, デフォルト15分）と `refreshToken`（ランダムなopaque文字列, デフォルト30日）を返す
- `accessToken` は `Authorization: Bearer <token>` ヘッダーで保護エンドポイントに送る
- `refreshToken` はハッシュ化してDB（`RefreshToken`テーブル）に保存し、失効・ローテーションが可能
- `/api/auth/refresh` は呼ばれるたびにrefreshTokenをローテーション（古いトークンは無効化）。検証と失効は単一の条件付きUPDATEで行うため、同じトークンを同時に2回提示しても新しいトークンが2本発行されることはない
- **再利用検知**: 失効済みのrefreshTokenが提示された場合、失効からの経過時間で扱いを分ける
  - `REFRESH_REUSE_GRACE_SECONDS`（既定30秒）以内 … レスポンスを取りこぼしたクライアントの再送とみなし、後継トークンを失効させたうえで再発行する（有効なトークンは常にチェーンに1本だけ）
  - それを超える … 盗難とみなし、そのユーザーの有効なrefreshTokenをすべて失効させる
- 期限切れ・失効済みの `RefreshToken` 行は6時間ごとに削除される（`deleteExpiredRefreshTokens`）
- `/api/auth/login` はIP+アカウント単位、`/register`・`/refresh` はIP単位でレート制限する
- ログアウトは `/api/auth/logout` でDB上のrefreshTokenを無効化するだけ（access tokenはJWTなので失効までは自然有効期限切れを待つ）

## セットアップ

```bash
cd backend
cp .env.example .env   # DATABASE_URL, JWT_ACCESS_SECRET, ALLOWED_ORIGIN を設定
npm install            # postinstall で prisma generate が走る
psql "$DATABASE_URL" -f prisma/sql/001_create_refresh_token.sql    # 初回のみ（再実行しても安全）
psql "$DATABASE_URL" -f prisma/sql/002_normalize_user_email.sql    # 既存DBがある場合のみ。中身の手順に従うこと
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
- **email正規化は frontend と backend の両方で同じでなければならない**。frontend側は `frontend/src/lib/normalizeEmail.ts`（register と NextAuth の `authorize` の両方が使用）。片方だけ変えると、同一アドレスで別アカウントが作られたり、Webで登録したユーザーがiOSからログインできなくなる。
- `ALLOWED_ORIGIN` は必須。未設定の場合は起動時にエラーになる（デフォルトで全オリジンを許可しないため）。
