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
        password: { label: "Password", type: "password", placeholder: "password123" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        
        console.log('Authorize called with email:', email);

        if (email !== "test@example.com" || password !== "password123") {
          console.warn("Invalid test credentials");
          return null;
        }

        try {
          let user = await prisma.user.findUnique({
            where: { email },
          });
          
          if (!user) {
            user = await prisma.user.create({
              data: { 
                email, 
                name: "Test User", 
                plan: "FREE",
                points: 0,
                rank: "ブロンズ"
              },
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
  pages: {
    signIn: '/',
    error: '/api/auth/error', // Error code passed in query string as ?error=
  },
  debug: true
}
