import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/traders")({
  head: () => ({ meta: [{ title: "التجار - الكمارك" }] }),
  component: () => <Outlet />,
});
