import { Link, Outlet } from "@tanstack/react-router";
import { WindowChrome } from "@/components/app/window-chrome";

const navItems = [
	{ to: "/settings", label: "General", exact: true },
	{ to: "/settings/providers", label: "Providers" },
	{ to: "/settings/appearance", label: "Appearance" },
] as const;

export function SettingsLayout() {
	return (
		<WindowChrome
			toolbar={
				<div className="flex items-center gap-3">
					<Link
						to="/chat"
						className="inline-flex h-7 items-center rounded-md border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					>
						Chat
					</Link>
					<div className="font-heading text-sm font-semibold tracking-tight">
						Settings
					</div>
					<div className="ml-2 flex items-center gap-1">
						{navItems.map((item) => (
							<Link
								key={`toolbar-${item.to}`}
								to={item.to}
								activeOptions={{ exact: "exact" in item }}
								className="inline-flex h-7 items-center rounded-md px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
							>
								{item.label}
							</Link>
						))}
					</div>
				</div>
			}
			contentClassName="overflow-hidden"
		>
			<div className="mx-auto flex h-full min-h-0 w-full gap-6 px-6 py-6">
				<nav className="w-48 shrink-0 space-y-1 overflow-auto">
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
				<main className="min-h-0 flex-1 overflow-auto">
					<Outlet />
				</main>
			</div>
		</WindowChrome>
	);
}
