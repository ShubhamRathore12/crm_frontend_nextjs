"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadIcon, CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "lead" | "contact";
}

export function BulkUploadModal({ open, onOpenChange, entityType }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // For now, we just log the tracking entry since actual multipart is a placeholder in BE
      await api.bulkUploads.create({
        file_name: file.name,
        entity_type: entityType,
      });
      setStatus("success");
      setTimeout(() => onOpenChange(false), 2000);
    } catch (error) {
      console.error("Upload failed:", error);
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload {entityType === "lead" ? "Leads" : "Contacts"}</DialogTitle>
        </DialogHeader>
        <div className="py-6 flex flex-col items-center gap-4">
          {status === "idle" ? (
            <>
              <Label
                htmlFor="file-upload"
                className="w-full h-32 border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <UploadIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Select CSV or Excel file"}
                </span>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Label>
              <p className="text-xs text-muted-foreground text-center">
                Download <span className="text-primary cursor-pointer hover:underline">Sample Template</span>
              </p>
            </>
          ) : status === "success" ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircledIcon className="h-12 w-12 text-green-500" />
              <p className="font-semibold">Upload Started</p>
              <p className="text-sm text-muted-foreground text-center">
                Your file is being processed. You can check the status in Settings {" > "} Bulk Jobs.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <CrossCircledIcon className="h-12 w-12 text-red-500" />
              <p className="font-semibold">Upload Failed</p>
              <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
                Try Again
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading || status !== "idle"}>
            {uploading ? "Uploading..." : "Start Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
