// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Unauthorized from "@/components/admin/Unauthorized";
import { auth } from "@/lib/firebase";
import { ADMIN_CREDENTIALS } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      if (userCred.user.email !== ADMIN_CREDENTIALS.email) {
        setError("Access denied: You are not the portfolio owner (Gaurav).");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError("Login failed: " + err.message);
    }
  };

  return (
    <Unauthorized
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleLogin={handleLogin}
      error={error}
    />
  );
}
