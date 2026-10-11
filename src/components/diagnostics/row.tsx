import { CircleHelp, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PanelHeading({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 border-b border-[hsl(var(--border))] pb-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[hsl(var(--foreground))]">
      <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
      {children}
    </h3>
  );
}

export function Row({
  k,
  v,
  tip,
}: {
  k: string;
  v: string | number | null;
  tip?: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-start gap-3 py-1 text-sm">
      <span className="inline-flex min-w-0 items-center gap-0.5 text-[hsl(var(--muted-foreground))]">
        {k}
        {tip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${k} info`}
                className="-my-2 h-11 w-11 shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 leading-relaxed">
              {tip}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </span>
      <span className="min-w-0 break-words text-right font-mono text-[13px] font-semibold leading-snug [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]">
        {v ?? "Unavailable"}
      </span>
    </div>
  );
}
