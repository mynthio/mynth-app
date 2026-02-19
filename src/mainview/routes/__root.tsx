import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<div className="theme min-h-full bg-background text-foreground">
			<Outlet />
		</div>
	);
}
