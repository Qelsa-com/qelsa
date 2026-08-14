"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useRegisterMutation } from "../features/api/authApi";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [register, { isLoading }] = useRegisterMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form).unwrap();
      alert("Registered successfully!");
      router.push("/login"); // ✅ Next.js navigation
    } catch (err: any) {
      alert(err?.data?.message || "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 mx-auto mt-10">
      <input name="email" placeholder="Email" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} className="border p-2 rounded" />
      <input name="password" placeholder="Password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} className="border p-2 rounded" />
      <button type="submit" disabled={isLoading} className="bg-blue-600 text-white py-2 rounded disabled:opacity-50">
        {isLoading ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
