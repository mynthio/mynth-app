import { Link, Outlet } from "@tanstack/react-router";

const navItems = [
	{ to: "/settings", label: "General", exact: true },
	{ to: "/settings/providers", label: "Providers" },
	{ to: "/settings/appearance", label: "Appearance" },
] as const;

export function SettingsLayout() {
	return (
		<div className="mx-auto flex min-h-full w-full gap-6 px-6 py-6">
			<nav className="w-48 shrink-0 space-y-1">
				<Link
					to="/chat"
					className="mb-4 inline-flex w-fit items-center gap-1 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
				>
					← Chat
				</Link>
				<h2 className="mb-3 font-heading text-lg font-semibold tracking-tight">
					Settings
				</h2>
				{navItems.map((item) => (
					<Link
						key={item.to}
						to={item.to}
						activeOptions={{ exact: "exact" in item }}
						className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
					>
						{item.label}
					</Link>
				))}
			</nav>
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}
