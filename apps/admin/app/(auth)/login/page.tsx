"use client";
import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      alert("Invalid admin credentials");
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Sign In</h1>

      <input
        className="input"
        placeholder="Admin Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input mt-2"
        type="password"
        placeholder="Admin Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="mt-4 px-4 py-2 bg-black text-white"
      >
        Login
      </button>
    </div>
  );
}
