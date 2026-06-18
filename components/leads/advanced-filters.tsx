"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, Search } from "lucide-react";
import { useState } from "react";

interface AdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: Record<string, string>) => void;
  agents: Array<{ id: string; name: string }>;
}

export function AdvancedFilters({
  open,
  onOpenChange,
  onApply,
  agents,
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState({
    scoreMin: "",
    scoreMax: "",
    stage: "",
    source: "",
    owner: "",
    engagementLevel: "",
    lastInteraction: "",
  });

  const handleApply = () => {
    onApply(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      scoreMin: "",
      scoreMax: "",
      stage: "",
      source: "",
      owner: "",
      engagementLevel: "",
      lastInteraction: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lead Score Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block">
                Min Score
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={filters.scoreMin}
                onChange={(e) =>
                  setFilters({ ...filters, scoreMin: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">
                Max Score
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="100"
                value={filters.scoreMax}
                onChange={(e) =>
                  setFilters({ ...filters, scoreMax: e.target.value })
                }
              />
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="text-xs font-semibold mb-1 block">
              Pipeline Stage
            </label>
            <Select
              value={filters.stage}
              onValueChange={(v) => setFilters({ ...filters, stage: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Source</label>
            <Select
              value={filters.source}
              onValueChange={(v) => setFilters({ ...filters, source: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
                <SelectItem value="paid_ads">Paid Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Owner</label>
            <Select
              value={filters.owner}
              onValueChange={(v) => setFilters({ ...filters, owner: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any owner" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Engagement Level */}
          <div>
            <label className="text-xs font-semibold mb-1 block">
              Engagement
            </label>
            <Select
              value={filters.engagementLevel}
              onValueChange={(v) =>
                setFilters({ ...filters, engagementLevel: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="none">No Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Last Interaction */}
          <div>
            <label className="text-xs font-semibold mb-1 block">
              Last Interaction
            </label>
            <Select
              value={filters.lastInteraction}
              onValueChange={(v) =>
                setFilters({ ...filters, lastInteraction: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Anytime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="quarter">Last 90 days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
