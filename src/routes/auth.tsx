import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/wasl" });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = async () => {
    if (!email) {
      setMsg("اكتب البريد الإلكتروني أولاً");
      return;
    }

    setResetBusy(true);
    setMsg(null);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMsg("تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر إرسال رابط تغيير كلمة المرور");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="auth-page" style={{ maxWidth: 400, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center" }}>تسجيل الدخول</h1>
      <form
        onSubmit={onSubmit}
        className="add-form"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label>
          البريد الإلكتروني
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          كلمة المرور
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
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
          {busy ? "جارٍ التحقق..." : "دخول"}
        </button>
        <button
          type="button"
          onClick={onResetPassword}
          disabled={resetBusy}
          style={{
            padding: "8px 12px",
            background: "transparent",
            color: "#111827",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {resetBusy ? "جارٍ الإرسال..." : "نسيت كلمة المرور؟"}
        </button>
      </form>
    </div>
  );
}
