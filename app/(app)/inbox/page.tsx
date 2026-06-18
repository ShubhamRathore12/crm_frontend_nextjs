"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Search,
  Inbox as InboxIcon,
  Send,
  Star,
  Archive,
  Trash2,
  MoreVertical,
  Reply,
  User,
  RefreshCcw,
  Mail as MailIcon,
  AlertCircle,
  ArrowLeft,
  Video,
  Plus,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api, InboundEmail, InboundEmailDetail } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Folder = "inbox" | "outbox";

export default function InboxPage() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InboundEmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [replyWithMeet, setReplyWithMeet] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "", meet: false });
  const [sending, setSending] = useState(false);

  const [, startTransition] = useTransition();

  const fetchEmails = useCallback(() => {
    setLoading(true);
    startTransition(async () => {
      try {
        const data = folder === "inbox" ? await api.emails.list() : await api.emails.outbox();
        const arr = Array.isArray(data) ? data : (data as any)?.data ?? [];
        setEmails(arr);
      } catch {
        setEmails([]);
      } finally {
        setLoading(false);
      }
    });
  }, [folder]);

  useEffect(() => {
    setSelectedId(null);
    setDetail(null);
    fetchEmails();
  }, [fetchEmails]);

  const loadDetail = useCallback((id: string) => {
    setDetailLoading(true);
    api.emails.detail(id).then(setDetail).finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filteredEmails = emails.filter(e =>
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    setSelectedId(null);
    setDetail(null);
    setReplyText("");
    setReplyWithMeet(false);
  };

  const handleReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await api.emails.reply(selectedId, {
        body: replyText.trim(),
        include_meet_link: replyWithMeet,
      });
      toast.success(res.meet_link ? "Reply sent with Google Meet link" : "Reply sent");
      setReplyText("");
      setReplyWithMeet(false);
      loadDetail(selectedId);
    } catch (e) {
      toast.error((e as Error).message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendMeet = async () => {
    if (!selectedId) return;
    try {
      const res = await api.emails.sendMeetLink(selectedId);
      toast.success("Google Meet link sent");
      navigator.clipboard?.writeText(res.meet_link).catch(() => {});
      loadDetail(selectedId);
    } catch (e) {
      toast.error((e as Error).message || "Failed to send Meet link");
    }
  };

  const handleCompose = async () => {
    if (!compose.to.trim() || !compose.body.trim()) {
      toast.error("Recipient and message are required");
      return;
    }
    setSending(true);
    try {
      await api.emails.send({
        to_email: compose.to.trim(),
        subject: compose.subject.trim() || "(no subject)",
        body: compose.body.trim(),
        include_meet_link: compose.meet,
      });
      toast.success("Email sent");
      setComposeOpen(false);
      setCompose({ to: "", subject: "", body: "", meet: false });
      if (folder === "outbox") fetchEmails();
    } catch (e) {
      toast.error((e as Error).message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-background/50 backdrop-blur-sm">
      {/* List Pane */}
      <div className={cn(
        "w-full md:w-96 flex flex-col border-r bg-card/30",
        selectedId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-3 md:p-4 border-b space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
              <InboxIcon className="h-5 w-5 text-primary" />
              Mailbox
            </h1>
            <div className="flex items-center gap-1">
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setComposeOpen(true)}>
                <Plus className="h-4 w-4" /> Compose
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={fetchEmails}>
                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Folder toggle */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setFolder("inbox")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors",
                folder === "inbox" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <InboxIcon className="h-3.5 w-3.5" /> Inbox
            </button>
            <button
              onClick={() => setFolder("outbox")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors",
                folder === "outbox" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Send className="h-3.5 w-3.5" /> Outbox
            </button>
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
              <p className="text-sm font-medium text-muted-foreground">
                {folder === "inbox" ? "Inbox is empty" : "No sent messages"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    "p-3 md:p-4 cursor-pointer hover:bg-primary/5 transition-all relative border-l-4",
                    selectedId === email.id ? "bg-primary/10 border-primary shadow-inner" : "border-transparent",
                    email.status === 'new' && "font-bold"
                  )}
                  onClick={() => setSelectedId(email.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-tighter truncate max-w-[60%]">
                      {folder === "outbox" && <span className="text-muted-foreground normal-case font-medium">To: </span>}
                      {email.contact_name || email.contact_email || "Anonymous Sender"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-2">
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
                    {email.status === 'replied' && (
                      <Badge className="text-[10px] py-0 px-1.5 bg-green-600 hover:bg-green-700">Replied</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail Pane */}
      <div className={cn(
        "flex-1 flex flex-col bg-background/30",
        selectedId ? "flex" : "hidden md:flex"
      )}>
        {selectedId ? (
          detailLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Message...</p>
            </div>
          ) : detail ? (
            <>
              <div className="p-3 md:p-4 border-b flex items-center justify-between bg-card/20 backdrop-blur-md gap-2">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 shrink-0" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10 shrink-0">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold tracking-tight text-sm md:text-base truncate">{detail.subject}</h2>
                    <p className="text-xs text-muted-foreground font-medium truncate">ID: {detail.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleSendMeet}>
                    <Video className="h-4 w-4 text-primary" />
                    <span className="hidden md:inline">Send Meet link</span>
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2 border-red-500/20"
                    onClick={async () => {
                      try {
                        await api.emails.setStatus(detail.id, "archived");
                        toast.success("Archived");
                        handleBack();
                        fetchEmails();
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 md:p-6">
                <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
                  {detail.messages.map((msg, i) => (
                    <div key={msg.id} className="group">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                            {msg.sender.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold tracking-tight truncate">{msg.sender}</p>
                            <p className="text-[10px] text-muted-foreground font-medium truncate">
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Star className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-card border shadow-sm rounded-xl md:rounded-2xl p-4 md:p-6 text-sm leading-relaxed text-foreground/90 font-medium whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      {i < detail.messages.length - 1 && (
                        <div className="flex justify-center my-3 md:my-4">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold bg-background py-0">Previous Message</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply composer */}
              <div className="border-t bg-card/40 backdrop-blur-md p-3 md:p-4">
                <div className="max-w-3xl mx-auto space-y-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[80px] resize-none bg-background/60"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                      <Checkbox
                        checked={replyWithMeet}
                        onCheckedChange={(c) => setReplyWithMeet(c as boolean)}
                      />
                      <Video className="h-3.5 w-3.5" />
                      Attach Google Meet link
                    </label>
                    <Button size="sm" className="gap-2" onClick={handleReply} disabled={sendingReply || !replyText.trim()}>
                      {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-6 md:p-12 text-center">
               <AlertCircle className="h-12 w-12 text-red-500/50" />
               <p className="text-sm font-bold text-muted-foreground">Failed to load message detail.</p>
               <Button variant="outline" size="sm" onClick={() => loadDetail(selectedId)}>Retry</Button>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-40">
            <div className="relative">
               <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
               <MailIcon className="h-16 w-16 md:h-24 md:w-24 text-primary relative" />
            </div>
            <div className="text-center max-w-xs px-4">
              <h3 className="text-base md:text-lg font-bold tracking-tighter uppercase mb-2">Select a message</h3>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest leading-loose">
                Pick a conversation from the list, or compose a new message.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> New Message
            </DialogTitle>
            <DialogDescription>Send an email from your CRM mailbox.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="to">To</Label>
              <Input
                id="to" type="email" placeholder="recipient@example.com"
                value={compose.to}
                onChange={(e) => setCompose({ ...compose, to: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject" placeholder="Subject"
                value={compose.subject}
                onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body" placeholder="Write your message..."
                className="min-h-[140px] resize-none"
                value={compose.body}
                onChange={(e) => setCompose({ ...compose, body: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
              <Checkbox
                checked={compose.meet}
                onCheckedChange={(c) => setCompose({ ...compose, meet: c as boolean })}
              />
              <Video className="h-4 w-4" />
              Include a Google Meet link
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={sending}>Cancel</Button>
            <Button onClick={handleCompose} disabled={sending || !compose.to.trim() || !compose.body.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
