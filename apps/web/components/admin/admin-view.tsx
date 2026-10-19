"use client";

import {
  BadgeCheck,
  Ban,
  ChevronDown,
  KeyRound,
  Loader2,
  LogOut,
  MessagesSquare,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { powerStore, usePower } from "@/components/power/power-store";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  role: string;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  providers: string[];
  hasKey: boolean;
  powered: boolean;
  mainModel: string | null;
  voiceModel: string | null;
  chats: number;
  lastActive: string | null;
  sessions: number;
}

interface Overview {
  stats: { total: number; verified: number; banned: number; admins: number; newThisWeek: number; keys: number; powered: number; conversations: number };
  signups: { day: string; count: number }[];
  users: AdminUser[];
}

type Filter = "all" | "unverified" | "power" | "banned" | "admins";
const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["power", "Power users"],
  ["unverified", "Unverified"],
  ["banned", "Banned"],
  ["admins", "Admins"],
];

const ago = (iso: string | null) => {
  if (!iso) return "Never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days} d ago` : new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
};

function Stat({ icon: Icon, label, value, note, i }: { icon: typeof Users; label: string; value: number; note?: string; i: number }) {
  return (
    <div data-intro style={{ "--d": i * 0.5 } as React.CSSProperties} className="admin-stat relative overflow-hidden rounded-3xl border bg-card p-5">
      <span className="grid size-9 place-items-center rounded-xl bg-brand/12 text-brand-text">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="mt-4 font-display text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {note && <p className="mt-1 text-xs text-subtle-foreground">{note}</p>}
    </div>
  );
}

/** New accounts per day for the last 14 days, as bars that grow in. */
function Signups({ days }: { days: Overview["signups"] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">New accounts</h2>
        <p className="text-xs text-muted-foreground">last 14 days</p>
      </div>
      <div className="mt-5 flex h-36 items-end gap-1.5" role="img" aria-label={`Sign-ups per day: ${days.map((d) => `${d.day} ${d.count}`).join(", ")}`}>
        {days.map((d, i) => (
          <div key={d.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{d.count}</span>
            <span
              className="admin-bar w-full rounded-t-md"
              data-zero={d.count === 0 || undefined}
              style={{ height: `${Math.max(4, (d.count / max) * 100)}%`, "--i": i } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-subtle-foreground">
        <span>{new Date(days[0]?.day).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "good" | "warn" | "bad" | "brand" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "good" && "bg-success/12 text-success",
        tone === "warn" && "bg-abi-soft text-abi-text",
        tone === "bad" && "bg-destructive/12 text-destructive",
        tone === "brand" && "bg-brand/12 text-brand-text",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/** The expanded row: everything an admin can do to one account. */
function Manage({ u, self, onDone }: { u: AdminUser; self: boolean; onDone: (msg: string) => void }) {
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState<"" | "ban" | "delete">("");
  const [reason, setReason] = useState("");

  async function run(name: string, fn: () => Promise<{ error?: { message?: string } | null } | Response>, msg: string) {
    setBusy(name);
    const res = await fn().catch(() => ({ error: { message: "Request failed." } }));
    setBusy("");
    setConfirm("");
    const failed = res instanceof Response ? !res.ok : res.error;
    onDone(failed ? (res instanceof Response ? "That didn't work." : (res.error?.message ?? "That didn't work.")) : msg);
  }

  const btn = "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors hover:border-brand/50 disabled:pointer-events-none disabled:opacity-50";
  return (
    <div className="admin-manage grid gap-4 border-t bg-background/40 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">User id</dt>
          <dd className="truncate font-mono text-xs">{u.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Signs in with</dt>
          <dd>{u.providers.map((p) => (p === "credential" ? "Email" : p[0].toUpperCase() + p.slice(1))).join(", ") || "Nothing yet"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Active sessions</dt>
          <dd className="tabular-nums">{u.sessions}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Main model</dt>
          <dd className="font-mono text-xs">{u.hasKey ? (u.mainModel ?? "default") : "No key"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Voice model</dt>
          <dd className="font-mono text-xs">{u.hasKey ? (u.voiceModel ?? "default") : "No key"}</dd>
        </div>
        {u.banned && (
          <div>
            <dt className="text-xs text-muted-foreground">Ban reason</dt>
            <dd>{u.banReason || "None given"}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap content-start gap-2 sm:max-w-md sm:justify-end">
        {self && <p className="w-full text-xs text-muted-foreground sm:text-right">This is you, so ban, delete and role changes are off.</p>}
        <button
          type="button"
          disabled={self || Boolean(busy)}
          className={btn}
          onClick={() =>
            run("role", () => authClient.admin.setRole({ userId: u.id, role: u.role === "admin" ? "user" : "admin" }), u.role === "admin" ? `${u.email} is no longer an admin.` : `${u.email} is now an admin.`)
          }
        >
          {busy === "role" ? <Loader2 className="size-3.5 animate-spin" /> : u.role === "admin" ? <ShieldOff className="size-3.5" /> : <Shield className="size-3.5" />}
          {u.role === "admin" ? "Remove admin" : "Make admin"}
        </button>
        <button type="button" disabled={Boolean(busy) || u.sessions === 0} className={btn} onClick={() => run("out", () => authClient.admin.revokeUserSessions({ userId: u.id }), `Signed ${u.email} out everywhere.`)}>
          {busy === "out" ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />} Sign out everywhere
        </button>
        {u.hasKey && (
          <button type="button" disabled={Boolean(busy)} className={btn} onClick={() => run("key", () => fetch(`/api/admin/users/${u.id}/key`, { method: "DELETE" }), `Removed ${u.email}'s OpenAI key.`)}>
            {busy === "key" ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />} Remove OpenAI key
          </button>
        )}
        {u.banned ? (
          <button type="button" disabled={self || Boolean(busy)} className={btn} onClick={() => run("ban", () => authClient.admin.unbanUser({ userId: u.id }), `Unbanned ${u.email}.`)}>
            {busy === "ban" ? <Loader2 className="size-3.5 animate-spin" /> : <BadgeCheck className="size-3.5" />} Unban
          </button>
        ) : (
          <button type="button" disabled={self || Boolean(busy)} className={cn(btn, "text-abi-text")} onClick={() => setConfirm("ban")}>
            <Ban className="size-3.5" /> Ban
          </button>
        )}
        <button type="button" disabled={self || Boolean(busy)} className={cn(btn, "border-destructive/40 text-destructive hover:border-destructive")} onClick={() => setConfirm("delete")}>
          <Trash2 className="size-3.5" /> Delete
        </button>

        {confirm === "ban" && (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl bg-abi-soft/70 p-3 text-sm">
            <label htmlFor={`reason-${u.id}`} className="sr-only">
              Reason
            </label>
            <input id={`reason-${u.id}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="lab-input h-9 min-w-0 flex-1 text-sm" />
            <button type="button" className="h-9 rounded-full bg-abi px-4 font-semibold text-background" onClick={() => run("ban", () => authClient.admin.banUser({ userId: u.id, banReason: reason || undefined }), `Banned ${u.email} and signed them out.`)}>
              {busy === "ban" ? <Loader2 className="size-4 animate-spin" /> : "Ban"}
            </button>
            <button type="button" className="h-9 rounded-full border bg-card px-3 font-semibold" onClick={() => setConfirm("")}>
              Cancel
            </button>
          </div>
        )}
        {confirm === "delete" && (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl bg-destructive/10 p-3 text-sm">
            <span className="flex-1">Delete {u.email} with their key and conversations? This can&apos;t be undone.</span>
            <button type="button" className="h-9 rounded-full bg-destructive px-4 font-semibold text-white" onClick={() => run("delete", () => authClient.admin.removeUser({ userId: u.id }), `Deleted ${u.email}.`)}>
              {busy === "delete" ? <Loader2 className="size-4 animate-spin" /> : "Delete for good"}
            </button>
            <button type="button" className="h-9 rounded-full border bg-card px-3 font-semibold" onClick={() => setConfirm("")}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** The admin dashboard: account numbers, sign-ups, and every user with actions. */
export function AdminView() {
  const me = usePower((s) => s.user);
  const ready = usePower((s) => s.ready);
  const [checked, setChecked] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/overview", { cache: "no-store" }).catch(() => null);
    setLoading(false);
    if (!res?.ok) return setError(res?.status === 403 ? "forbidden" : "Couldn't load the dashboard.");
    setError("");
    setData(await res.json());
  }, []);

  useEffect(() => {
    void powerStore.load(true).then(() => setChecked(true));
  }, []);
  useEffect(() => {
    // Loading data once the session is known is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (checked && me?.role === "admin") void load();
  }, [checked, me, load]);

  const users = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.users ?? []).filter((u) => {
      if (needle && !`${u.name} ${u.email}`.toLowerCase().includes(needle)) return false;
      if (filter === "unverified") return !u.verified;
      if (filter === "power") return u.hasKey;
      if (filter === "banned") return u.banned;
      if (filter === "admins") return u.role === "admin";
      return true;
    });
  }, [data, q, filter]);

  if (!checked || !ready)
    return (
      <p className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Checking access...
      </p>
    );

  if (!me || me.role !== "admin" || error === "forbidden")
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
          <Shield className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Admins only.</h1>
        <p className="mt-2 text-muted-foreground">{me ? "Your account doesn't have admin access." : "Sign in with an admin account to continue."}</p>
        {!me && (
          <Link href="/signin" className="send group relative mt-6 inline-flex h-11 items-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold">
            <span className="relative">Sign in</span>
          </Link>
        )}
      </div>
    );

  const s = data?.stats;
  return (
    <div className="space-y-6">
      <div data-intro className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-text">Admin</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Control room.</h1>
          <p className="mt-1 text-muted-foreground">Everyone with an account, and what they&apos;re running.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors hover:bg-muted">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden /> Refresh
        </button>
      </div>

      {error && <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat i={0} icon={Users} label="Accounts" value={s.total} note={`${s.admins} admin${s.admins === 1 ? "" : "s"}`} />
            <Stat i={1} icon={BadgeCheck} label="Verified" value={s.verified} note={`${s.total - s.verified} waiting`} />
            <Stat i={2} icon={KeyRound} label="With OpenAI key" value={s.keys} />
            <Stat i={3} icon={Zap} label="Power on" value={s.powered} />
            <Stat i={4} icon={MessagesSquare} label="Saved chats" value={s.conversations} />
            <Stat i={5} icon={UserPlus} label="New this week" value={s.newThisWeek} note={s.banned ? `${s.banned} banned` : undefined} />
          </div>
          <Signups days={data!.signups} />
        </>
      )}

      <section aria-labelledby="users-title" className="overflow-hidden rounded-3xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 id="users-title" className="font-bold">
            Users <span className="font-normal text-muted-foreground">({users.length})</span>
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter users">
              {FILTERS.map(([id, label]) => (
                <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className="voice-chip h-8 rounded-full border px-3 text-xs font-semibold">
                  {label}
                </button>
              ))}
            </div>
            <label className="relative block sm:w-60">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <span className="sr-only">Search users</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="lab-input lab-input--icon h-9 text-sm" />
            </label>
          </div>
        </div>

        {!data ? (
          <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Loading users...
          </p>
        ) : !users.length ? (
          <p className="p-6 text-sm text-muted-foreground">No users match.</p>
        ) : (
          <ul className="divide-y" data-lenis-prevent>
            {users.map((u) => {
              const expanded = open === u.id;
              return (
                <li key={u.id} className={cn("admin-row", expanded && "bg-muted/30")}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : u.id)}
                    className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 sm:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:px-5"
                  >
                    <span className={cn("grid size-9 place-items-center rounded-full text-sm font-bold uppercase", u.role === "admin" ? "bg-brand text-primary-foreground" : "bg-muted")}>{(u.name || u.email)[0]}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {u.name || "No name"}
                        {u.id === me.id && <Chip tone="brand">You</Chip>}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                    </span>
                    <span className="hidden flex-wrap gap-1 sm:flex">
                      {u.role === "admin" && (
                        <Chip tone="brand">
                          <Shield className="size-3" /> Admin
                        </Chip>
                      )}
                      {u.banned ? <Chip tone="bad">Banned</Chip> : u.verified ? <Chip tone="good">Verified</Chip> : <Chip tone="warn">Unverified</Chip>}
                      {u.providers.includes("google") && <Chip>Google</Chip>}
                      {u.providers.includes("credential") && <Chip>Email</Chip>}
                      {u.powered ? (
                        <Chip tone="brand">
                          <Zap className="size-3" /> Powered
                        </Chip>
                      ) : (
                        u.hasKey && <Chip>Key saved</Chip>
                      )}
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      <span className="block tabular-nums">{u.chats} chats</span>
                      <span className="block">Active {ago(u.lastActive).toLowerCase()}</span>
                    </span>
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} aria-hidden />
                  </button>
                  {expanded && (
                    <Manage
                      u={u}
                      self={u.id === me.id}
                      onDone={(msg) => {
                        setToast(msg);
                        window.setTimeout(() => setToast(""), 2400);
                        void load();
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {toast && (
        <p role="status" className="saved-toast fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-popover px-4 py-2 text-sm font-semibold shadow-lg">
          {toast}
        </p>
      )}
    </div>
  );
}
