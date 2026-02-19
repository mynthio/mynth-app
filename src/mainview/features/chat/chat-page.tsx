import { Link } from "@tanstack/react-router";

export function ChatPage() {
	return (
		<main className="mx-auto flex min-h-full w-full flex-col gap-6 px-6 py-6">
			<h1 className="font-heading text-3xl font-semibold tracking-tight">
				Chat
			</h1>
			<p className="text-muted-foreground">Chat interface coming soon.</p>
			<Link
				to="/settings"
				className="inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
			>
				Go to Settings
			</Link>
		</main>
	);
}
