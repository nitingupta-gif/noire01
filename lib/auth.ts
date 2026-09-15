// lib/auth.ts
// NextAuth v5 (Auth.js) configuration.

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // JWT so middleware can read role without a DB hit
  pages: {
    signIn: "/account/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Never leak whether the email exists — same generic failure either way.
        if (!user || !user.passwordHash) return null;
        if (user.isDisabled) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    // Role and user id travel in the JWT so they're available in middleware and server actions.
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? token.role;
        token.id = (user as any).id ?? token.sub;
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub ?? (token as any).id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});

// --- Sign-up (called from app/api/auth/signup/route.ts) ---
// Password hashing happens here, server-side, never on the client.
export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}