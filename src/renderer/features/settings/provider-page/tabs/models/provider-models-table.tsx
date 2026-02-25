import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ProviderModelInfo } from "../../../../../../shared/ipc";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ProviderModelsTableProps {
  models: ProviderModelInfo[];
  areSwitchesDisabled?: boolean;
  onModelEnabledChange?: (modelId: string, isEnabled: boolean) => void;
}

const MODEL_ROW_HEIGHT_PX = 44;

export function ProviderModelsTable({
  models,
  areSwitchesDisabled = false,
  onModelEnabledChange,
}: ProviderModelsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: models.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => MODEL_ROW_HEIGHT_PX,
    overscan: 5,
    gap: 5,
  });

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto scrollbar w-full">
      <div
        className="w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const model = models[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${MODEL_ROW_HEIGHT_PX}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex items-center justify-between overflow-hidden bg-accent/50 px-4 rounded-md"
            >
              <div className="flex items-center justify-start gap-4">
                <Label>
                  <Switch
                    checked={model.isEnabled}
                    disabled={areSwitchesDisabled}
                    aria-label={`Toggle model ${model.displayName?.trim() || model.providerModelId}`}
                    onCheckedChange={(isChecked) => onModelEnabledChange?.(model.id, isChecked)}
                  />
                </Label>
                <span className="block truncate">
                  {model.displayName?.trim() || model.providerModelId}
                </span>
              </div>

              <Badge variant="outline">{formatModelStatus(model.status)}</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatModelStatus(status: ProviderModelInfo["status"]): string {
  switch (status) {
    case "active":
      return "Active";
    case "deprecated":
      return "Deprecated";
    case "removed":
      return "Removed";
  }
}
