"use client";

import { useState } from "react";
import {
  Zap, Search, ChevronLeft, Play, CheckCircle2, XCircle, Loader2,
  Circle, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FAST_LANE_FLOWS, type FastLaneFlow, type FastLaneStep } from "@/lib/mock/interactions";

type RunStep = FastLaneStep;

export function FastLane({ customerName }: { customerName: string }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<FastLaneFlow | null>(null);
  const [run, setRun] = useState<RunStep[] | null>(null);
  const [broken, setBroken] = useState(false);

  const startFlow = (flow: FastLaneFlow) => {
    setActive(flow);
    setBroken(false);
    // Build a simulated run: first steps completed, one fails (mirrors screenshot "BROKEN" flow).
    const now = new Date();
    const stamp = (offsetSec: number) =>
      new Date(now.getTime() + offsetSec * 1000).toLocaleString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      });

    const steps: RunStep[] = flow.steps.map((s, i) => {
      if (i === 0) return { ...s, status: "completed", timestamp: stamp(0), detail: "Flow Initiated" };
      if (i === 1) return { ...s, status: "completed", timestamp: stamp(0), detail: "Message Sent to Customer via Fastlane" };
      if (i === 2) {
        // simulate the broken custom-action from the screenshot
        if (flow.id === "policy-cancel") {
          return { ...s, status: "failed", timestamp: stamp(1), detail: 'TypeError: Cannot read property "contactPerson" from undefined in <eval> at line number 10' };
        }
        return { ...s, status: "running", timestamp: stamp(1) };
      }
      return { ...s, status: "pending" };
    });
    setRun(steps);
    if (flow.id === "policy-cancel") setBroken(true);
  };

  const reset = () => { setActive(null); setRun(null); setBroken(false); };

  // ── Flow list view ──
  if (!active) {
    const filtered = FAST_LANE_FLOWS.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 p-1.5"><Zap className="h-4 w-4 text-primary" /></span>
            <div>
              <p className="text-sm font-semibold">Welcome to Fast Lane!</p>
              <p className="text-[11px] text-muted-foreground">Streamline your workflow for faster ticket handling.</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Flows" className="h-8 pl-8 text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {filtered.map((f) => (
            <button
              key={f.id}
              onClick={() => startFlow(f)}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Play className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold group-hover:text-primary">{f.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{f.description}</p>
              </div>
              <div className="text-right">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{f.category}</span>
                <p className="mt-1 text-[10px] text-muted-foreground">{f.estimatedTime}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Flow run view ──
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={reset} className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> Back to Flows
        </button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground"><History className="h-3.5 w-3.5" /> History</Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-primary/10 p-1.5 text-primary"><Zap className="h-4 w-4" /></span>
        <p className="text-sm font-semibold">{active.name}</p>
        {broken && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600">Broken</span>}
        <span className="ml-auto text-[10px] text-muted-foreground">for {customerName}</span>
      </div>

      <ol className="space-y-2">
        {run!.map((s) => <StepRow key={s.id} step={s} />)}
      </ol>

      {broken && (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 p-2.5 text-[11px] text-red-600">
          Flow halted at a failed custom action. Fix the step config or retry.
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => startFlow(active)}>Retry</Button>
        <Button size="sm" className="flex-1" disabled={broken}>Continue</Button>
      </div>
    </div>
  );
}

function StepRow({ step }: { step: RunStep }) {
  const map = {
    completed: { Icon: CheckCircle2, tone: "text-emerald-600", label: "COMPLETED", ring: "border-emerald-500/30" },
    running:   { Icon: Loader2,      tone: "text-blue-600",    label: "RUNNING",   ring: "border-blue-500/30" },
    failed:    { Icon: XCircle,      tone: "text-red-600",     label: "FAILED",    ring: "border-red-500/30" },
    pending:   { Icon: Circle,       tone: "text-muted-foreground", label: "PENDING", ring: "border-border" },
  }[step.status];
  const { Icon, tone, label, ring } = map;

  return (
    <li className={cn("rounded-lg border bg-card p-2.5", ring)}>
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone, step.status === "running" && "animate-spin")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">{step.label}</p>
            <span className={cn("text-[9px] font-bold tracking-wide", tone)}>{label}</span>
          </div>
          {step.timestamp && <p className="text-[10px] text-muted-foreground">{step.timestamp}{step.detail && !["failed"].includes(step.status) ? `: ${step.detail}` : ""}</p>}
          {step.status === "failed" && step.detail && (
            <p className="mt-1 break-words rounded bg-red-500/5 px-1.5 py-1 font-mono text-[10px] text-red-600">{step.detail}</p>
          )}
        </div>
      </div>
    </li>
  );
}
