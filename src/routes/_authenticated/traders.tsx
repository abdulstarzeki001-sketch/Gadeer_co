import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/traders")({
  head: () => ({ meta: [{ title: "التجار - الكمارك" }] }),
  component: () => <Outlet />,
});
