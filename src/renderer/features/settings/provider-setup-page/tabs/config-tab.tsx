import type { ProviderCredentialTestResult } from "../../../../../shared/ipc";
import type { SupportedProviderDefinition } from "../../../../../shared/providers/catalog";
import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface ProviderSetupConfigTabProps {
  provider: SupportedProviderDefinition;
  configValues: Record<string, string>;
  hasRequiredFields: boolean;
  canSubmitCredentialTest: boolean;
  isTestingCredentials: boolean;
  isSaving: boolean;
  testResult: ProviderCredentialTestResult | null;
  testError: string | null;
  saveError: string | null;
  onFieldChange: (key: string, value: string) => void;
  onTest: () => void;
  onSave: () => void;
}

export function ProviderSetupConfigTab({
  provider,
  configValues,
  hasRequiredFields,
  canSubmitCredentialTest,
  isTestingCredentials,
  isSaving,
  testResult,
  testError,
  saveError,
  onFieldChange,
  onTest,
  onSave,
}: ProviderSetupConfigTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Config</CardTitle>
        <CardDescription>Configure the required fields for {provider.name}.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-4">
        {Object.entries(provider.configFields).map(([key, field]) => (
          <Field key={key} className="max-w-xl">
            <FieldLabel htmlFor={`${provider.id}-${key}`}>{field.label}</FieldLabel>
            <Input
              id={`${provider.id}-${key}`}
              type={field.type === "secret" ? "password" : "text"}
              autoComplete="off"
              placeholder={field.placeholder}
              value={configValues[key] ?? ""}
              onChange={(event) => {
                onFieldChange(key, event.target.value);
              }}
            />
            <FieldDescription>
              {field.description}
              {field.type === "secret"
                ? " Your value is encrypted and stored securely on this device."
                : null}
            </FieldDescription>
          </Field>
        ))}

        {!provider.supportsCredentialTest ? (
          <Alert variant="info">
            <AlertTitle>Credential test unavailable</AlertTitle>
            <AlertDescription>
              This provider does not expose a supported validation endpoint yet.
            </AlertDescription>
          </Alert>
        ) : null}

        {testError ? (
          <Alert variant="error">
            <AlertTitle>Test request failed</AlertTitle>
            <AlertDescription>{testError}</AlertDescription>
          </Alert>
        ) : null}

        {testResult ? (
          <Alert variant={testResult.ok ? "success" : "error"}>
            <AlertTitle>{testResult.ok ? "Credentials valid" : "Credentials rejected"}</AlertTitle>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        ) : null}

        {saveError ? (
          <Alert variant="error">
            <AlertTitle>Failed to save provider</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" render={<Link to="/settings/providers/new" />}>
            <span>Back</span>
          </Button>
          <Button
            variant="secondary"
            disabled={!canSubmitCredentialTest || isTestingCredentials || isSaving}
            onClick={onTest}
          >
            <span>{isTestingCredentials ? "Testing..." : "Test"}</span>
          </Button>
          <Button disabled={!hasRequiredFields || isSaving} onClick={onSave}>
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </CardPanel>
    </Card>
  );
}
