import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "開発用ログイン",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
      },
      async authorize(credentials) {
        const email = credentials?.email || "test@example.com";
        console.log('Authorize called with email:', email);

        try {
          let user = await prisma.user.findUnique({
            where: { email },
          });
          
          if (!user) {
            user = await prisma.user.create({
              data: { email, name: "Test User", plan: "FREE" },
            });
          }
          return user;
        } catch (error) {
          console.error('Error during authorize:', error);
          return null;
        }
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
  debug: true
}
