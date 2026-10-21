"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListAuditLogQuery } from "@/features/api/adminApi";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { useState } from "react";

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key}: ${String(entry)}`)
      .join(", ");
  }
  return String(value);
}

export default function AuditLogPage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const { data, isLoading } = useListAuditLogQuery(cursor);
  const rows = data?.page ?? [];

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every privileged action an admin took, newest first."
      />

      <div className="px-5 py-6 md:px-8">
        <div className="overflow-hidden rounded-2xl border border-glass-border">
          <Table>
            <TableHeader>
              <TableRow className="border-glass-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Action</TableHead>
                <TableHead className="text-muted-foreground">Admin</TableHead>
                <TableHead className="text-muted-foreground">Change</TableHead>
                <TableHead className="text-muted-foreground">Note</TableHead>
                <TableHead className="text-muted-foreground">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                !data &&
                [0, 1, 2, 3].map((key) => (
                  <TableRow key={key} className="border-glass-border">
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {rows.map((entry) => (
                <TableRow key={entry.id} className="border-glass-border/60 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{entry.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.admin_email ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                    <span className="block truncate">
                      {entry.before !== undefined && entry.before !== null
                        ? formatValue(entry.before)
                        : "—"}
                    </span>
                    {entry.after !== undefined && entry.after !== null && (
                      <span className="block truncate text-emerald-400/80">
                        → {formatValue(entry.after)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                    {entry.note ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

              {!isLoading && !rows.length && (
                <TableRow className="border-glass-border">
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    <ScrollText className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    No admin actions recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {data?.isDone ? "End of log" : "More entries available"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => {
                setPage((current) => Math.max(0, current - 1));
                setCursor(undefined);
              }}
              className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
              First
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={data?.isDone ?? true}
              onClick={() => {
                setPage((current) => current + 1);
                setCursor(data?.continueCursor || undefined);
              }}
              className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
