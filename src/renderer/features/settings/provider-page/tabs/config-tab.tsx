import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getSupportedProviderById } from "../../../../../shared/providers/catalog";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDeleteProvider } from "@/mutations/providers";
import { listProvidersQueryOptions } from "@/queries/providers";

interface ProviderConfigTabProps {
  providerId: string;
}

export function ProviderConfigTab({ providerId }: ProviderConfigTabProps) {
  const navigate = useNavigate();
  const providersQuery = useQuery(listProvidersQueryOptions);
  const deleteProvider = useDeleteProvider();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const provider = providersQuery.data?.find((item) => item.id === providerId);
  const catalogProvider = provider ? getSupportedProviderById(provider.catalogId) : null;

  function handleDeleteConfirm(): void {
    if (!provider) {
      return;
    }

    deleteProvider.mutate(provider.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        void navigate({ to: "/settings" });
      },
    });
  }

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

            {deleteProvider.isError ? (
              <Alert variant="error">
                <AlertTitle>Failed to delete provider</AlertTitle>
                <AlertDescription>{getErrorMessage(deleteProvider.error)}</AlertDescription>
              </Alert>
            ) : null}

            <Alert variant="warning">
              <AlertTitle>Delete provider</AlertTitle>
              <AlertDescription>
                Deleting this provider permanently removes the provider profile and all connected
                models.
              </AlertDescription>
              <AlertAction>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteProvider.reset();
                    setIsDeleteDialogOpen(true);
                  }}
                  disabled={deleteProvider.isPending}
                >
                  Delete Provider
                </Button>
              </AlertAction>
            </Alert>
          </>
        )}
      </CardPanel>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              {provider
                ? `Delete "${provider.displayName}" and all models connected to it? This action cannot be undone.`
                : "Delete this provider and all models connected to it? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="secondary" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!provider || deleteProvider.isPending}
            >
              Delete Provider
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </Card>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
}
