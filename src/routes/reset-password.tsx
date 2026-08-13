import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      if (!data.session) setMsg("افتح رابط تغيير كلمة المرور الذي وصلك بالبريد الإلكتروني");
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMsg("كلمتا المرور غير متطابقتين");
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("تم تغيير كلمة المرور بنجاح");
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/auth" }), 700);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر تغيير كلمة المرور");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page" style={{ maxWidth: 400, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center" }}>تغيير كلمة المرور</h1>
      <form onSubmit={onSubmit} className="add-form" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          كلمة المرور الجديدة
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!ready}
          />
        </label>
        <label>
          تأكيد كلمة المرور
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!ready}
          />
        </label>
        {msg && (
          <div style={{ padding: 10, background: "#f3f4f6", borderRadius: 8, fontSize: 14 }}>{msg}</div>
        )}
        <button
          type="submit"
          disabled={!ready || busy}
          style={{ padding: "10px 16px", background: "#990707", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
        >
          {busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
        </button>
      </form>
    </div>
  );
}
