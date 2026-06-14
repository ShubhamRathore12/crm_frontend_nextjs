"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Mail, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  company?: string;
  contactScore?: number;
  stage?: string;
  owner?: string;
  modifiedAt?: string;
  createdAt?: string;
}

// Mock data - replace with API call
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Kartik Dobhal",
    email: "kartik@example.com",
    mobile: "+91-98182894421",
    company: "Tech Corp",
    contactScore: 138,
    stage: "Prospect",
    owner: "System",
    modifiedAt: "04/10/2026, 12:17 PM",
    createdAt: "04/10/2026",
  },
  {
    id: "2",
    name: "John Doe",
    email: "john@example.com",
    mobile: "+91-9876543210",
    company: "Innovation Inc",
    contactScore: 95,
    stage: "Lead",
    owner: "Sales Team",
    modifiedAt: "04/09/2026, 3:45 PM",
    createdAt: "04/09/2026",
  },
];

const columns: DataTableColumn<Contact>[] = [
  {
    key: "name",
    header: "Contact Name",
    width: 200,
    searchable: true,
    filterValue: (c) => c.name ?? "",
    render: (contact) => (
      <Link
        href={`/contacts/${contact.id}`}
        className="font-medium text-blue-600 hover:text-blue-800"
      >
        {contact.name}
      </Link>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    width: 100,
    render: (contact) => (
      <div className="flex gap-2">
        {contact.email && (
          <button
            title="Email"
            className="p-1 text-gray-600 hover:text-blue-600 transition"
            onClick={() => window.location.href = `mailto:${contact.email}`}
          >
            <Mail className="h-4 w-4" />
          </button>
        )}
        {contact.mobile && (
          <button
            title="Phone"
            className="p-1 text-gray-600 hover:text-blue-600 transition"
            onClick={() => window.location.href = `tel:${contact.mobile}`}
          >
            <Phone className="h-4 w-4" />
          </button>
        )}
        <button
          title="More info"
          className="p-1 text-gray-600 hover:text-blue-600 transition"
        >
          <FileText className="h-4 w-4" />
        </button>
      </div>
    ),
  },
  {
    key: "contactScore",
    header: "Contact Score",
    width: 120,
    render: (contact) => (
      <span className="font-semibold text-gray-900">
        {contact.contactScore ?? "—"}
      </span>
    ),
  },
  {
    key: "stage",
    header: "Contact Stage",
    width: 130,
    searchable: true,
    filterValue: (c) => c.stage ?? "",
    render: (contact) => (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        {contact.stage ?? "—"}
      </Badge>
    ),
  },
  {
    key: "owner",
    header: "Contact Owner",
    width: 130,
    searchable: true,
    filterValue: (c) => c.owner ?? "",
    render: (contact) => <span className="text-gray-700">{contact.owner ?? "—"}</span>,
  },
  {
    key: "modifiedAt",
    header: "Modified On",
    width: 160,
    render: (contact) => (
      <span className="text-gray-600 text-sm">{contact.modifiedAt ?? "—"}</span>
    ),
  },
];

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleDelete = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contact deleted successfully");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage Contacts</h1>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white md:self-auto self-end">
          <Plus className="h-4 w-4 mr-2" />
          Quick Add Contact
        </Button>
      </div>

      {/* Data Table */}
      <DataTable<Contact>
        columns={columns}
        data={contacts}
        total={contacts.length}
        isLoading={false}
        onSearchChange={handleSearchChange}
        searchValue={search}
        searchPlaceholder="Search contacts by name, email, phone..."
        onDelete={handleDelete}
        deleteLabel="this contact"
        entityLabel="contacts"
        emptyMessage="No contacts found. Create your first contact to get started."
        showActions={true}
      />
    </div>
  );
}
