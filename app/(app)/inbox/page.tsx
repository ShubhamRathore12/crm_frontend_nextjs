"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Inbox as InboxIcon, 
  Star, 
  Archive, 
  Trash2, 
  MoreVertical, 
  Reply, 
  Forward, 
  User, 
  Clock, 
  Filter,
  ChevronRight,
  RefreshCcw,
  Mail as MailIcon,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { api, InboundEmail, InboundEmailDetail } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function InboxPage() {
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InboundEmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEmails = () => {
    setLoading(true);
    api.emails.list().then(setEmails).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (selectedId) {
      setDetailLoading(true);
      api.emails.detail(selectedId).then(setDetail).finally(() => setDetailLoading(false));
    }
  }, [selectedId]);

  const filteredEmails = emails.filter(e => 
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden bg-background/50 backdrop-blur-sm">
      {/* List Search & Control Pane */}
      <div className="w-96 flex flex-col border-r bg-card/30">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <InboxIcon className="h-5 w-5 text-primary" />
              Inbox
            </h1>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={fetchEmails}>
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communications..."
              className="pl-9 bg-background/50 border-none shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="cursor-pointer bg-primary/10 text-primary border-primary/20">All</Badge>
            <Badge variant="outline" className="cursor-pointer text-muted-foreground hover:bg-muted/50 transition-colors">Unassigned</Badge>
            <Badge variant="outline" className="cursor-pointer text-muted-foreground hover:bg-muted/50 transition-colors">New</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-8 text-center space-y-2">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Syncing Mails...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="h-12 w-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                <MailIcon className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No messages found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-primary/5 transition-all relative border-l-4",
                    selectedId === email.id ? "bg-primary/10 border-primary shadow-inner" : "border-transparent",
                    email.status === 'new' && "font-bold"
                  )}
                  onClick={() => setSelectedId(email.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-tighter truncate w-40">
                      {email.contact_name || email.contact_email || "Anonymous Sender"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h4 className="text-sm tracking-tight truncate mb-1">{email.subject}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                    {email.latest_message || "No content available."}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize bg-background/50">
                      {email.priority}
                    </Badge>
                    {email.status === 'new' && (
                      <Badge className="text-[10px] py-0 px-1.5 bg-blue-500 hover:bg-blue-600">New</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail Content Pane */}
      <div className="flex-1 flex flex-col bg-background/30">
        {selectedId ? (
          detailLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Decrypting Secure Message...</p>
            </div>
          ) : detail ? (
            <>
              <div className="p-4 border-b flex items-center justify-between bg-card/20 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold tracking-tight">{detail.subject}</h2>
                    <p className="text-xs text-muted-foreground font-medium">Interaction ID: {detail.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2 border-red-500/20">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {detail.messages.map((msg, i) => (
                    <div key={msg.id} className="group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                            {msg.sender.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight">{msg.sender}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              via Inbound Gateway • {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Star className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-card border shadow-sm rounded-2xl p-6 text-sm leading-relaxed text-foreground/90 font-medium whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      {i < detail.messages.length - 1 && (
                        <div className="flex justify-center my-4">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold bg-background py-0">Previous Message</Badge>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Quick Action Area */}
                  <div className="pt-8 pb-12">
                    <Card className="border-dashed border-2 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
                      <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Reply className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold tracking-tight">Click to compose a reply</p>
                          <p className="text-xs text-muted-foreground font-medium">Send an official response to this lead/contact.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-2">
                            <Reply className="h-4 w-4" /> Reply
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Forward className="h-4 w-4" /> Forward
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-12 text-center">
               <AlertCircle className="h-12 w-12 text-red-500/50" />
               <p className="text-sm font-bold text-muted-foreground">CRITICAL ERROR: Failed to load message detail.</p>
               <Button variant="outline" size="sm" onClick={() => setSelectedId(selectedId)}>Retry Handshake</Button>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-40">
            <div className="relative">
               <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
               <MailIcon className="h-24 w-24 text-primary relative" />
            </div>
            <div className="text-center max-w-xs">
              <h3 className="text-lg font-bold tracking-tighter uppercase mb-2">Select a transmission</h3>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest leading-loose">
                Pick a communication packet from the terminal on the left to initialize visual decryption.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
