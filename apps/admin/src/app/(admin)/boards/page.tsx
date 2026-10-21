"use client";

import {
  publicBoardProviderById,
  relativeTime,
  PUBLIC_BOARD_PROVIDERS,
  type AtsPublicBoard,
  type PublicBoardProviderId,
} from "@/components/ats/catalog";
import { publicBoardCompaniesFor } from "@/components/ats/boardCatalog";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddPublicBoardMutation,
  useGetSyncControlQuery,
  useListPublicBoardsQuery,
  useRemovePublicBoardMutation,
  useRetryPublicBoardMutation,
  useSetSyncEnabledMutation,
} from "@/features/api/adminApi";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function StatusBadge({ board }: { board: AtsPublicBoard }) {
  if (board.sync_started_at) {
    return (
      <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-400 uppercase">
        Syncing
      </span>
    );
  }
  if (board.status === "connected") {
    return (
      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-400 uppercase">
        Live
      </span>
    );
  }
  if (board.status === "error") {
    return (
      <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-rose-400 uppercase">
        Error
      </span>
    );
  }
  return (
    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/50 uppercase">
      {board.status}
    </span>
  );
}

function boardFooter(board: AtsPublicBoard) {
  if (board.sync_started_at) return "Sync in progress…";
  if (board.status === "error") {
    const message = board.error_message ?? "Sync failed";
    if (message.includes("changed while this mutation")) {
      return "Sync hit a write conflict. Retry to pull this board again.";
    }
    return message;
  }
  return `${board.records_synced.toLocaleString()} jobs · Last synced ${relativeTime(board.last_synced_at)}`;
}

export default function BoardsPage() {
  const { data, isLoading } = useListPublicBoardsQuery();
  const { data: syncControl } = useGetSyncControlQuery();
  const [setSyncEnabled, { isLoading: isTogglingSync }] = useSetSyncEnabledMutation();
  const [retryBoard] = useRetryPublicBoardMutation();
  const [removeBoard] = useRemovePublicBoardMutation();
  const [addBoard, { isLoading: isAdding }] = useAddPublicBoardMutation();

  const boards = (data as AtsPublicBoard[] | undefined) ?? [];
  const syncEnabled = syncControl?.enabled ?? true;
  const syncLocked = Boolean(syncControl?.locked);

  const [providerId, setProviderId] = useState<PublicBoardProviderId>("greenhouse");
  const [subdomain, setSubdomain] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const provider = publicBoardProviderById(providerId);

  // Company suggestions are scoped to the selected ATS: a board token only
  // means something against one provider's API.
  //
  // Boards already ingested for this ATS are dropped from the picker. Public
  // boards are keyed on (provider, slug) and the backend rejects a repeat, so
  // offering an existing one would only earn the admin an error to dismiss.
  // A matching slug under a *different* ATS is a different board and stays.
  const existingSlugs = new Set(
    boards
      .filter((board) => board.provider === providerId)
      .map((board) => (board.subdomain ?? "").trim().toLowerCase())
      .filter(Boolean),
  );
  const companyOptions = publicBoardCompaniesFor(providerId).filter(
    (row) => !existingSlugs.has(row.slug.toLowerCase()),
  );
  const indiaCompanies = companyOptions.filter((row) => row.region === "india");
  const globalCompanies = companyOptions.filter((row) => row.region === "global");

  const typedSlug = subdomain.trim();
  const typedSlugIsDuplicate = existingSlugs.has(typedSlug.toLowerCase());
  // Drop the selection if its board got added elsewhere while this form was open.
  const selectedCompanySlug = existingSlugs.has(selectedSlug) ? "" : selectedSlug;

  const handleProviderChange = (next: PublicBoardProviderId) => {
    if (next === providerId) return;
    setProviderId(next);
    // A company picked from the previous ATS's list must not be submitted
    // against the newly selected ATS. A manually typed slug stays put.
    if (selectedSlug) setSubdomain("");
    setSelectedSlug("");
  };

  const handleCompanyChange = (slug: string) => {
    setSelectedSlug(slug);
    setSubdomain(slug);
  };

  const handleSlugChange = (value: string) => {
    setSubdomain(value);
    // Editing the slug by hand puts the admin back in manual-entry mode.
    if (value !== selectedSlug) setSelectedSlug("");
  };

  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!typedSlug || typedSlugIsDuplicate) return;
    try {
      await addBoard({ provider: providerId, subdomain: typedSlug }).unwrap();
      setSubdomain("");
      setSelectedSlug("");
      toast.success("Board added. The first pull is starting.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add that board.",
      );
    }
  };

  const handleResync = async (board: AtsPublicBoard) => {
    setRetryingId(board.id);
    try {
      await retryBoard(board.id).unwrap();
      toast.success(`Resyncing ${board.subdomain ?? "this board"}…`);
    } catch {
      toast.error("Could not start a resync.");
    } finally {
      setRetryingId(null);
    }
  };

  const handleRemove = async (board: AtsPublicBoard) => {
    if (
      !window.confirm(
        `Remove the ${publicBoardProviderById(board.provider).name} board “${board.subdomain ?? board.id}”? Its live listings will be closed.`,
      )
    ) {
      return;
    }
    setRemovingId(board.id);
    try {
      await removeBoard(board.id).unwrap();
      toast.success("Board removed. Its listings are now closed.");
    } catch {
      toast.error("Could not remove that board.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    try {
      await setSyncEnabled(enabled).unwrap();
      toast.success(enabled ? "Board sync enabled." : "Board sync paused.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update sync. Check ATS_SYNC_ENABLED if this deployment is locked.",
      );
    }
  };

  return (
    <>
      <PageHeader
        title="Public job boards"
        description="Ingest published jobs from company career sites into the global feed. Boards re-sync weekly."
        actions={
          <div className="flex items-center gap-3 rounded-full border border-glass-border px-4 py-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-white uppercase">
                {syncEnabled ? "Sync on" : "Sync paused"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {syncLocked ? "Locked by ATS_SYNC_ENABLED" : "This deployment"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={syncEnabled}
              aria-label={syncEnabled ? "Pause board sync" : "Enable board sync"}
              disabled={syncLocked || isTogglingSync}
              onClick={() => void handleToggleSync(!syncEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                syncEnabled ? "bg-neon-cyan" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  syncEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        }
      />

      <div className="px-5 py-6 md:px-8">
        <section className="rounded-2xl border border-glass-border glass p-5">
          <h2 className="text-sm font-semibold">Add a public board</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Add as many Greenhouse, Lever, or Ashby boards as you need.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="board-ats">ATS</Label>
              <select
                id="board-ats"
                value={providerId}
                onChange={(event) =>
                  handleProviderChange(event.target.value as PublicBoardProviderId)
                }
                disabled={isAdding}
                className="h-9 w-full rounded-md border border-glass-border bg-[#12121a] px-3 text-sm text-white outline-none focus-visible:border-ring"
              >
                {PUBLIC_BOARD_PROVIDERS.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-company">Company</Label>
              <select
                id="board-company"
                value={selectedCompanySlug}
                onChange={(event) => handleCompanyChange(event.target.value)}
                disabled={isAdding}
                className="h-9 w-full rounded-md border border-glass-border bg-[#12121a] px-3 text-sm text-white outline-none focus-visible:border-ring"
              >
                <option value="">Enter a slug manually…</option>
                {indiaCompanies.length > 0 && (
                  <optgroup label="India">
                    {indiaCompanies.map((row) => (
                      <option key={row.slug} value={row.slug}>
                        {row.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                {globalCompanies.length > 0 && (
                  <optgroup label="Global">
                    {globalCompanies.map((row) => (
                      <option key={row.slug} value={row.slug}>
                        {row.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-slug">
                {provider.boardLabel ?? "Board slug"}{" "}
                <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="board-slug"
                value={subdomain}
                onChange={(event) => handleSlugChange(event.target.value)}
                placeholder={provider.boardPlaceholder}
                autoComplete="off"
                disabled={isAdding}
              />
            </div>
          </div>

          {typedSlugIsDuplicate ? (
            <p className="mt-3 text-xs text-amber-400">
              {provider.name} already ingests “{typedSlug}” — use Resync below instead of
              adding it again.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              {companyOptions.length > 0
                ? `${companyOptions.length} popular ${provider.name} boards are listed — pick one to fill the slug, or type any board slug you already know.`
                : `Type the ${provider.name} board slug you want to ingest.`}
            </p>
          )}

          {provider.credentialsHelp && (
            <p className="mt-3 text-xs text-neon-cyan">{provider.credentialsHelp}</p>
          )}

          <Button
            onClick={() => void handleAdd()}
            disabled={!typedSlug || typedSlugIsDuplicate || isAdding}
            className="mt-4 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90"
          >
            {isAdding ? "Adding…" : "Add board"}
          </Button>
        </section>

        <div className="mt-6 space-y-3">
          {isLoading &&
            [0, 1].map((key) => <Skeleton key={key} className="h-20 rounded-2xl" />)}

          {!isLoading && boards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-glass-border px-5 py-8 text-center text-sm text-muted-foreground">
              No public boards yet. Add a slug to start pulling live jobs.
            </div>
          )}

          {boards.map((board) => {
            const boardProvider = publicBoardProviderById(board.provider);
            return (
              <div
                key={board.id}
                className="flex flex-col gap-3 rounded-2xl border border-glass-border glass px-5 py-4 sm:flex-row sm:items-center"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${boardProvider.tileClass}`}
                >
                  {boardProvider.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{boardProvider.name}</p>
                    <span className="truncate text-sm text-muted-foreground">
                      {board.subdomain}
                    </span>
                    <StatusBadge board={board} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{boardFooter(board)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {(board.status === "connected" || board.status === "error") && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Boolean(board.sync_started_at) || retryingId === board.id}
                      onClick={() => void handleResync(board)}
                      className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
                    >
                      {board.sync_started_at || retryingId === board.id
                        ? board.status === "error"
                          ? "Retrying…"
                          : "Syncing…"
                        : board.status === "error"
                          ? "Retry"
                          : "Resync"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={removingId === board.id}
                    onClick={() => void handleRemove(board)}
                    className="rounded-full border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {removingId === board.id ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
