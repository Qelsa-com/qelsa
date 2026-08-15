"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLoginMutation } from "../features/api/authApi";

export default function Login() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const [form, setForm] = useState({ email: "", password: "" });
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form).unwrap();
      router.push("/"); // ✅ Next.js navigation
    } catch (err) {
      alert(err?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 mx-auto mt-10">
      {message && <p className="text-red-500">{message}</p>}
      <input name="email" type="email" placeholder="Email" onChange={handleChange} className="border p-2 rounded" />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} className="border p-2 rounded" />
      <button type="submit" disabled={isLoading} className="bg-blue-600 text-white py-2 rounded disabled:opacity-50">
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
