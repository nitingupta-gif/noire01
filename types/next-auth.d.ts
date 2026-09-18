import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT } from "next-auth/jwt";

export {};

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role?: "CUSTOMER" | "ADMIN";
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: "CUSTOMER" | "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "CUSTOMER" | "ADMIN";
  }
}
