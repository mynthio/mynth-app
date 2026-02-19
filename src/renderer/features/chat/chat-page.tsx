import { Link } from "@tanstack/react-router";
import { WindowChrome } from "@/components/app/window-chrome";

export function ChatPage() {
	return (
		<WindowChrome
			toolbar={
				<div className="flex items-center gap-3">
					<h1 className="font-heading text-sm font-semibold tracking-tight">Chat</h1>
					<Link
						to="/settings"
						className="inline-flex h-7 items-center rounded-md border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					>
						Settings
					</Link>
				</div>
			}
			contentClassName="overflow-auto"
		>
			<main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
				<p className="text-muted-foreground">Chat interface coming soon.</p>
				<Link
					to="/settings"
					className="inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Go to Settings
				</Link>
			</main>
		</WindowChrome>
	);
}
