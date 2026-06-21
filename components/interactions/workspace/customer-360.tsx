"use client";

import { useState } from "react";
import {
  ChevronDown, TrendingUp, GraduationCap, Sparkles, ShieldCheck,
  Heart, CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer360, Product } from "@/lib/mock/interactions";
import { ChannelIcon } from "./shared";

export function Customer360View({ data }: { data: Customer360 }) {
  return (
    <div className="space-y-3">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2">
        <Kpi icon={CircleDollarSign} label="Lifetime Value" value={data.lifetimeValue} tone="text-emerald-600" />
        <Kpi icon={Heart} label="CSAT" value={`${data.csat}%`} tone="text-rose-600" />
        <Kpi icon={ShieldCheck} label="Risk Score" value={data.riskScore} tone="text-blue-600" />
        <Kpi icon={Sparkles} label="NPS" value={data.npsSegment} tone="text-violet-600" />
      </div>

      <Section title="Current Bank Products" defaultOpen>
        <ProductGrid products={data.currentProducts} />
      </Section>

      <Section title="Upsell / Cross-Sell" icon={TrendingUp}>
        <ProductGrid products={data.upsell} compact />
      </Section>

      <Section title="Professional Summary" icon={GraduationCap}>
        <dl className="space-y-2">
          {data.professional.map((p) => (
            <div key={p.label}>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{p.label}</dt>
              <dd className="text-xs font-medium">{p.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Customer Journey">
        <ol className="relative space-y-3 pl-4">
          <span className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px bg-border" />
          {data.journey.map((j, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[15px] top-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
              <div className="flex items-center gap-1.5">
                {j.channel && <ChannelIcon channel={j.channel} className="h-3 w-3" />}
                <p className="text-xs font-medium">{j.label}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{j.timestamp}</p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", tone)} />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className={cn("mt-0.5 text-sm font-bold", tone)}>{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen }: { title: string; icon?: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-lg border border-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-accent/5">
        <span className="flex items-center gap-2 text-sm font-semibold text-primary">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

function ProductGrid({ products, compact }: { products: Product[]; compact?: boolean }) {
  const groups = [...new Set(products.map((p) => p.group))];
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
          <div className="grid grid-cols-2 gap-2">
            {products.filter((p) => p.group === g).map((p) => (
              <div key={p.name} className="rounded-md border border-border bg-card p-2">
                <p className="text-xs font-semibold">{p.name}</p>
                {!compact && p.detail.map((d) => (
                  <p key={d} className="text-[10px] leading-snug text-muted-foreground">{d}</p>
                ))}
                {compact && <p className="text-[10px] text-muted-foreground">{p.detail[0]}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
