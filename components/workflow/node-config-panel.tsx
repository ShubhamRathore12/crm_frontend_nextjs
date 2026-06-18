"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Settings } from "lucide-react";
import { Node } from "reactflow";

interface NodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, config: any) => void;
}

// Operator symbols for the live condition preview.
const OP_PREVIEW: Record<string, string> = {
  eq: "=",
  neq: "≠",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  contains: "contains",
  not_contains: "does not contain",
  is_empty: "is empty",
  is_not_empty: "is not empty",
};

export function NodeConfigPanel({ node, onClose, onUpdate }: NodeConfigPanelProps) {
  if (!node) return null;

  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = { ...node.data.config, [key]: value };
    onUpdate(node.id, updatedConfig);
  };

  const renderConfigForm = () => {
    switch (node.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="trigger-event">Trigger Event</Label>
              <Select
                value={node.data.config.event || 'lead.created'}
                onValueChange={(value) => handleConfigChange('event', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead.created">Lead Created</SelectItem>
                  <SelectItem value="interaction.created">Interaction Created</SelectItem>
                  <SelectItem value="call.received">Call Received</SelectItem>
                  <SelectItem value="sla.timeout">SLA Timeout</SelectItem>
                  <SelectItem value="deal.stage_changed">Deal Stage Changed</SelectItem>
                  <SelectItem value="contact.updated">Contact Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trigger-filters">Filters (JSON)</Label>
              <Textarea
                id="trigger-filters"
                value={JSON.stringify(node.data.config.filters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const filters = JSON.parse(e.target.value);
                    handleConfigChange('filters', filters);
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                rows={3}
                placeholder='{"source": "web", "priority": "high"}'
              />
            </div>
          </div>
        );

      case 'condition': {
        const cfg = node.data.config || {};
        const operator = cfg.operator || 'eq';
        const noValue = operator === 'is_empty' || operator === 'is_not_empty';
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Build an <span className="font-semibold text-foreground">IF</span> rule. When it matches, the
              flow follows the <span className="text-green-500 font-medium">green (true)</span> branch;
              otherwise the <span className="text-red-500 font-medium">red (false)</span> branch.
            </p>
            <div>
              <Label htmlFor="condition-field">Field</Label>
              <Select
                value={cfg.field || 'lead.status'}
                onValueChange={(value) => handleConfigChange('field', value)}
              >
                <SelectTrigger id="condition-field"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead.status">Lead · Status</SelectItem>
                  <SelectItem value="lead.stage">Lead · Stage</SelectItem>
                  <SelectItem value="lead.source">Lead · Source</SelectItem>
                  <SelectItem value="lead.score">Lead · Score</SelectItem>
                  <SelectItem value="lead.assigned_to">Lead · Owner</SelectItem>
                  <SelectItem value="contact.email">Contact · Email</SelectItem>
                  <SelectItem value="contact.company">Contact · Company</SelectItem>
                  <SelectItem value="interaction.priority">Interaction · Priority</SelectItem>
                  <SelectItem value="interaction.channel">Interaction · Channel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition-operator">Operator</Label>
              <Select value={operator} onValueChange={(value) => handleConfigChange('operator', value)}>
                <SelectTrigger id="condition-operator"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eq">Equals (=)</SelectItem>
                  <SelectItem value="neq">Not equals (≠)</SelectItem>
                  <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                  <SelectItem value="gte">Greater or equal (≥)</SelectItem>
                  <SelectItem value="lt">Less than (&lt;)</SelectItem>
                  <SelectItem value="lte">Less or equal (≤)</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="not_contains">Does not contain</SelectItem>
                  <SelectItem value="is_empty">Is empty</SelectItem>
                  <SelectItem value="is_not_empty">Is not empty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!noValue && (
              <div>
                <Label htmlFor="condition-value">Value</Label>
                <Input
                  id="condition-value"
                  value={cfg.value ?? ''}
                  onChange={(e) => handleConfigChange('value', e.target.value)}
                  placeholder="e.g. new, qualified, 100"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="true-path">True branch label</Label>
                <Input
                  id="true-path"
                  value={cfg.true_path || 'Yes'}
                  onChange={(e) => handleConfigChange('true_path', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="false-path">False branch label</Label>
                <Input
                  id="false-path"
                  value={cfg.false_path || 'No'}
                  onChange={(e) => handleConfigChange('false_path', e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-muted-foreground">
              IF {cfg.field || 'field'} {OP_PREVIEW[operator] ?? operator}{noValue ? '' : ` ${cfg.value || '…'}`}
            </div>
          </div>
        );
      }

      case 'action':
        const actionType = node.data.actionType;
        
        if (actionType === 'send_email') {
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={node.data.config.subject || ''}
                  onChange={(e) => handleConfigChange('subject', e.target.value)}
                  placeholder="Welcome to our service!"
                />
              </div>
              <div>
                <Label htmlFor="email-body">Body</Label>
                <Textarea
                  id="email-body"
                  value={node.data.config.body || ''}
                  onChange={(e) => handleConfigChange('body', e.target.value)}
                  rows={4}
                  placeholder="Dear {{name}}, thank you for your interest..."
                />
              </div>
              <div>
                <Label htmlFor="email-template">Template</Label>
                <Select
                  value={node.data.config.template || 'welcome'}
                  onValueChange={(value) => handleConfigChange('template', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }
        
        if (actionType === 'send_sms') {
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sms-message">Message</Label>
                <Textarea
                  id="sms-message"
                  value={node.data.config.message || ''}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  rows={3}
                  placeholder="Hi {{name}}, thanks for contacting us!"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {"Use {{field_name}} for dynamic content"}
                </p>
              </div>
              <div>
                <Label htmlFor="sms-provider">Provider</Label>
                <Select
                  value={node.data.config.provider || 'twilio'}
                  onValueChange={(value) => handleConfigChange('provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="aws-sns">AWS SNS</SelectItem>
                    <SelectItem value="messagebird">MessageBird</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }
        
        if (actionType === 'create_task') {
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  value={node.data.config.title || ''}
                  onChange={(e) => handleConfigChange('title', e.target.value)}
                  placeholder="Follow up with lead"
                />
              </div>
              <div>
                <Label htmlFor="task-assign">Assign To</Label>
                <Input
                  id="task-assign"
                  value={node.data.config.assign_to || ''}
                  onChange={(e) => handleConfigChange('assign_to', e.target.value)}
                  placeholder="agent@company.com"
                />
              </div>
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={node.data.config.priority || 'medium'}
                  onValueChange={(value) => handleConfigChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }
        
        if (actionType === 'assign') {
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="assign-to">Assign To</Label>
                <Input
                  id="assign-to"
                  value={node.data.config.assign_to || ''}
                  onChange={(e) => handleConfigChange('assign_to', e.target.value)}
                  placeholder="sales@company.com"
                />
              </div>
              <div>
                <Label htmlFor="round-robin">Assignment Strategy</Label>
                <Select
                  value={node.data.config.round_robin ? 'round_robin' : 'direct'}
                  onValueChange={(value) => handleConfigChange('round_robin', value === 'round_robin')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct Assignment</SelectItem>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }
        
        if (actionType === 'notification') {
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  value={node.data.config.message || ''}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  rows={3}
                  placeholder="New lead assigned to you!"
                />
              </div>
              <div>
                <Label htmlFor="notification-type">Type</Label>
                <Select
                  value={node.data.config.type || 'info'}
                  onValueChange={(value) => handleConfigChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }
        
        return <p className="text-muted-foreground">No configuration available for this action type.</p>;

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="delay-seconds">Delay Duration (seconds)</Label>
              <Input
                id="delay-seconds"
                type="number"
                value={node.data.config.seconds || 3600}
                onChange={(e) => handleConfigChange('seconds', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="delay-type">Delay Type</Label>
              <Select
                value={node.data.config.type || 'fixed'}
                onValueChange={(value) => handleConfigChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Duration</SelectItem>
                  <SelectItem value="business_hours">Business Hours Only</SelectItem>
                  <SelectItem value="working_days">Working Days Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">URL</Label>
              <Input
                id="webhook-url"
                value={node.data.config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                placeholder="https://api.example.com/webhook"
              />
            </div>
            <div>
              <Label htmlFor="webhook-method">Method</Label>
              <Select
                value={node.data.config.method || 'POST'}
                onValueChange={(value) => handleConfigChange('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="webhook-headers">Headers (JSON)</Label>
              <Textarea
                id="webhook-headers"
                value={JSON.stringify(node.data.config.headers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    handleConfigChange('headers', headers);
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                rows={3}
                placeholder='{"Authorization": "Bearer token"}'
              />
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">No configuration available for this node type.</p>;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40';
      case 'condition': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40';
      case 'action': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40';
      case 'delay': return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40';
      case 'webhook': return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="w-80 border-l border-border bg-card">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <CardTitle className="text-lg">Node Configuration</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={getNodeColor(node.type || '')}>
              {node.type?.toUpperCase()}
            </Badge>
            <span className="font-medium">{node.data.label}</span>
          </div>
          
          {renderConfigForm()}
        </CardContent>
      </Card>
    </div>
  );
}
