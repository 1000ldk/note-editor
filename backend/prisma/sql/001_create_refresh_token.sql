-- RefreshToken is the only table owned by the backend.
--
-- The frontend owns every other table in this database via
-- frontend/prisma/migrations, so the backend must never run `prisma db push`
-- or `prisma migrate` (it would diff its partial schema copy against the real
-- database and drop frontend-only columns). Apply this file directly instead:
--
--   psql "$DATABASE_URL" -f prisma/sql/001_create_refresh_token.sql
--
-- It is idempotent and safe to re-run.

CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id"        TEXT         NOT NULL,
  "tokenHash" TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "RefreshToken" ("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken" ("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken" ("expiresAt");

DO $$
BEGIN
  ALTER TABLE "RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
