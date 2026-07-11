"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HistoryEntry } from "@/types";

export function HistoryTable({
  history,
  onClear,
}: {
  history: HistoryEntry[];
  onClear: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Checks</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={history.length === 0}
        >
          Clear History
        </Button>
      </div>

      {history.length === 0 ? (
        <p className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No history yet.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-[hsl(var(--border))] border border-[hsl(var(--border))] text-sm sm:hidden">
            {history.map((entry) => (
              <li key={entry.id} className="space-y-1 p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="min-w-0 break-all font-mono font-semibold [font-variant-numeric:tabular-nums]">
                    {entry.ip}
                  </code>
                  <span className="shrink-0 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                    {entry.ipVersion}
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {new Date(entry.timestamp).toLocaleString()}
                  {entry.location ? ` · ${entry.location}` : ""}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">IP</TableHead>
                  <TableHead scope="col">Version</TableHead>
                  <TableHead scope="col">Time</TableHead>
                  <TableHead scope="col">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono [font-variant-numeric:tabular-nums]">
                      {entry.ip}
                    </TableCell>
                    <TableCell>{entry.ipVersion}</TableCell>
                    <TableCell>
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{entry.location ?? "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
