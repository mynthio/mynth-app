import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useSetProviderModelsEnabled, useUpdateProviderModel } from "@/mutations/models";
import { listProviderModelsQueryOptions } from "@/queries/providers";
import { ProviderModelsTable } from "./models/provider-models-table";

interface ProviderModelsTabProps {
  providerId: string;
}

export function ProviderModelsTab({ providerId }: ProviderModelsTabProps) {
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  const deferredModelSearchQuery = useDeferredValue(modelSearchQuery);
  const modelsQuery = useQuery(listProviderModelsQueryOptions(providerId));
  const updateModelMutation = useUpdateProviderModel();
  const setProviderModelsEnabledMutation = useSetProviderModelsEnabled();
  const models = modelsQuery.data ?? [];
  const normalizedSearchQuery = deferredModelSearchQuery.trim().toLocaleLowerCase();
  const filteredModels = models.filter((model) => {
    if (showEnabledOnly && !model.isEnabled) {
      return false;
    }

    if (normalizedSearchQuery.length === 0) {
      return true;
    }

    const displayName = model.displayName?.trim().toLocaleLowerCase() ?? "";
    const providerModelId = model.providerModelId.toLocaleLowerCase();
    return (
      displayName.includes(normalizedSearchQuery) || providerModelId.includes(normalizedSearchQuery)
    );
  });
  const areAllModelsEnabled = models.length > 0 && models.every((model) => model.isEnabled);
  const areAllModelsDisabled = models.length > 0 && models.every((model) => !model.isEnabled);
  const isBatchMutating = setProviderModelsEnabledMutation.isPending;

  return modelsQuery.isPending ? (
    <div className="px-6 py-5 text-muted-foreground text-sm">Loading models...</div>
  ) : modelsQuery.isError ? (
    <div className="px-6 py-5 text-destructive text-sm">
      Failed to load models: {getErrorMessage(modelsQuery.error)}
    </div>
  ) : models.length === 0 ? (
    <Empty className="px-6 py-10">
      <EmptyHeader>
        <EmptyTitle>No models found</EmptyTitle>
        <EmptyDescription>This provider has no synced models yet.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ) : (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-6 pt-5 pb-3 flex flex-col gap-3">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>
              <HugeiconsIcon icon={Search01Icon} />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={modelSearchQuery}
            placeholder="Search models"
            aria-label="Search provider models"
            onChange={(event) => setModelSearchQuery(event.target.value)}
          />
        </InputGroup>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showEnabledOnly ? "secondary" : "outline"}
            onClick={() => setShowEnabledOnly((current) => !current)}
          >
            Enabled only
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isBatchMutating || updateModelMutation.isPending || areAllModelsEnabled}
            onClick={() => setProviderModelsEnabledMutation.mutate({ providerId, isEnabled: true })}
          >
            Enable all
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isBatchMutating || updateModelMutation.isPending || areAllModelsDisabled}
            onClick={() =>
              setProviderModelsEnabledMutation.mutate({ providerId, isEnabled: false })
            }
          >
            Disable all
          </Button>
          {isBatchMutating ? (
            <span className="text-muted-foreground text-sm">Updating models...</span>
          ) : null}
        </div>
      </div>

      {updateModelMutation.isError ? (
        <div className="px-6 pb-3 text-destructive text-sm">
          Failed to update model: {getErrorMessage(updateModelMutation.error)}
        </div>
      ) : null}

      {setProviderModelsEnabledMutation.isError ? (
        <div className="px-6 pb-3 text-destructive text-sm">
          Failed to update provider models:{" "}
          {getErrorMessage(setProviderModelsEnabledMutation.error)}
        </div>
      ) : null}

      <div className="flex-1 min-h-0 px-6 pb-5">
        {filteredModels.length === 0 ? (
          <Empty className="px-2 py-8">
            <EmptyHeader>
              <EmptyTitle>No matching models</EmptyTitle>
              <EmptyDescription>
                Try a different search term or disable the enabled-only filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ProviderModelsTable
            models={filteredModels}
            areSwitchesDisabled={isBatchMutating || updateModelMutation.isPending}
            onModelEnabledChange={(modelId, isEnabled) => {
              updateModelMutation.mutate({
                providerId,
                modelId,
                input: { isEnabled },
              });
            }}
          />
        )}
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
}
