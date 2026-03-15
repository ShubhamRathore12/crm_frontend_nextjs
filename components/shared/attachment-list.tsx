"use client";

import { useEffect, useState } from "react";
import { api, Attachment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileIcon, DownloadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentListProps {
  entityType: string;
  entityId: string;
}

export function AttachmentList({ entityType, entityId }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttachments = async () => {
    try {
      const data = await api.attachments.list({ entity_type: entityType, entity_id: entityId });
      setAttachments(data);
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [entityId]);

  const handleDelete = async (id: string) => {
    try {
      await api.attachments.delete(id);
      setAttachments(attachments.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  if (loading) return <div className="text-xs text-muted-foreground">Loading attachments...</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments ({attachments.length})
        </h4>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          Upload
        </Button>
      </div>
      
      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 border-2 border-dashed rounded-md text-center">
          No files attached.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group flex items-center justify-between p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded bg-background flex items-center justify-center border shrink-0">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{att.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(att.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <DownloadCloud className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(att.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
