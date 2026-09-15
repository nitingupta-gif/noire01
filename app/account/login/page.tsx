"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="login-shell min-h-[calc(100vh-4rem)] px-6 py-16 md:py-24 flex items-center justify-center">
      <div className="login-card w-full max-w-[430px] rounded-2xl border border-white/10 bg-[#21182d]/90 p-7 md:p-10 backdrop-blur-sm">
        <p className="mb-3 text-[10px] font-semibold tracking-[0.28em]" style={{ color: "#741A2F" }}>
          WELCOME BACK
        </p>
        <h1 className="font-display text-4xl" style={{ color: "#741A2F" }}>Sign In</h1>
        <p className="mt-3 mb-8 text-sm" style={{ color: "#741A2F" }}>
          Your next expression starts here.
        </p>
        <div className="flex flex-col gap-3">
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input rounded-lg px-4 py-3.5 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input rounded-lg px-4 py-3.5 text-sm"
        />
        {error && <span className="text-xs" style={{ color: "#B4664F" }}>{error}</span>}
        <button onClick={handleLogin} className="mt-2 rounded-lg py-3.5 text-xs font-semibold tracking-widest transition-transform duration-200 hover:-translate-y-0.5" style={{ background: "#FF3D68", color: "#fff", boxShadow: "0 10px 24px rgba(255, 61, 104, 0.25)" }}>
          SIGN IN
        </button>
      </div>
        <p className="mt-7 text-center text-xs" style={{ color: "#741A2F" }}>
          New to NOIRÉ?{" "}
          <a href="/account/signup" className="font-semibold" style={{ color: "#FF3D68" }}>Sign up</a>
        </p>
      </div>
    </main>
  );
}  