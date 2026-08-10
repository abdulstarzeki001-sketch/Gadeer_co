import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/wasl" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/wasl" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMsg(
          "تم إنشاء الحساب. تحقق من بريدك الإلكتروني إن لزم الأمر، ثم انتظر موافقة المسؤول للوصول إلى البيانات.",
        );
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center" }}>{mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
      <form
        onSubmit={onSubmit}
        className="add-form"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label>
          البريد الإلكتروني
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          كلمة المرور
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {msg && (
          <div style={{ padding: 10, background: "#f3f4f6", borderRadius: 8, fontSize: 14 }}>
            {msg}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "10px 16px",
            background: "#990707",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {busy ? "..." : mode === "signin" ? "دخول" : "تسجيل"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={{ background: "none", border: "none", color: "#990707", cursor: "pointer" }}
        >
          {mode === "signin" ? "ليس لديك حساب؟ سجّل" : "لديك حساب؟ سجّل الدخول"}
        </button>
      </form>
    </div>
  );
}
