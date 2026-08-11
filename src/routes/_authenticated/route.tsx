import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isLocallyAuthenticated } from "@/lib/local-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (!isLocallyAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
