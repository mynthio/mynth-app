import { createFileRoute } from "@tanstack/react-router";
import { ProvidersPage } from "@/features/settings/providers-page";

export const Route = createFileRoute("/settings/providers")({
	component: ProvidersPage,
});
