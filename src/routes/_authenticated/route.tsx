import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const APPROVAL_CACHE_MS = 5 * 60_000;
let approvalCache: { userId: string; approved: boolean; checkedAt: number } | null = null;

async function requireApprovedUser() {
  // getSession() reads the locally persisted session and avoids a network round-trip
  // on every in-app navigation. The approval RPC still validates the JWT server-side.
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user) {
    approvalCache = null;
    throw redirect({ to: "/auth" });
  }

  const now = Date.now();
  if (
    approvalCache?.userId === user.id &&
    approvalCache.approved &&
    now - approvalCache.checkedAt < APPROVAL_CACHE_MS
  ) {
    return user;
  }

  const { data: isApproved, error: approvalError } = await supabase.rpc("is_approved_user");
  if (approvalError || !isApproved) {
    approvalCache = null;
    await supabase.auth.signOut();
    throw redirect({ to: "/auth" });
  }

  approvalCache = { userId: user.id, approved: true, checkedAt: now };
  return user;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => ({ user: await requireApprovedUser() }),
  component: () => <Outlet />,
});
