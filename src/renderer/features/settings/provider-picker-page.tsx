import { Link } from "@tanstack/react-router";
import { Add01Icon, BotIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORTED_PROVIDERS } from "../../../shared/providers/catalog";

export function ProviderPickerPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Add Provider</h1>
        <p className="text-muted-foreground">
          Choose a provider to start configuring API access for the app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SUPPORTED_PROVIDERS.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg border bg-card">
                <HugeiconsIcon icon={BotIcon} />
              </div>
              <CardTitle>{provider.name}</CardTitle>
              <CardDescription>{provider.description}</CardDescription>
            </CardHeader>
            <CardFooter className="justify-between gap-2">
              <span className="text-muted-foreground text-xs">
                {provider.isAvailable ? "Available" : "Coming soon"}
              </span>
              {provider.isAvailable ? (
                <Button
                  size="sm"
                  render={
                    <Link
                      to="/settings/providers/new/$providerId"
                      params={{ providerId: provider.id }}
                    />
                  }
                >
                  <HugeiconsIcon icon={Add01Icon} />
                  <span>Add</span>
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
