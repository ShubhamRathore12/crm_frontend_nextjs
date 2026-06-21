"use client";

import { useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BankAccount } from "@/lib/mock/interactions";
import { toast } from "sonner";

export function AccountInfo({ accounts }: { accounts: BankAccount[] }) {
  const [open, setOpen] = useState<string | null>(accounts[0]?.accountNo ?? null);

  return (
    <div className="space-y-2.5">
      {accounts.map((acc) => {
        const expanded = open === acc.accountNo;
        return (
          <div key={acc.accountNo} className="overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setOpen(expanded ? null : acc.accountNo)}
              className="flex w-full items-center justify-between bg-card px-3 py-2.5 text-left hover:bg-accent/5"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Wallet className="h-4 w-4" />
                A/C No.- {acc.accountNo}
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            </button>

            {expanded && (
              <div className="space-y-3 px-3 pb-3 pt-1">
                <div className="flex items-center justify-between rounded-md bg-primary/5 px-2.5 py-1.5">
                  <span className="text-xs text-muted-foreground">Available Balance</span>
                  <span className="text-sm font-bold text-primary">{acc.balance}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <Pair label="Account Number" value={acc.accountNumberMasked} action={
                    <Button size="sm" variant="outline" className="h-5 px-1.5 text-[9px]" onClick={() => toast.message("Balance: " + acc.balance)}>
                      CHECK BALANCE
                    </Button>
                  } />
                  <Pair label="Bank Name" value={acc.bankName} />
                  <Pair label="Account Type" value={acc.accountType} />
                  <Pair label="Status" value={acc.status} status />
                  <Pair label="Branch" value={acc.branch} />
                  <Pair label="IFSC Code" value={acc.ifsc} />
                  <Pair label="Beneficiary" value={acc.beneficiary} />
                  <Pair label="Beneficiary Relationship" value={acc.beneficiaryRelationship} />
                  <Pair label="Beneficiary PAN" value={acc.beneficiaryPan} />
                  <Pair label="Account Opening Date" value={acc.accountOpeningDate} />
                  <Pair label="Last Used Net Banking" value={acc.lastUsedNetBanking} />
                  <Pair label="Last Used Mobile App" value={acc.lastUsedMobileApp} />
                  <Pair label="Debit Card Number" value={acc.debitCardNumber} />
                  <Pair label="Debit Card Last Used Date" value={acc.debitCardLastUsed} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Pair({ label, value, action, status }: { label: string; value: string; action?: React.ReactNode; status?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {action}
      </div>
      <p className={cn("truncate text-xs font-medium", status && value === "Active" && "text-emerald-600")}>{value}</p>
    </div>
  );
}
