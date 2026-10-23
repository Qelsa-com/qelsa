"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListUsersQuery } from "@/features/api/adminApi";
import { ChevronLeft, ChevronRight, Crown, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoleFilter = "all" | "user" | "admin";
type AccountFilter = "all" | "seeker" | "recruiter";
type StatusFilter = "all" | "active" | "suspended";

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${tone}`}
    >
      {children}
    </span>
  );
}

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [accountType, setAccountType] = useState<AccountFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);

  // Debounce the search so typing does not fire a query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCursor(undefined);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      role: role === "all" ? undefined : role,
      accountType: accountType === "all" ? undefined : accountType,
      isActive: status === "all" ? undefined : status === "active",
    }),
    [search, role, accountType, status],
  );

  const { data, isLoading } = useListUsersQuery(filters, cursor);
  const rows = data?.page ?? [];

  const resetPaging = () => {
    setCursor(undefined);
    setPage(0);
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Search accounts, review details, and manage access."
      />

      <div className="px-5 py-6 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, email, or username"
              className="pl-9"
              aria-label="Search users"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as RoleFilter);
                resetPaging();
              }}
              aria-label="Filter by role"
              className="h-9 rounded-md border border-glass-border bg-[#12121a] px-3 text-sm text-white outline-none focus-visible:border-ring"
            >
              <option value="all">All roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={accountType}
              onChange={(event) => {
                setAccountType(event.target.value as AccountFilter);
                resetPaging();
              }}
              aria-label="Filter by account type"
              className="h-9 rounded-md border border-glass-border bg-[#12121a] px-3 text-sm text-white outline-none focus-visible:border-ring"
            >
              <option value="all">All types</option>
              <option value="seeker">Candidates</option>
              <option value="recruiter">Recruiters</option>
            </select>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                resetPaging();
              }}
              aria-label="Filter by status"
              className="h-9 rounded-md border border-glass-border bg-[#12121a] px-3 text-sm text-white outline-none focus-visible:border-ring"
            >
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-glass-border">
          <Table>
            <TableHeader>
              <TableRow className="border-glass-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Premium</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-right text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                !data &&
                [0, 1, 2, 3, 4].map((key) => (
                  <TableRow key={key} className="border-glass-border">
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {rows.map((user) => (
                <TableRow key={user.id} className="border-glass-border/60 hover:bg-white/5">
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {user.name ?? "Unnamed"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge tone="bg-neon-purple/20 text-neon-purple">Admin</Badge>
                    ) : (
                      <Badge tone="bg-white/10 text-white/70">User</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.account_type ?? "—"}
                  </TableCell>
                  <TableCell>
                    {user.premium_plan === "pro" ? (
                      <Badge tone="bg-amber-400/15 text-amber-300">
                        <Crown className="h-3 w-3" />
                        Pro
                      </Badge>
                    ) : user.premium_plan === "plus" ? (
                      <Badge tone="bg-neon-cyan/15 text-neon-cyan">
                        <Sparkles className="h-3 w-3" />
                        Plus
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Free</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge tone="bg-emerald-500/15 text-emerald-400">Active</Badge>
                    ) : (
                      <Badge tone="bg-amber-500/15 text-amber-400">Suspended</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/users/${user.id}`}
                      className="inline-flex items-center rounded-full border border-glass-border px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/5"
                    >
                      Manage
                    </Link>
                  </TableCell>
                </TableRow>
              ))}

              {!isLoading && !rows.length && (
                <TableRow className="border-glass-border">
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No users match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {data?.isDone ? "End of results" : "More results available"}
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
