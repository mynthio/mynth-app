import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<div className="theme flex h-full min-h-0 flex-col bg-background text-foreground">
			<Outlet />
		</div>
	);
}
