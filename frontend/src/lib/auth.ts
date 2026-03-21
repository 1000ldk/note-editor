import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  adapter: PrismaAdapter(prisma),
  providers: [
    // 本来はGoogleやGitHub等のOAuthを推奨しますが、今は開発用に簡易的なCredentialsを使用します
    CredentialsProvider({
      name: "開発用ログイン",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          // テスト用に自動でユーザーを作成
          user = await prisma.user.create({
            data: { email: credentials.email, name: "Test User", plan: "FREE" },
          })
        }

        return user
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
}
