"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type EmailSend } from "@/lib/api";
import { useEffect, useState } from "react";
import { Calendar, Mail, CheckCircle, Circle } from "lucide-react";

export default function CampaignsPage() {
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [calendlyLink, setCalendlyLink] = useState("");
  const [contactId, setContactId] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [emailSends, setEmailSends] = useState<EmailSend[]>([]);
  const [loadingSends, setLoadingSends] = useState(true);
  const [savedCalendlyLink, setSavedCalendlyLink] = useState<string | null>(null);

  useEffect(() => {
    api.email
      .sends()
      .then((res) => setEmailSends(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(() => setEmailSends([]))
      .finally(() => setLoadingSends(false));

    api.integrations
      .calendlyLink()
      .then((r) => setSavedCalendlyLink(r.link))
      .catch(() => setSavedCalendlyLink(null));
  }, []);

  const sendMeetingInvite = async () => {
    setMessage(null);
    if (!toEmail.trim() || !subject.trim()) {
      setMessage({ type: "err", text: "To email and subject are required." });
      return;
    }
    setSending(true);
    try {
      const res = await api.integrations.meetingInvite({
        to_email: toEmail.trim(),
        subject: subject.trim(),
        body: body.trim(),
        ...(calendlyLink.trim() && { calendly_link: calendlyLink.trim() }),
        ...(contactId.trim() && { contact_id: contactId.trim() }),
      });
      setMessage({ type: "ok", text: res.message });
      setToEmail("");
      setSubject("");
      setBody("");
      setCalendlyLink("");
      const sendsRes = await api.email.sends();
      setEmailSends(Array.isArray(sendsRes) ? sendsRes : (sendsRes as any).data ?? []);
    } catch (e) {
      setMessage({ type: "err", text: (e as Error).message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <p className="text-muted-foreground">Bulk email, meeting invites, and email read tracking</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Arrange meeting
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add the person&apos;s email and send a meeting invite (e.g. with Calendly link). Track when they open the email below.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {savedCalendlyLink && (
            <div className="flex flex-wrap items-center gap-2 rounded border border-border bg-muted/30 p-3">
              <div className="text-sm">
                <span className="font-medium">Saved Calendly link:</span>{" "}
                <span className="text-muted-foreground">{savedCalendlyLink}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(savedCalendlyLink, "_blank", "noopener,noreferrer")}
                >
                  Open Calendly
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(savedCalendlyLink);
                    setMessage({ type: "ok", text: "Calendly link copied." });
                  }}
                >
                  Copy link
                </Button>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">To email *</label>
              <input
                type="email"
                placeholder="contact@example.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact ID (optional)</label>
              <input
                type="text"
                placeholder="UUID if linking to contact"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject *</label>
            <input
              type="text"
              placeholder="Meeting request"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              placeholder="Hi, let's schedule a call..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Calendly (or scheduling) link</label>
            <input
              type="url"
              placeholder="https://calendly.com/your-link"
              value={calendlyLink}
              onChange={(e) => setCalendlyLink(e.target.value)}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
            {savedCalendlyLink && !calendlyLink.trim() && (
              <div className="pt-1">
                <Button type="button" size="sm" variant="outline" onClick={() => setCalendlyLink(savedCalendlyLink)}>
                  Use saved link
                </Button>
              </div>
            )}
          </div>
          {message && (
            <p
              className={
                message.type === "ok"
                  ? "text-sm text-green-600 dark:text-green-400"
                  : "text-sm text-red-600 dark:text-red-400"
              }
            >
              {message.text}
            </p>
          )}
          <Button onClick={sendMeetingInvite} disabled={sending}>
            {sending ? "Sending…" : "Send meeting invite"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email sends — read / not read
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            When the recipient opens the email, the system records it. Below: read = opened, blank = not read yet.
          </p>
        </CardHeader>
        <CardContent>
          {loadingSends ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : emailSends.length === 0 ? (
            <p className="text-muted-foreground">No sent emails yet. Send a meeting invite or single email to see them here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">To</th>
                    <th className="text-left py-2 pr-4">Subject</th>
                    <th className="text-left py-2 pr-4">Read</th>
                    <th className="text-left py-2">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {emailSends.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="py-2 pr-4">{row.to_email}</td>
                      <td className="py-2 pr-4 max-w-[200px] truncate">{row.subject}</td>
                      <td className="py-2 pr-4">
                        {row.read_at ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" /> Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Circle className="h-4 w-4" /> Not read
                          </span>
                        )}
                      </td>
                      <td className="py-2">{new Date(row.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk email campaigns</CardTitle>
          <p className="text-sm text-muted-foreground">Trigger notifications and bulk sends. Use the bulk email API or add a bulk compose UI here.</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">POST /email/bulk with to[], subject, body. Campaigns are listed via GET /email/bulk.</p>
        </CardContent>
      </Card>
    </div>
  );
}
