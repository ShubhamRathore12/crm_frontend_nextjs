"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { api, Contact } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { toast } from "sonner";

const columns: DataTableColumn<Contact>[] = [
  {
    key: "name",
    header: "Name",
    width: 180,
    searchable: true,
    filterValue: (c) => c.name ?? "",
    render: (c) => (
      <Link href={`/contacts/${c.id}`} className="font-medium hover:text-primary transition-colors">
        {c.name}
      </Link>
    ),
  },
  {
    key: "email",
    header: "Email",
    searchable: true,
    filterValue: (c) => c.email ?? "",
    render: (c) => <span className="text-muted-foreground">{c.email}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    searchable: true,
    filterValue: (c) => c.phone || "",
    render: (c) => <span className="text-muted-foreground">{c.phone || "—"}</span>,
  },
  {
    key: "ucc_code",
    header: "UCC Code",
    searchable: true,
    filterValue: (c) => c.ucc_code || "",
    render: (c) => <span className="text-muted-foreground font-mono text-xs">{c.ucc_code || "—"}</span>,
  },
  {
    key: "pan",
    header: "PAN",
    searchable: true,
    filterValue: (c) => c.pan || "",
    render: (c) => <span className="text-muted-foreground font-mono text-xs">{c.pan || "—"}</span>,
  },
  {
    key: "company",
    header: "Company",
    searchable: true,
    filterValue: (c) => c.company || "",
    render: (c) => <span className="text-muted-foreground">{c.company || "—"}</span>,
  },
  {
    key: "city",
    header: "City",
    searchable: true,
    filterValue: (c) => c.city || "",
    render: (c) => <span className="text-muted-foreground">{c.city || "—"}</span>,
  },
  {
    key: "created",
    header: "Created",
    render: (c) => (
      <span className="text-muted-foreground">
        {new Date(c.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<Contact[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", page, search],
    queryFn: () =>
      api.contacts.list({
        page: String(page),
        limit: "20",
        search: search || undefined,
      }),
  });

  useEffect(() => {
    if (!data?.data) return;
    if (page === 1) {
      setAccumulated(data.data);
    } else {
      setAccumulated((prev) => {
        const ids = new Set(prev.map((c) => c.id));
        const newItems = data.data.filter((c: Contact) => !ids.has(c.id));
        return newItems.length ? [...prev, ...newItems] : prev;
      });
    }
  }, [data, page]);

  const total = data?.total ?? 0;
  const hasMore = accumulated.length < total;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.contacts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setPage(1);
      toast.success("Contact deleted successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to delete contact", { description: err.message });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-muted-foreground">UCC as unique identifier</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/contacts/import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/contacts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Contact
            </Link>
          </Button>
        </div>
      </div>

      <DataTable<Contact>
        columns={columns}
        data={accumulated}
        total={total}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search contacts by name, email, UCC..."
        onDelete={(id) => deleteMutation.mutate(id)}
        deleteLabel="this contact"
        entityLabel="contacts"
        emptyMessage="No contacts found. Create your first contact to get started."
      />
    </div>
  );
}
