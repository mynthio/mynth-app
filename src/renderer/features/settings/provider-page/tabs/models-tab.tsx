import { useQuery } from "@tanstack/react-query";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { listProviderModelsQueryOptions } from "@/queries/providers";
import { ProviderModelsTable } from "./models/provider-models-table";

interface ProviderModelsTabProps {
  providerId: string;
}

export function ProviderModelsTab({ providerId }: ProviderModelsTabProps) {
  const modelsQuery = useQuery(listProviderModelsQueryOptions(providerId));
  const models = modelsQuery.data ?? [];

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
    <ProviderModelsTable models={models} />
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
}
