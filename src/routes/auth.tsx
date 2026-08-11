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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });

    supabase.auth.getUser().then(({ data }) => {
      const isRecoveryLink = window.location.hash.includes("type=recovery");
      if (data.user && !isRecoveryLink) navigate({ to: "/wasl" });
    });

    return () => authListener.subscription.unsubscribe();
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

  const requestPasswordReset = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setMsg("أرسلنا رابط تغيير كلمة المرور. افتح البريد واضغط الرابط للمتابعة.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر إرسال رابط تغيير كلمة المرور");
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMsg("كلمتا المرور غير متطابقتين.");
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("تم تغيير كلمة المرور بنجاح. جارٍ فتح النظام...");
      navigate({ to: "/wasl" });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر تغيير كلمة المرور");
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
      <h1 style={{ textAlign: "center" }}>
        {recoveryMode ? "تعيين كلمة مرور جديدة" : "تسجيل الدخول"}
      </h1>
      <form
        onSubmit={recoveryMode ? updatePassword : onSubmit}
        className="add-form"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label>
          البريد الإلكتروني المعتمد
          <input type="email" value={email} readOnly autoComplete="username" />
        </label>
        <label>
          {recoveryMode ? "كلمة المرور الجديدة" : "كلمة المرور"}
          <input
            type="password"
            required
            minLength={6}
            autoComplete={recoveryMode ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {recoveryMode && (
          <label>
            تأكيد كلمة المرور الجديدة
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
        )}
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
          {busy
            ? recoveryMode
              ? "جارٍ الحفظ..."
              : "جارٍ الدخول..."
            : recoveryMode
              ? "حفظ كلمة المرور"
              : "دخول"}
        </button>
        {!recoveryMode && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={requestPasswordReset}
              className="link-button"
            >
              نسيت كلمة المرور؟
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={resendConfirmation}
              className="link-button"
            >
              إعادة إرسال رابط التفعيل
            </button>
          </>
        )}
      </form>
    </div>
  );
}
