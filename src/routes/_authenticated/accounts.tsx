import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "إدارة الحسابات | لوحة التحكم" },
      { name: "description", content: "صفحة إدارة الحسابات وحفظ الرصيد بشكل دائم في قاعدة البيانات." },
    ],
  }),
  component: AccountsPage,
});

type Account = {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("IQD");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("0");
  const [editStatus, setEditStatus] = useState("active");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    setError(null);

    const { data: sessionData, error: userError } = await supabase.auth.getUser();
    if (userError || !sessionData.user) {
      setError("تعذر الحصول على بيانات المستخدم. الرجاء تسجيل الدخول مجددًا.");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setAccounts([]);
    } else {
      setAccounts(data ?? []);
    }
    setLoading(false);
  }

  async function handleAddAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const { data: sessionData, error: userError } = await supabase.auth.getUser();
    if (userError || !sessionData.user) {
      setError("تعذر الحصول على بيانات المستخدم لإنشاء الحساب.");
      return;
    }

    const newBalance = parseFloat(balance) || 0;
    const { error: insertError } = await supabase.from("accounts").insert({
      user_id: sessionData.user.id,
      name,
      balance: newBalance,
      currency,
      status,
      description: description || null,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName("");
    setBalance("0");
    setCurrency("IQD");
    setStatus("active");
    setDescription("");
    await loadAccounts();
  }

  async function handleEdit(account: Account) {
    setEditingId(account.id);
    setEditBalance(account.balance.toString());
    setEditStatus(account.status);
    setEditDescription(account.description ?? "");
  }

  async function handleSaveEdit(accountId: string) {
    setError(null);
    const newBalance = parseFloat(editBalance) || 0;
    const { error: updateError } = await supabase
      .from("accounts")
      .update({ balance: newBalance, status: editStatus, description: editDescription || null, updated_at: new Date().toISOString() })
      .eq("id", accountId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditingId(null);
    await loadAccounts();
  }

  async function handleDelete(accountId: string) {
    setError(null);
    const confirmed = window.confirm("هل تريد حذف هذا الحساب نهائيًا؟");
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("accounts").delete().eq("id", accountId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingId === accountId) {
      setEditingId(null);
    }
    await loadAccounts();
  }

  return (
    <div style={{ padding: "1.5rem 1rem 3rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>إدارة الحسابات</h1>
        <p style={{ color: "var(--gh-muted)", marginTop: 8, lineHeight: 1.7 }}>
          هنا يمكنك إنشاء حسابات جديدة وتعديل رصيد الحسابات الحالية وحفظها بشكل دائم في قاعدة البيانات.
        </p>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>إضافة حساب جديد</h2>
          <form onSubmit={handleAddAccount} style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              اسم الحساب
              <input required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              الرصيد الابتدائي
              <input type="number" step="0.01" required value={balance} onChange={(event) => setBalance(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              العملة
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              الحالة
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="active">نشط</option>
                <option value="pending">قيد الانتظار</option>
                <option value="closed">مغلق</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              ملاحظات
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </label>
            <button type="submit" style={{ padding: "10px 16px", borderRadius: 10, background: "#990707", color: "#fff", border: "none", cursor: "pointer" }}>
              حفظ الحساب
            </button>
          </form>
        </section>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>قائمة الحسابات</h2>
              <p style={{ margin: 0, color: "#475569" }}>عرض الحسابات المخزنة المرتبطة بحسابك.</p>
            </div>
            <button onClick={loadAccounts} style={{ padding: "8px 14px", borderRadius: 10, background: "#f3f4f6", border: "1px solid #d1d5db", cursor: "pointer" }}>
              تحديث
            </button>
          </div>

          {error ? (
            <div style={{ marginBottom: 12, padding: 12, background: "#fee2e2", borderRadius: 10, color: "#991b1b" }}>{error}</div>
          ) : null}

          {loading ? (
            <div>جارٍ التحميل...</div>
          ) : accounts.length === 0 ? (
            <div>لا توجد حسابات حتى الآن.</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {accounts.map((account) => (
                <div key={account.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, background: "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <strong>{account.name}</strong>
                      <div style={{ color: "#475569", marginTop: 6 }}>{account.currency} • {account.status}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{account.balance.toLocaleString()}</div>
                      <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{new Date(account.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ margin: "12px 0", color: "#334155" }}>{account.description || "بدون ملاحظات"}</div>
                  {editingId === account.id ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <label style={{ display: "grid", gap: 6 }}>
                        رصيد الحساب
                        <input type="number" step="0.01" value={editBalance} onChange={(event) => setEditBalance(event.target.value)} />
                      </label>
                      <label style={{ display: "grid", gap: 6 }}>
                        الحالة
                        <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)}>
                          <option value="active">نشط</option>
                          <option value="pending">قيد الانتظار</option>
                          <option value="closed">مغلق</option>
                        </select>
                      </label>
                      <label style={{ display: "grid", gap: 6 }}>
                        ملاحظات
                        <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={3} />
                      </label>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={() => handleSaveEdit(account.id)} style={{ padding: "10px 16px", borderRadius: 10, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
                          حفظ التعديل
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ padding: "10px 16px", borderRadius: 10, background: "#f3f4f6", border: "1px solid #d1d5db", cursor: "pointer" }}>
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={() => handleEdit(account)} style={{ padding: "10px 16px", borderRadius: 10, background: "#9333ea", color: "#fff", border: "none", cursor: "pointer" }}>
                        تعديل
                      </button>
                      <button onClick={() => handleDelete(account.id)} style={{ padding: "10px 16px", borderRadius: 10, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
        <Link to="/" style={{ display: "inline-flex", padding: "10px 16px", borderRadius: 10, background: "#990707", color: "#fff", textDecoration: "none" }}>
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
