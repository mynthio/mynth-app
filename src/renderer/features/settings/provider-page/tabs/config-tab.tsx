import { useQuery } from "@tanstack/react-query";
import { getSupportedProviderById } from "../../../../../shared/providers/catalog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { listProvidersQueryOptions } from "@/queries/providers";

interface ProviderConfigTabProps {
  providerId: string;
}

export function ProviderConfigTab({ providerId }: ProviderConfigTabProps) {
  const providersQuery = useQuery(listProvidersQueryOptions);
  const provider = providersQuery.data?.find((item) => item.id === providerId);
  const catalogProvider = provider ? getSupportedProviderById(provider.catalogId) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Config</CardTitle>
        <CardDescription>Provider configuration summary for this profile.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-4">
        {providersQuery.isPending ? (
          <div className="text-muted-foreground text-sm">Loading provider config...</div>
        ) : providersQuery.isError ? (
          <div className="text-destructive text-sm">
            Failed to load provider details: {getErrorMessage(providersQuery.error)}
          </div>
        ) : !provider ? (
          <div className="text-destructive text-sm">Provider not found.</div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Display Name</FieldLabel>
                <Input readOnly disabled value={provider.displayName} />
              </Field>

              <Field>
                <FieldLabel>Provider</FieldLabel>
                <div className="flex h-10 items-center gap-2 rounded-md border px-3">
                  <span className="text-sm">{catalogProvider?.name ?? provider.catalogId}</span>
                  <Badge variant="outline">{provider.catalogId}</Badge>
                </div>
              </Field>
            </div>

            <Field>
              <FieldLabel>Provider Record ID</FieldLabel>
              <Input readOnly disabled value={provider.id} />
            </Field>

            {catalogProvider ? (
              <div className="space-y-4">
                {Object.entries(catalogProvider.configFields).map(([key, field]) => (
                  <Field key={key} className="max-w-xl">
                    <FieldLabel htmlFor={`${provider.id}-${key}-summary`}>{field.label}</FieldLabel>
                    <Input
                      id={`${provider.id}-${key}-summary`}
                      readOnly
                      disabled
                      type={field.type === "secret" ? "password" : "text"}
                      value=""
                      placeholder={
                        field.type === "secret" ? "Stored securely (hidden)" : "Configured"
                      }
                    />
                    <FieldDescription>
                      {field.description}
                      {field.type === "secret"
                        ? " Secret values are stored securely on this device and are hidden."
                        : null}
                    </FieldDescription>
                  </Field>
                ))}
              </div>
            ) : (
              <Alert variant="warning">
                <AlertTitle>Unsupported provider definition</AlertTitle>
                <AlertDescription>
                  This provider record exists, but the provider catalog entry is not available in
                  this build.
                </AlertDescription>
              </Alert>
            )}

            <Alert variant="info">
              <AlertTitle>Editing config here is not available yet</AlertTitle>
              <AlertDescription>
                Use the provider setup flow to create a new provider profile when you need different
                credentials.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardPanel>
    </Card>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
}
