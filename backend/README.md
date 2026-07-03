# note-editor backend (iOS向けAPI)

フロントエンド（Next.js + NextAuth、Cookieセッション）とは別に、iOSアプリ用にトークンベースの認証APIを提供する。同じPostgreSQLデータベース（`DATABASE_URL`）をfrontendと共有する。

## 認証方式

- ログイン成功時に `accessToken`（JWT, デフォルト15分）と `refreshToken`（ランダムなopaque文字列, デフォルト30日）を返す
- `accessToken` は `Authorization: Bearer <token>` ヘッダーで保護エンドポイントに送る
- `refreshToken` はハッシュ化してDB（`RefreshToken`テーブル）に保存し、失効・ローテーションが可能
- `/api/auth/refresh` は呼ばれるたびにrefreshTokenをローテーション（古いトークンは無効化）
- ログアウトは `/api/auth/logout` でDB上のrefreshTokenを無効化するだけ（access tokenはJWTなので失効までは自然有効期限切れを待つ）

## セットアップ

```bash
cd backend
cp .env.example .env   # DATABASE_URL, JWT_ACCESS_SECRET などを設定
npm install
npm run prisma:generate
npm run prisma:push    # RefreshTokenテーブルを既存DBに追加
npm run dev
```

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

- `prisma/schema.prisma` の `User`/`Account`/`Session`/`VerificationToken`/`Topic`/`Memo` は `frontend/prisma/schema.prisma` と同じDBを指すため、フィールドを変更する場合は両方を同期させること。
- `RefreshToken` テーブルのみこのバックエンドが所有する。
