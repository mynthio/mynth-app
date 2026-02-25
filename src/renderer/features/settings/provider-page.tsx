import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listProvidersQueryOptions } from "@/queries/providers";
import { getSupportedProviderById } from "../../../shared/providers/catalog";
import { ProviderConfigTab, ProviderModelsTab } from "./provider-page/tabs";

interface ProviderPageProps {
  providerId: string;
}

export function ProviderPage({ providerId }: ProviderPageProps) {
  const providersQuery = useQuery(listProvidersQueryOptions);
  const provider = providersQuery.data?.find((item) => item.id === providerId);
  const catalogProvider = provider ? getSupportedProviderById(provider.catalogId) : null;

  return (
    <div className="gap-2 flex flex-col h-full w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {provider?.displayName ?? "Provider"}
        </h1>
        <p className="text-muted-foreground">
          {catalogProvider?.name ?? provider?.catalogId ?? "Provider"} ·{" "}
        </p>
      </div>

      <Tabs defaultValue="models" className="h-full">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="h-full overflow-hidden">
          <ProviderModelsTab providerId={providerId} />
        </TabsContent>

        <TabsContent value="config">
          <ProviderConfigTab providerId={providerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
