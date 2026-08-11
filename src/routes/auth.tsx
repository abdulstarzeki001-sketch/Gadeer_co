import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const email = "star007@gmail.com";
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error?.code === "email_not_confirmed") {
        setMsg(
          "الحساب غير مفعّل بعد. افتح رسالة Supabase في بريدك واضغط رابط التفعيل، أو أعد إرسال الرابط أدناه.",
        );
        return;
      }
      if (error) throw error;
      navigate({ to: "/wasl" });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const resendConfirmation = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
      setMsg("أرسلنا رابط تفعيل جديداً. افحص صندوق الوارد والرسائل غير المرغوب فيها.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر إرسال رابط التفعيل");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center" }}>تسجيل الدخول</h1>
      <form
        onSubmit={onSubmit}
        className="add-form"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label>
          البريد الإلكتروني المعتمد
          <input type="email" value={email} readOnly autoComplete="username" />
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
          {busy ? "جارٍ الدخول..." : "دخول"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={resendConfirmation}
          style={{
            padding: "8px 12px",
            background: "none",
            color: "#990707",
            border: "none",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          إعادة إرسال رابط التفعيل
        </button>
      </form>
    </div>
  );
}
