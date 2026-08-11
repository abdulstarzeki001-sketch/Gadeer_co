import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isLocallyAuthenticated, LOCAL_AUTH_EMAIL, signInLocally } from "@/lib/local-auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isLocallyAuthenticated()) navigate({ to: "/wasl" });
  }, [navigate]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMsg(null);

    const authenticated = await signInLocally(LOCAL_AUTH_EMAIL, password);
    if (authenticated) {
      navigate({ to: "/wasl" });
    } else {
      setMsg("كلمة المرور غير صحيحة.");
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
          البريد الإلكتروني
          <input type="email" value={LOCAL_AUTH_EMAIL} readOnly autoComplete="username" />
        </label>
        <label>
          كلمة المرور
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {msg && (
          <div role="alert" style={{ padding: 10, background: "#fef2f2", borderRadius: 8 }}>
            {msg}
          </div>
        )}
        <button type="submit" disabled={busy}>
          {busy ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
