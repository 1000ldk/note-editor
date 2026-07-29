import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import { normalizeEmail } from "./normalizeEmail"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "ログイン",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password", placeholder: "********" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // 登録時と同じ正規化を通す（backend/src/lib/authPolicy.ts と揃えること）
        const user = await prisma.user.findUnique({
          where: { email: normalizeEmail(credentials.email) },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return user;
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
  },
  pages: {
    signIn: '/login',
    error: '/api/auth/error', 
  },
  debug: process.env.NODE_ENV === "development",
};