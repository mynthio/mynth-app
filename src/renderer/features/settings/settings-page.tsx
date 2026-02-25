import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateWorkspace } from "@/mutations/workspaces";
import { findWorkspaceById, listWorkspacesQueryOptions } from "@/queries/workspaces";
import { parseWorkspaceName, workspaceNameSchema } from "../../../shared/workspace/workspace-name";

const WORKSPACE_COLORS: { hex: string; label: string }[] = [
  { hex: "#b85c5c", label: "Red" },
  { hex: "#c07840", label: "Orange" },
  { hex: "#a89040", label: "Amber" },
  { hex: "#5c9c5c", label: "Green" },
  { hex: "#40938c", label: "Teal" },
  { hex: "#4d7ab5", label: "Blue" },
  { hex: "#6b62b5", label: "Indigo" },
  { hex: "#9055a8", label: "Purple" },
  { hex: "#b55580", label: "Pink" },
  { hex: "#7a7a7a", label: "Gray" },
];

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
        <>
          <WorkspaceNameForm
            key={`${workspace.id}:${workspace.name}`}
            workspaceId={workspace.id}
            workspaceName={workspace.name}
          />
          <WorkspaceColorPicker
            key={`${workspace.id}:color`}
            workspaceId={workspace.id}
            currentColor={workspace.color}
          />
        </>
      ) : null}
    </div>
  );
}

interface WorkspaceNameFormProps {
  workspaceId: string;
  workspaceName: string;
}

function WorkspaceNameForm({ workspaceId, workspaceName }: WorkspaceNameFormProps) {
  const updateWorkspace = useUpdateWorkspace();
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
        const updatedWorkspace = await updateWorkspace.mutateAsync({
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

interface WorkspaceColorPickerProps {
  workspaceId: string;
  currentColor?: string;
}

function WorkspaceColorPicker({ workspaceId, currentColor }: WorkspaceColorPickerProps) {
  const updateWorkspace = useUpdateWorkspace();
  const [selectedColor, setSelectedColor] = useState<string | undefined>(currentColor);
  const [error, setError] = useState<string | null>(null);

  async function handleColorChange(hex: string | null) {
    setError(null);
    setSelectedColor(hex ?? undefined);

    try {
      const updated = await updateWorkspace.mutateAsync({ id: workspaceId, color: hex });
      setSelectedColor(updated.color);
    } catch (err) {
      setSelectedColor(currentColor);
      setError(err instanceof Error ? err.message : "Failed to update workspace color.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Color</CardTitle>
        <CardDescription>Choose a color to identify this workspace in the sidebar.</CardDescription>
      </CardHeader>
      <CardPanel>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            title="No color"
            aria-label="No color"
            aria-pressed={!selectedColor}
            onClick={() => void handleColorChange(null)}
            className="relative flex size-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 bg-transparent transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            disabled={updateWorkspace.isPending}
          >
            {!selectedColor ? (
              <HugeiconsIcon icon={Tick01Icon} size={12} className="text-muted-foreground" />
            ) : null}
          </button>
          {WORKSPACE_COLORS.map((color) => {
            const isSelected = selectedColor?.toLowerCase() === color.hex.toLowerCase();
            return (
              <button
                key={color.hex}
                type="button"
                title={color.label}
                aria-label={color.label}
                aria-pressed={isSelected}
                onClick={() => void handleColorChange(color.hex)}
                className="relative flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                style={{ backgroundColor: color.hex }}
                disabled={updateWorkspace.isPending}
              >
                {isSelected ? (
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    size={14}
                    className="text-white drop-shadow-sm"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        {error ? <p className="mt-2 text-destructive-foreground text-xs">{error}</p> : null}
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
