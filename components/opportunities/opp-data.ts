// Shared dummy data + types for the LeadSquared-style Opportunities screens.
// Pure client-side mock — no backend.

export type OppType = "IIBX" | "Product Opportunity";
export type DiyFlag = "Yes" | "No";

export interface Opp {
  id: string;
  name: string;
  status: string; // e.g. "Open - Not Connected"
  stage: string;
  type: OppType;
  diyFlag: DiyFlag;
  upsale: "Upsale" | "New";
  createdOn: string; // ISO
  agentAssigned: string; // ISO
  noOfAttempts: number;
  noOfConnects: number;
  ownerUpdate: string; // ISO-ish "2026-06-05 18:02:20"
  owner: string;
  ownerEmail: string;
  contactName: string;
  phone: string;
  email: string;
  company: string;
  broadProduct: string;
  source: string;
  callStatus: string;
  talismaId: string;
  opportunityId: string;
}

export const OWNERS = [
  { name: "Viraj Parsekar", email: "viraj.parsekar@stoxkart.com" },
  { name: "Anish Mahadaye", email: "anish.mahadaye@stoxkart.com" },
  { name: "Amar Singh", email: "amar.singh@stoxkart.com" },
  { name: "Faizan Shaikh", email: "faizan.shaikh@stoxkart.com" },
  { name: "Amolraj Sinah", email: "amolraj.sinah@stoxkart.com" },
];

export const STATUSES = [
  "Open - Not Connected",
  "Open - Connected",
  "Open - Callback",
  "Won",
  "Lost",
];

export const STAGES = [
  "Prospect",
  "Personal Details",
  "Bank Details",
  "PAN Details",
  "Document",
  "Won",
  "Lost",
];

export const BROAD_PRODUCTS = [
  "STX Trading Account",
  "STX Research Subscription",
  "STX Telegram Equity Ka Funda",
  "IIBX Account",
];

export const COMPANIES = ["Stoxkart", "SMC", "IIBX"];

export const TASK_TYPES: { group: string; items: string[] }[] = [
  { group: "APPOINTMENT", items: ["Call back Requested", "Follow-up CALL", "Meeting", "Zoom Webinar"] },
  { group: "TODO", items: ["Send Documents", "Verify KYC", "Collect Payment", "Schedule Demo"] },
];

export const ACTIVITY_TYPES = [
  "Opportunity Qualification",
  "Product Opportunity",
  "Email Sent",
  "Note Added",
];

/* ------------------------------------------------------------------ */
/* Row generator — base rows from the reference UI, padded to ~40.     */
/* ------------------------------------------------------------------ */

const BASE: Array<Partial<Opp> & { name: string; createdOn: string; agentAssigned: string; noOfAttempts: number; ownerUpdate: string; owner: string }> = [
  { name: "Prasanta patari", createdOn: "2026-06-05T17:46:00", agentAssigned: "2026-06-05T18:02:00", noOfAttempts: 8, ownerUpdate: "2026-06-05 18:02:20", owner: "Viraj Parsekar" },
  { name: "DEVKARAN RATHORE", createdOn: "2026-06-03T10:11:00", agentAssigned: "2026-06-03T10:26:00", noOfAttempts: 7, ownerUpdate: "2026-06-03 10:26:55", owner: "Viraj Parsekar", email: "dkrathore415@gmail.com", broadProduct: "STX Telegram Equity Ka Funda", source: "STX Research Subscription" },
  { name: "Pankaj bafna", createdOn: "2026-06-12T00:32:00", agentAssigned: "2026-06-12T10:18:00", noOfAttempts: 7, ownerUpdate: "2026-06-12 10:18:28", owner: "Anish Mahadaye" },
  { name: "Pardeep sidhu", createdOn: "2026-06-06T15:21:00", agentAssigned: "2026-06-06T15:36:00", noOfAttempts: 6, ownerUpdate: "2026-06-06 15:36:25", owner: "Anish Mahadaye" },
  { name: "Binu Singh", createdOn: "2026-06-02T08:00:00", agentAssigned: "2026-06-02T10:23:00", noOfAttempts: 6, ownerUpdate: "2026-06-02 10:23:25", owner: "Viraj Parsekar" },
  { name: "Hitesh", createdOn: "2026-06-05T12:18:00", agentAssigned: "2026-06-05T12:33:00", noOfAttempts: 6, ownerUpdate: "2026-06-05 12:33:24", owner: "Viraj Parsekar" },
  { name: "K Jaichandra", createdOn: "2026-05-31T09:55:00", agentAssigned: "2026-06-01T10:27:00", noOfAttempts: 5, ownerUpdate: "2026-06-01 10:27:55", owner: "Amar Singh" },
  { name: "Gaurav Chaudhary", createdOn: "2026-06-02T03:03:00", agentAssigned: "2026-06-02T10:20:00", noOfAttempts: 5, ownerUpdate: "2026-06-02 10:20:27", owner: "Faizan Shaikh" },
  { name: "Pradeep", createdOn: "2026-06-07T20:51:00", agentAssigned: "2026-06-08T10:30:00", noOfAttempts: 5, ownerUpdate: "2026-06-08 10:30:57", owner: "Anish Mahadaye" },
  { name: "Raja", createdOn: "2026-06-03T15:54:00", agentAssigned: "2026-06-03T16:09:00", noOfAttempts: 5, ownerUpdate: "2026-06-03 16:09:19", owner: "Amolraj Sinah" },
];

const FIRST = ["Rahul", "Amit", "Sneha", "Vikram", "Pooja", "Suresh", "Neha", "Arjun", "Divya", "Manish", "Kiran", "Rohit", "Anjali", "Deepak", "Meera"];
const LAST = ["Sharma", "Verma", "Patel", "Reddy", "Nair", "Gupta", "Singh", "Joshi", "Mehta", "Rao"];

function build(): Opp[] {
  const rows: Opp[] = BASE.map((b, i) => fill(b, i));
  for (let i = rows.length; i < 40; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
    const day = ((i * 3) % 27) + 1;
    const dd = String(day).padStart(2, "0");
    rows.push(
      fill(
        {
          name,
          createdOn: `2026-05-${dd}T09:${String((i * 7) % 60).padStart(2, "0")}:00`,
          agentAssigned: `2026-05-${dd}T11:${String((i * 5) % 60).padStart(2, "0")}:00`,
          noOfAttempts: ((i * 2) % 9) + 1,
          ownerUpdate: `2026-05-${dd} 11:${String((i * 5) % 60).padStart(2, "0")}:00`,
          owner: OWNERS[i % OWNERS.length].name,
        },
        i
      )
    );
  }
  return rows;
}

function fill(b: Partial<Opp> & { name: string; owner: string }, i: number): Opp {
  const owner = OWNERS.find((o) => o.name === b.owner) ?? OWNERS[0];
  return {
    id: b.id ?? String(i + 1),
    name: b.name,
    status: b.status ?? STATUSES[i % STATUSES.length],
    stage: b.stage ?? STAGES[i % STAGES.length],
    type: b.type ?? "Product Opportunity",
    diyFlag: b.diyFlag ?? (i % 2 === 0 ? "Yes" : "No"),
    upsale: b.upsale ?? (i % 3 === 0 ? "Upsale" : "New"),
    createdOn: b.createdOn!,
    agentAssigned: b.agentAssigned!,
    noOfAttempts: b.noOfAttempts ?? 1,
    noOfConnects: b.noOfConnects ?? Math.max(1, Math.floor((b.noOfAttempts ?? 1) / 2)),
    ownerUpdate: b.ownerUpdate!,
    owner: owner.name,
    ownerEmail: owner.email,
    contactName: b.contactName ?? `${b.name} ${b.name.split(" ").slice(-1)[0]}`,
    phone: b.phone ?? `+91 9${String(800000000 + i * 137).slice(0, 9)}`,
    email: b.email ?? `${b.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
    company: b.company ?? "Stoxkart",
    broadProduct: b.broadProduct ?? BROAD_PRODUCTS[i % BROAD_PRODUCTS.length],
    source: b.source ?? "STX Trading Account",
    callStatus: b.callStatus ?? "Ringing{DNP}",
    talismaId: b.talismaId ?? "--",
    opportunityId: b.opportunityId ?? String(16000000 + i * 1373),
  };
}

export const OPPS: Opp[] = build();

export interface Activity {
  id: string;
  type: string;
  title: string;
  detail?: string;
  by: string;
  at: string; // ISO
  // extra fields shown when an activity is opened
  fields?: { label: string; value: string; sub?: string }[];
}

export const ACTIVITIES: Activity[] = [
  { id: "a1", type: "Product Opportunity", title: "Product Opportunity", by: "System", at: "2026-06-16T16:16:00",
    fields: [
      { label: "Stage Not Connected Date Time", value: "06/16/2026 04:16:04 PM", sub: "06/15/2026 02:36:05 PM" },
      { label: "Latest Follow Up Date Time", value: "06/16/2026 04:15:00 PM", sub: "06/15/2026 02:35:00 PM" },
    ] },
  { id: "a2", type: "Product Opportunity", title: "Product Opportunity", by: "System", at: "2026-06-16T16:16:00",
    fields: [{ label: "Stage Transition Date Time", value: "06/16/2026 04:16:00 PM" }] },
  { id: "a3", type: "Opportunity Qualification", title: "Opportunity Qualification", detail: "Ringing", by: "Viraj Parsekar", at: "2026-06-16T16:15:00",
    fields: [{ label: "Call Status", value: "Ringing{DNP}" }, { label: "No of Attempts", value: "8" }] },
  { id: "a4", type: "Product Opportunity", title: "Product Opportunity", by: "System", at: "2026-06-15T14:36:00",
    fields: [{ label: "Stage Transition Date Time", value: "06/15/2026 02:36:00 PM" }] },
  { id: "a5", type: "Product Opportunity", title: "Product Opportunity", by: "System", at: "2026-06-15T14:36:00",
    fields: [{ label: "Stage Need Some Time Date Time", value: "06/12/2026 10:36:01 AM" }] },
  { id: "a6", type: "Opportunity Qualification", title: "Opportunity Qualification", detail: "Ringing", by: "Viraj Parsekar", at: "2026-06-15T14:35:00",
    fields: [{ label: "Call Status", value: "Ringing{DNP}" }, { label: "No of Connects", value: "2" }] },
];

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export const fmtTimeAgo = (iso: string) => {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};
