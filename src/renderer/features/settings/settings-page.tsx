import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateWorkspaceName } from "@/mutations/workspaces";
import { findWorkspaceById, listWorkspacesQueryOptions } from "@/queries/workspaces";
import { parseWorkspaceName, workspaceNameSchema } from "../../../shared/workspace/workspace-name";

interface SettingsPageProps {
  workspaceId?: string;
}

export function SettingsPage({ workspaceId }: SettingsPageProps) {
  const { data: workspaces } = useQuery(listWorkspacesQueryOptions);
  const workspace = findWorkspaceById(workspaces, workspaceId);

  if (workspaceId && !workspace) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">General</h1>
        <p className="text-muted-foreground">Loading workspace settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">General</h1>
      {workspaceId ? (
        <p className="text-muted-foreground">
          General settings for {workspace?.name ?? `workspace "${workspaceId}"`}.
        </p>
      ) : (
        <p className="text-muted-foreground">General settings and configuration.</p>
      )}
      {workspace ? (
        <WorkspaceNameForm
          key={`${workspace.id}:${workspace.name}`}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />
      ) : null}
    </div>
  );
}

interface WorkspaceNameFormProps {
  workspaceId: string;
  workspaceName: string;
}

function WorkspaceNameForm({ workspaceId, workspaceName }: WorkspaceNameFormProps) {
  const updateWorkspaceName = useUpdateWorkspaceName();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: workspaceName,
    },
    onSubmit: async ({ value, formApi }) => {
      setSubmitError(null);

      const parsedName = parseWorkspaceName(value.name);
      if (!parsedName.ok) {
        return;
      }

      try {
        const updatedWorkspace = await updateWorkspaceName.mutateAsync({
          id: workspaceId,
          name: parsedName.value,
        });
        formApi.reset({ name: updatedWorkspace.name });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Failed to update workspace name.");
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Name</CardTitle>
        <CardDescription>Update how this workspace appears in settings and chat.</CardDescription>
      </CardHeader>
      <CardPanel>
        <Form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="name"
            validators={{
              onChange: workspaceNameSchema,
              onBlur: ({ value }) => {
                const parsed = parseWorkspaceName(value);
                return parsed.ok ? undefined : parsed.error;
              },
              onSubmit: ({ value }) => {
                const parsed = parseWorkspaceName(value);
                return parsed.ok ? undefined : parsed.error;
              },
            }}
          >
            {(field) => {
              const errorMessage = getFirstErrorMessage(field.state.meta.errors);
              return (
                <Field className="max-w-md">
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    autoComplete="off"
                    aria-invalid={errorMessage ? true : undefined}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      setSubmitError(null);
                      field.handleChange(event.target.value);
                    }}
                  />
                  <FieldDescription>
                    Must be between 1 and 64 characters after trimming.
                  </FieldDescription>
                  {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
                </Field>
              );
            }}
          </form.Field>

          <div className="flex flex-col gap-2">
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isDirty: state.isDirty,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isDirty, isSubmitting }) => (
                <Button
                  type="submit"
                  className="w-fit"
                  disabled={!canSubmit || !isDirty || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Name"}
                </Button>
              )}
            </form.Subscribe>
            {submitError ? (
              <p className="text-destructive-foreground text-xs">{submitError}</p>
            ) : null}
          </div>
        </Form>
      </CardPanel>
    </Card>
  );
}

function getFirstErrorMessage(errors: readonly unknown[]): string | null {
  for (const error of errors) {
    const message = getErrorMessage(error);
    if (message) {
      return message;
    }
  }

  return null;
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error)) {
    for (const nestedError of error) {
      const nestedMessage = getErrorMessage(nestedError);
      if (nestedMessage) {
        return nestedMessage;
      }
    }

    return null;
  }

  if (typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    return typeof message === "string" ? message : null;
  }

  return null;
}
