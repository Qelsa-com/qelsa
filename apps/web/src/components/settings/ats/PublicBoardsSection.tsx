"use client";

import { useAddPublicBoardMutation, useListPublicBoardsQuery, useRemovePublicBoardMutation } from "@/features/api/atsIntegrationsApi";
import { useWipeAllJobsMutation } from "@/features/api/jobsApi";
import { toastUnknownError } from "@/lib/errors";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { PUBLIC_BOARD_PROVIDERS, publicBoardProviderById, relativeTime, type AtsPublicBoard, type PublicBoardProviderId } from "./catalog";

const gradientButton = "rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-5 text-white hover:opacity-90";
const outlineButton = "rounded-full border-glass-border bg-transparent px-5 text-white hover:bg-white/5";

function StatusBadge({ board }: { board: AtsPublicBoard }) {
  if (board.status === "connected") return <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-400 uppercase">Live</span>;
  if (board.status === "error") return <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-rose-400 uppercase">Error</span>;
  return <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/50 uppercase">{board.status}</span>;
}

function AddPublicBoardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [addBoard, { isLoading }] = useAddPublicBoardMutation();
  const [providerId, setProviderId] = useState<PublicBoardProviderId>("greenhouse");
  const [subdomain, setSubdomain] = useState("");
  const provider = publicBoardProviderById(providerId);

  const handleAdd = async () => {
    try {
      await addBoard({ provider: providerId, subdomain: subdomain.trim() }).unwrap();
      setSubdomain("");
      onOpenChange(false);
    } catch (err) {
      toastUnknownError(err, "Could not add that board. Check the slug and try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-glass-border gap-0 p-0 sm:max-w-md sm:rounded-2xl">
        <DialogHeader className="border-b border-glass-border px-6 py-5">
          <DialogTitle>Add public board</DialogTitle>
          <DialogDescription className="sr-only">Add a public ATS job board to the global feed</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="public-board-ats">ATS</Label>
            <select
              id="public-board-ats"
              value={providerId}
              onChange={(event) => setProviderId(event.target.value as PublicBoardProviderId)}
              disabled={isLoading}
              className="border-input flex h-9 w-full rounded-md border bg-input-background px-3 text-sm text-white outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {PUBLIC_BOARD_PROVIDERS.map((row) => (
                <option key={row.id} value={row.id} className="bg-[#12121a] text-white">
                  {row.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="public-board-slug">
              {provider.boardLabel ?? "Board slug"} <span className="text-rose-400">*</span>
            </Label>
            <Input id="public-board-slug" value={subdomain} onChange={(event) => setSubdomain(event.target.value)} placeholder={provider.boardPlaceholder} autoComplete="off" disabled={isLoading} />
          </div>
          {provider.credentialsHelp && <p className="text-xs text-neon-cyan">{provider.credentialsHelp}</p>}
        </div>
        <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-glass-border px-6 py-4">
          <Button variant="outline" className={outlineButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button className={gradientButton} disabled={!subdomain.trim() || isLoading} onClick={() => void handleAdd()}>
            {isLoading ? "Adding…" : "Add board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemovePublicBoardDialog({ board, open, onOpenChange }: { board: AtsPublicBoard; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [removeBoard, { isLoading }] = useRemovePublicBoardMutation();
  const provider = publicBoardProviderById(board.provider);

  const handleRemove = async () => {
    try {
      await removeBoard(board.id).unwrap();
      onOpenChange(false);
    } catch (err) {
      toastUnknownError(err, "Could not remove this board. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-glass-border gap-0 p-0 sm:max-w-md sm:rounded-2xl">
        <DialogHeader className="border-b border-glass-border px-6 py-5">
          <DialogTitle>Remove public board</DialogTitle>
          <DialogDescription className="sr-only">Remove {provider.name} {board.subdomain}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 py-5 text-sm text-muted-foreground">
          <p>
            Stop ingesting <span className="text-white">{provider.name}</span> board <span className="text-white">{board.subdomain}</span>. Listings from this board will be marked closed.
          </p>
          {board.error_message && <p className="text-rose-400">{board.error_message}</p>}
        </div>
        <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-glass-border px-6 py-4">
          <Button variant="outline" className={outlineButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" className="rounded-full px-5" disabled={isLoading} onClick={() => void handleRemove()}>
            {isLoading ? "Removing…" : "Remove board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PublicBoardsSection() {
  const { data, isLoading } = useListPublicBoardsQuery();
  const boards = (data as AtsPublicBoard[] | undefined) ?? [];
  const [addOpen, setAddOpen] = useState(false);
  const [removeBoard, setRemoveBoard] = useState<AtsPublicBoard | null>(null);

  return (
    <section className="mt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-neon-cyan uppercase">Admin</p>
          <h2 className="mt-1 text-2xl font-bold">Add public boards</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Ingest published jobs from company career sites into the global feed. Add as many Greenhouse, Lever, or Ashby boards as you need.</p>
        </div>
        <Button className={gradientButton} onClick={() => setAddOpen(true)}>
          Add board
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading &&
          [0, 1].map((key) => <div key={key} className="h-[76px] animate-pulse rounded-2xl border border-glass-border bg-white/5" />)}

        {!isLoading && boards.length === 0 && (
          <div className="rounded-2xl border border-dashed border-glass-border px-5 py-8 text-center text-sm text-muted-foreground">No public boards yet. Add a slug to start pulling live jobs.</div>
        )}

        {boards.map((board) => {
          const provider = publicBoardProviderById(board.provider);
          return (
            <div key={board.id} className="flex items-center gap-4 rounded-2xl border border-glass-border glass px-5 py-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${provider.tileClass}`}>{provider.initials}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{provider.name}</p>
                  <span className="truncate text-sm text-muted-foreground">{board.subdomain}</span>
                  <StatusBadge board={board} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {board.status === "error" ? (board.error_message ?? "Sync failed") : `${board.records_synced.toLocaleString()} jobs · Last synced ${relativeTime(board.last_synced_at)}`}
                </p>
              </div>
              <Button variant="outline" size="sm" className={outlineButton} onClick={() => setRemoveBoard(board)}>
                Remove
              </Button>
            </div>
          );
        })}
      </div>

      <AddPublicBoardDialog open={addOpen} onOpenChange={setAddOpen} />
      {removeBoard && <RemovePublicBoardDialog board={removeBoard} open onOpenChange={(open) => !open && setRemoveBoard(null)} />}
      <DeleteAllJobsPanel />
    </section>
  );
}

function DeleteAllJobsPanel() {
  const [wipeAll, { isLoading }] = useWipeAllJobsMutation();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  const handleWipe = async () => {
    try {
      const result = (await wipeAll().unwrap()) as { started: boolean };
      setOpen(false);
      setConfirm("");
      if (result.started) toast.success("Deleting seeded and ingested jobs in the background. Jobs posted by users are kept.");
      else toast.info("There are no seeded or ingested jobs to delete.");
    } catch (err) {
      toastUnknownError(err, "Could not start the job wipe. Please try again.");
    }
  };

  return (
    <div className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/5 px-5 py-5">
      <p className="text-sm font-semibold text-destructive">Danger zone</p>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Permanently delete seeded, scraped, and admin ATS board jobs, plus their applications and saved rows. Jobs posted by users on Qelsa are not touched.</p>
      <Button variant="outline" className="mt-4 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}>
        Delete all jobs
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setConfirm("");
        }}
      >
        <DialogContent className="glass-strong border-glass-border gap-0 p-0 sm:max-w-md sm:rounded-2xl">
          <DialogHeader className="border-b border-glass-border px-6 py-5">
            <DialogTitle>Delete ingested jobs</DialogTitle>
            <DialogDescription className="sr-only">Confirm deleting seeded and ingested jobs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-muted-foreground">Removes seed, scrape, and public-board listings only. User-posted jobs stay. Type <span className="font-semibold text-white">DELETE</span> to confirm.</p>
            <Input value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="DELETE" autoComplete="off" disabled={isLoading} />
          </div>
          <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-glass-border px-6 py-4">
            <Button variant="outline" className={outlineButton} onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-full px-5" disabled={confirm !== "DELETE" || isLoading} onClick={() => void handleWipe()}>
              {isLoading ? "Starting…" : "Delete all jobs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
