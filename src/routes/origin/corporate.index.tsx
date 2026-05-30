import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/origin/corporate/")({
  beforeLoad: () => {
    throw redirect({ to: "/origin/corporate/staff" });
  },
});
