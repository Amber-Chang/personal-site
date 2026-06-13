import { Badge } from "../ui/badge.tsx";
import { cn } from "../../lib/utils.ts";
import type { ContentStatus } from "../../lib/content/types.ts";

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "未上架",
  published: "已上架",
};

const STATUS_STYLES: Record<ContentStatus, string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function ContentStatusBadge(input: {
  className?: string;
  status: ContentStatus;
}) {
  return (
    <Badge className={cn("border px-3 py-1 text-xs font-medium tracking-[0.08em]", STATUS_STYLES[input.status], input.className)} variant="outline">
      {STATUS_LABELS[input.status]}
    </Badge>
  );
}

export function getContentStatusLabel(status: ContentStatus) {
  return STATUS_LABELS[status];
}
