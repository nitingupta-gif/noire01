"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    // Auto sign-in right after successful signup
    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push("/account/login");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="max-w-[400px] mx-auto px-6 py-20">
      <h1 className="font-display text-3xl mb-2" style={{ color: "#211A2E" }}>Create Account</h1>
      <p className="text-sm mb-6" style={{ color: "#7A7086" }}>Join the NOIRÉ circle.</p>

      <div className="flex flex-col gap-3">
        <input
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="px-3 py-3 text-sm"
          style={{ border: "1px solid #EDE0D0" }}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="px-3 py-3 text-sm"
          style={{ border: "1px solid #EDE0D0" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="px-3 py-3 text-sm"
          style={{ border: "1px solid #EDE0D0" }}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          className="px-3 py-3 text-sm"
          style={{ border: "1px solid #EDE0D0" }}
        />

        {error && <span className="text-xs" style={{ color: "#B4664F" }}>{error}</span>}

        <button
          onClick={handleSignup}
          disabled={loading}
          className="py-3.5 text-xs tracking-widest mt-2 disabled:opacity-50"
          style={{ background: "#FF3D68", color: "#fff" }}
        >
          {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
        </button>
      </div>

      <p className="text-center text-xs mt-6" style={{ color: "#7A7086" }}>
        Already have an account?{" "}
        <a href="/account/login" style={{ color: "#FF3D68" }}>Sign in</a>
      </p>
    </div>
  );
}