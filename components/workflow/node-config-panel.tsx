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

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="condition-expression">Condition Expression</Label>
              <Input
                id="condition-expression"
                value={node.data.config.condition || ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                placeholder="lead.status == 'new'"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use format: field == "value" or field != "value"
              </p>
            </div>
            <div>
              <Label htmlFor="true-path">True Path Label</Label>
              <Input
                id="true-path"
                value={node.data.config.true_path || 'Yes'}
                onChange={(e) => handleConfigChange('true_path', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="false-path">False Path Label</Label>
              <Input
                id="false-path"
                value={node.data.config.false_path || 'No'}
                onChange={(e) => handleConfigChange('false_path', e.target.value)}
              />
            </div>
          </div>
        );

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
      case 'trigger': return 'bg-green-100 text-green-800 border-green-300';
      case 'condition': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'action': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delay': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'webhook': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="w-80 border-l bg-gray-50">
      <Card className="h-full rounded-none border-0 border-l">
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
