import { Hourglass, Wrench, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FILA_STATUS_LABEL, type FilaStatus } from "@/lib/types";

const CONFIG: Record<
  FilaStatus,
  { variant: "info" | "warning" | "success"; Icon: typeof Hourglass }
> = {
  na_fila: { variant: "info", Icon: Hourglass },
  em_manutencao: { variant: "warning", Icon: Wrench },
  pronto: { variant: "success", Icon: CheckCircle2 },
};

export function FilaStatusBadge({ status }: { status: FilaStatus }) {
  const { variant, Icon } = CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon className="size-3" />
      {FILA_STATUS_LABEL[status]}
    </Badge>
  );
}
