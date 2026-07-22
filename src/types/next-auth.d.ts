import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    onboarded?: boolean;
    sessionVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      onboarded: boolean;
      sessionVersion: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    onboarded?: boolean;
    sessionVersion?: number;
  }
}
