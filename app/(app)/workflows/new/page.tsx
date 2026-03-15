"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
import { NodeConfigPanel } from "@/components/workflow/node-config-panel";
import { api } from "@/lib/api";
import { ArrowLeft, Save, Play } from "lucide-react";
import Link from "next/link";
import { Node, Edge } from "reactflow";

export default function NewWorkflowPage() {
  const [name, setName] = useState("New workflow");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("lead.created");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "trigger",
      type: "trigger",
      position: { x: 250, y: 50 },
      data: { 
        label: "Lead Created",
        config: { event: "lead.created" }
      },
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([]);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const workflowDefinition = {
        nodes: nodes.map(node => ({
          id: node.id,
          node_type: node.type,
          position: node.position,
          config: node.data.config || {},
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          condition: edge.data?.condition,
        })),
      };

      await api.workflows.create({
        name: name.trim(),
        description: description.trim(),
        category: trigger.trim(),
        definition_json: workflowDefinition,
      });
      setStatus("Workflow saved successfully!");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setStatus("Testing workflow execution...");
    try {
      // Create a test workflow run
      const workflowDefinition = {
        nodes: nodes.map(node => ({
          id: node.id,
          node_type: node.type,
          position: node.position,
          config: node.data.config || {},
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          condition: edge.data?.condition,
        })),
      };

      // First create the workflow
      const workflow = await api.workflows.create({
        name: `Test: ${name.trim()}`,
        description: "Test workflow execution",
        category: trigger.trim(),
        definition_json: workflowDefinition,
      });

      // Then run it with sample data
      await api.workflows.trigger((workflow as any).id, {
        entity_id: "00000000-0000-0000-0000-000000000000",
        entity_type: "lead",
        trigger_data: {
          lead_id: "test-lead-123",
          email: "test@example.com",
          name: "Test User",
          source: "web"
        }
      });

      setStatus("Test workflow executed successfully! Check the backend logs for details.");
    } catch (e) {
      setStatus(`Test failed: ${(e as Error).message}`);
    }
  };

  const handleNodeUpdate = (nodeId: string, config: any) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/workflows">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Create New Workflow</h1>
              <p className="text-sm text-muted-foreground">
                Design automation flows with visual drag-and-drop builder
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={test}>
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Workflow"}
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="border-b bg-gray-50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lead Assignment Flow"
            />
          </div>
          <div>
            <Label htmlFor="workflow-description">Description</Label>
            <Input
              id="workflow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Automatically assign new leads to sales representatives"
            />
          </div>
          <div>
            <Label htmlFor="workflow-trigger">Trigger Event</Label>
            <Select value={trigger} onValueChange={setTrigger}>
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
          <div className="flex items-end">
            {status && (
              <div className={`text-sm p-2 rounded ${
                status.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workflow Builder */}
        <div className="flex-1">
          <WorkflowBuilder
            nodes={nodes}
            edges={edges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
          />
        </div>

        {/* Node Configuration Panel */}
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleNodeUpdate}
        />
      </div>
    </div>
  );
}

