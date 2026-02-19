import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

import { useWorkspaceStore } from "@/stores/workspace-store";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	const initialize = useWorkspaceStore((s) => s.initialize);

	useEffect(() => {
		void initialize();
	}, [initialize]);

	return (
		<div className="theme flex h-full min-h-0 flex-col bg-background text-foreground">
			<Outlet />
		</div>
	);
}
