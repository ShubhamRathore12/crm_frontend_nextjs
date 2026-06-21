"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  GitBranch,
  CheckSquare,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
} from "lucide-react";
import { OPPS, fmtDateTime } from "@/components/opportunities/opp-data";

const TABS = [
  "Opportunities",
  "Activity History",
  "Contact Details",
  "Tasks",
  "Documents",
  "Member of Lists",
  "Contact Share History",
  "Campaign Emails",
  "Audit Trail",
];

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const opp = useMemo(() => OPPS.find((o) => o.id === id) ?? OPPS[0], [id]);

  const [tab, setTab] = useState(TABS[0]);
  const initials = opp.contactName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  // opportunities belonging to this contact (same name) + the current one
  const oppsForContact = OPPS.filter((o) => o.contactName === opp.contactName).slice(0, 5);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      {/* left card */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-border bg-card overflow-y-auto">
        <div className="bg-primary/90 px-4 py-6 text-primary-foreground">
          <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-sm opacity-90 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-foreground/20 text-lg font-bold">{initials}</div>
          <div className="mt-3 font-semibold">{opp.contactName}</div>
          <Badge variant="secondary" className="mt-1 text-foreground">Prospect</Badge>
        </div>

        <div className="grid grid-cols-4 gap-1 p-3 text-center border-b border-border">
          {[
            { icon: GitBranch, label: "Opportunity", fn: () => router.push(`/opportunities/${opp.id}`) },
            { icon: CheckSquare, label: "Tasks", fn: () => toast.success("Tasks") },
            { icon: Mail, label: "Email", fn: () => toast.success("Email") },
            { icon: MoreHorizontal, label: "More", fn: () => toast.success("More") },
          ].map((a) => (
            <button key={a.label} onClick={a.fn} className="flex flex-col items-center gap-1 rounded-md py-2 text-primary hover:bg-secondary text-xs">
              <a.icon className="h-4 w-4" /> {a.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-px bg-border">
          <Stat n={opp.opportunityId} label="Contact ID" />
          <Stat n="6" label="Contact Score" />
          <Stat n="4" label="Engaged" />
          <Stat n="–" label="Contact Quality" />
        </div>

        <div className="p-4 space-y-3">
          <div className="text-sm font-semibold">Contact Properties</div>
          <KV k="Owner" v={opp.owner} />
          <KV k="Contact Age" v="15 Days" />
          <KV k="Contact Source" v="--" />
          <KV k="Is Qualified" v="--" />
          <KV k="Phone" v={opp.phone} />
          <KV k="Email" v={opp.email} />
        </div>
      </aside>

      {/* main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-1 border-b border-border px-4 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors " +
                (tab === t ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => toast.success("Added")} className="p-2 rounded text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
            <button onClick={() => toast.success("Refreshed")} className="p-2 rounded text-muted-foreground hover:text-foreground"><RefreshCw className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          {tab === "Opportunities" ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Opportunity Name</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Stage</th>
                    <th className="px-3 py-3 font-medium">Created On</th>
                    <th className="px-3 py-3 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {oppsForContact.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-3 py-3">
                        <Link href={`/opportunities/${o.id}`} className="text-primary hover:underline">{o.name}</Link>
                      </td>
                      <td className="px-3 py-3">{o.status}</td>
                      <td className="px-3 py-3">{o.stage}</td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(o.createdOn)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{o.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === "Contact Details" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-w-3xl">
              <KV k="Contact Name" v={opp.contactName} />
              <KV k="Phone" v={opp.phone} />
              <KV k="Email" v={opp.email} />
              <KV k="Company" v={opp.company} />
              <KV k="Owner" v={opp.owner} />
              <KV k="Contact ID" v={opp.opportunityId} />
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              <div>
                <MoreHorizontal className="mx-auto h-8 w-8 opacity-40" />
                <p className="mt-2 text-sm">{tab} — nothing here yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="bg-card p-3">
      <div className="text-lg font-bold">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="text-sm break-words">{v}</div>
    </div>
  );
}
