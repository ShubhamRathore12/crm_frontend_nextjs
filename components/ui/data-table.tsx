"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Trash2,
  AlertTriangle,
  X,
  Pin,
  PinOff,
  ArrowLeftToLine,
  ArrowRightToLine,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PinDirection = "left" | "right";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Width in px used when column is pinned to calculate offsets (default 150) */
  width?: number;
  /** Enable per-column search input in the header */
  searchable?: boolean;
  /** Extract plain-text value from the row for column filtering.
   *  Required when `searchable` is true. */
  filterValue?: (row: T) => string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T extends { id: string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  total?: number;
  isLoading?: boolean;
  /** When true, the sentinel at the bottom triggers `onLoadMore` */
  hasMore?: boolean;
  /** Called when user scrolls to the bottom of the table */
  onLoadMore?: () => void;
  /** Global search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Delete with confirmation dialog */
  onDelete?: (id: string) => void;
  deleteLabel?: string;
  /** Extra filter controls rendered between search and count */
  filters?: React.ReactNode;
  emptyMessage?: string;
  /** Label shown next to total count (e.g. "leads") */
  entityLabel?: string;
  /** Show the actions (delete) column — default true */
  showActions?: boolean;
  /** Row ids to pin/freeze at the top of the table */
  pinnedRowIds?: string[];
  /** Callback when user pins/unpins rows (toggle) */
  onTogglePinRow?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTIONS_COL_WIDTH = 60;
const DEFAULT_COL_WIDTH = 150;
const ROW_HEIGHT = 41;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<T extends { id: string }>({
  columns,
  data,
  total,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  onDelete,
  deleteLabel = "this item",
  filters,
  emptyMessage = "No data found.",
  entityLabel,
  showActions = true,
  pinnedRowIds,
  onTogglePinRow,
}: DataTableProps<T>) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [columnPins, setColumnPins] = useState<Record<string, PinDirection>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasDeleteAction = showActions && !!onDelete;

  // ---- User-controlled column pinning ------------------------------------
  const pinColumn = (key: string, dir: PinDirection) =>
    setColumnPins((prev) => ({ ...prev, [key]: dir }));

  const unpinColumn = (key: string) =>
    setColumnPins((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const getPin = (key: string): PinDirection | undefined => columnPins[key];

  // ---- Column ordering: left-pinned → unpinned → right-pinned -----------
  const leftPinned = useMemo(
    () => columns.filter((c) => columnPins[c.key] === "left"),
    [columns, columnPins]
  );
  const rightPinned = useMemo(
    () => columns.filter((c) => columnPins[c.key] === "right"),
    [columns, columnPins]
  );
  const unpinnedCols = useMemo(
    () => columns.filter((c) => !columnPins[c.key]),
    [columns, columnPins]
  );
  const orderedColumns = useMemo(
    () => [...leftPinned, ...unpinnedCols, ...rightPinned],
    [leftPinned, unpinnedCols, rightPinned]
  );

  const hasSearchableColumns = columns.some((c) => c.searchable);

  // ---- Sticky offset maps ------------------------------------------------
  const leftOffsets = useMemo(() => {
    const map = new Map<string, number>();
    let cum = 0;
    for (const col of leftPinned) {
      map.set(col.key, cum);
      cum += col.width ?? DEFAULT_COL_WIDTH;
    }
    return map;
  }, [leftPinned]);

  const rightOffsets = useMemo(() => {
    const map = new Map<string, number>();
    let cum = hasDeleteAction ? ACTIONS_COL_WIDTH : 0;
    for (let i = rightPinned.length - 1; i >= 0; i--) {
      map.set(rightPinned[i].key, cum);
      cum += rightPinned[i].width ?? DEFAULT_COL_WIDTH;
    }
    return map;
  }, [rightPinned, hasDeleteAction]);

  // ---- Inline style for a pinned column cell -----------------------------
  const pinnedStyle = (col: DataTableColumn<T>): React.CSSProperties => {
    const dir = getPin(col.key);
    if (dir === "left") {
      return {
        position: "sticky",
        left: leftOffsets.get(col.key) ?? 0,
        minWidth: col.width ?? DEFAULT_COL_WIDTH,
      };
    }
    if (dir === "right") {
      return {
        position: "sticky",
        right: rightOffsets.get(col.key) ?? 0,
        minWidth: col.width ?? DEFAULT_COL_WIDTH,
      };
    }
    return {};
  };

  // Shadow on the boundary between pinned and unpinned columns
  const shadowClass = (col: DataTableColumn<T>): string => {
    const dir = getPin(col.key);
    if (dir === "left" && col === leftPinned[leftPinned.length - 1]) {
      return "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[4px] after:translate-x-full after:bg-gradient-to-r after:from-black/5 after:to-transparent after:pointer-events-none";
    }
    if (dir === "right" && col === rightPinned[0]) {
      return "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:-translate-x-full before:bg-gradient-to-l before:from-black/5 before:to-transparent before:pointer-events-none";
    }
    return "";
  };

  const pinnedCellClass = (col: DataTableColumn<T>): string =>
    getPin(col.key) ? `relative z-10 bg-background ${shadowClass(col)}` : "";

  const pinnedHeaderClass = (col: DataTableColumn<T>): string =>
    getPin(col.key) ? `relative z-30 bg-muted/90 ${shadowClass(col)}` : "";

  // ---- Column filtering (client-side) ------------------------------------
  const filteredData = useMemo(() => {
    const active = Object.entries(columnFilters).filter(([, v]) => v.trim() !== "");
    if (active.length === 0) return data;
    return data.filter((row) =>
      active.every(([key, text]) => {
        const col = columns.find((c) => c.key === key);
        if (!col?.filterValue) return true;
        return col.filterValue(row).toLowerCase().includes(text.toLowerCase());
      })
    );
  }, [data, columnFilters, columns]);

  // ---- Row pinning -------------------------------------------------------
  const pinnedIdSet = useMemo(() => new Set(pinnedRowIds ?? []), [pinnedRowIds]);
  const pinnedRows = useMemo(
    () => (pinnedIdSet.size ? filteredData.filter((r) => pinnedIdSet.has(r.id)) : []),
    [filteredData, pinnedIdSet]
  );
  const unpinnedRows = useMemo(
    () => (pinnedIdSet.size ? filteredData.filter((r) => !pinnedIdSet.has(r.id)) : filteredData),
    [filteredData, pinnedIdSet]
  );

  const headerTopOffset = ROW_HEIGHT + (hasSearchableColumns ? ROW_HEIGHT : 0);

  // ---- Infinite scroll via IntersectionObserver --------------------------
  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, isLoading]);

  // ---- Delete confirmation -----------------------------------------------
  const handleConfirmDelete = () => {
    if (deleteTarget && onDelete) onDelete(deleteTarget);
    setDeleteTarget(null);
  };

  // ---- Column filter helpers ---------------------------------------------
  const setColFilter = (key: string, value: string) =>
    setColumnFilters((prev) => ({ ...prev, [key]: value }));

  const clearColFilter = (key: string) =>
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  // ---- Render a single row -----------------------------------------------
  const renderRow = (row: T, opts?: { stickyTop?: number }) => {
    const isPinnedRow = opts?.stickyTop !== undefined;
    const rowStyle: React.CSSProperties = isPinnedRow
      ? { position: "sticky", top: opts.stickyTop, zIndex: 15 }
      : {};

    return (
      <tr
        key={row.id}
        className={`border-b hover:bg-muted/30 transition-colors group ${
          isPinnedRow ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : ""
        }`}
        style={rowStyle}
      >
        {orderedColumns.map((col) => (
          <td
            key={col.key}
            className={`p-3 ${pinnedCellClass(col)} ${col.className ?? ""} group-hover:bg-muted/30`}
            style={pinnedStyle(col)}
          >
            {col.render(row)}
          </td>
        ))}
        {hasDeleteAction && (
          <td
            className="p-3 bg-background"
            style={{ position: "sticky", right: 0, minWidth: ACTIONS_COL_WIDTH, zIndex: 10 }}
          >
            <div className="flex items-center gap-1">
              {onTogglePinRow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePinRow(row.id)}
                  className="text-muted-foreground hover:text-foreground"
                  title={pinnedIdSet.has(row.id) ? "Unpin row" : "Pin row to top"}
                >
                  {pinnedIdSet.has(row.id) ? (
                    <PinOff className="h-4 w-4" />
                  ) : (
                    <Pin className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(row.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </td>
        )}
      </tr>
    );
  };

  // ---- Column header with pin dropdown -----------------------------------
  const renderColumnHeader = (col: DataTableColumn<T>) => {
    const dir = getPin(col.key);
    return (
      <th
        key={col.key}
        className={`text-left p-3 font-medium text-muted-foreground bg-muted/50 whitespace-nowrap ${pinnedHeaderClass(col)} ${col.className ?? ""}`}
        style={pinnedStyle(col)}
      >
        <div className="flex items-center gap-1.5">
          <span>{col.header}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`inline-flex items-center justify-center rounded p-0.5 transition-colors ${
                  dir
                    ? "text-primary hover:text-primary/80"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                }`}
                title="Pin column"
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onClick={() => pinColumn(col.key, "left")}
                className={dir === "left" ? "bg-accent" : ""}
              >
                <ArrowLeftToLine className="h-4 w-4 mr-2" />
                Pin Left
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => pinColumn(col.key, "right")}
                className={dir === "right" ? "bg-accent" : ""}
              >
                <ArrowRightToLine className="h-4 w-4 mr-2" />
                Pin Right
              </DropdownMenuItem>
              {dir && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => unpinColumn(col.key)}>
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </th>
    );
  };

  return (
    <>
      {/* ---- Global search + filters bar ---- */}
      {(onSearchChange || filters || total !== undefined) && (
        <div className="flex gap-2 md:gap-3 items-center flex-wrap">
          {onSearchChange && (
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {filters}
          {total !== undefined && entityLabel && (
            <span className="text-xs md:text-sm text-muted-foreground">
              {total} {entityLabel}
            </span>
          )}
        </div>
      )}

      {/* ---- Table ---- */}
      <Card>
        <CardContent className="p-0">
          {isLoading && data.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-220px)] md:max-h-[calc(100vh-280px)]">
              <table className="w-full text-sm border-collapse">
                {/* ---- Header ---- */}
                <thead className="sticky top-0 z-20">
                  {/* Column headers with pin controls */}
                  <tr className="border-b bg-muted/50">
                    {orderedColumns.map((col) => renderColumnHeader(col))}
                    {hasDeleteAction && (
                      <th
                        className="text-left p-3 font-medium text-muted-foreground bg-muted/50"
                        style={{ position: "sticky", right: 0, minWidth: ACTIONS_COL_WIDTH, zIndex: 30 }}
                      >
                        Actions
                      </th>
                    )}
                  </tr>

                  {/* Per-column search row */}
                  {hasSearchableColumns && (
                    <tr className="border-b bg-background">
                      {orderedColumns.map((col) => (
                        <th
                          key={`filter-${col.key}`}
                          className={`p-1.5 ${getPin(col.key) ? "bg-background relative z-30" : ""}`}
                          style={pinnedStyle(col)}
                        >
                          {col.searchable ? (
                            <div className="relative">
                              <Input
                                placeholder={`Filter ${col.header.toLowerCase()}…`}
                                value={columnFilters[col.key] ?? ""}
                                onChange={(e) => setColFilter(col.key, e.target.value)}
                                className="h-7 text-xs pr-7"
                              />
                              {columnFilters[col.key] && (
                                <button
                                  onClick={() => clearColFilter(col.key)}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ) : null}
                        </th>
                      ))}
                      {hasDeleteAction && (
                        <th
                          className="p-1.5 bg-background"
                          style={{ position: "sticky", right: 0, minWidth: ACTIONS_COL_WIDTH, zIndex: 30 }}
                        />
                      )}
                    </tr>
                  )}
                </thead>

                <tbody>
                  {/* Pinned rows (frozen at top, below header) */}
                  {pinnedRows.map((row, idx) =>
                    renderRow(row, { stickyTop: headerTopOffset + idx * ROW_HEIGHT })
                  )}
                  {/* Regular rows */}
                  {unpinnedRows.map((row) => renderRow(row))}
                </tbody>
              </table>

              {/* Infinite-scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />

              {/* Loading more indicator */}
              {isLoading && data.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading more…</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Delete confirmation dialog ---- */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteLabel}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
