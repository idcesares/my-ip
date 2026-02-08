"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { HistoryEntry } from "@/types";

export function HistoryTable({ history, onClear }: { history: HistoryEntry[]; onClear: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Checks</h3>
        <Button variant="outline" size="sm" onClick={onClear} disabled={history.length === 0}>
          Clear History
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IP</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-[hsl(var(--muted-foreground))]">
                No history yet.
              </TableCell>
            </TableRow>
          ) : (
            history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-mono">{entry.ip}</TableCell>
                <TableCell>{entry.ipVersion}</TableCell>
                <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                <TableCell>{entry.location ?? "N/A"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}