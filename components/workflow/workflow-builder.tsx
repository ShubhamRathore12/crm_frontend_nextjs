"use client";

import { useCallback } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  OnConnect,
  NodeTypes,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import {
  Play,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  User,
  Bell,
  CheckCircle,
  Globe,
} from "lucide-react";

// Human-readable operator labels for the condition summary shown on the node.
const OPERATOR_LABEL: Record<string, string> = {
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

function conditionSummary(cfg: any): string {
  if (!cfg) return "Set condition…";
  if (cfg.field) {
    const op = OPERATOR_LABEL[cfg.operator] ?? cfg.operator ?? "=";
    const needsValue = !["is_empty", "is_not_empty"].includes(cfg.operator);
    return `${cfg.field} ${op}${needsValue ? ` ${cfg.value ?? "…"}` : ""}`.trim();
  }
  return cfg.condition || "Set condition…";
}

// ── Custom Node Components ───────────────────────────────────────────────────
const TriggerNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2.5 shadow-md rounded-lg bg-green-500/15 border-2 border-green-500/50 min-w-[160px]">
    <div className="flex items-center gap-2">
      <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
      <div className="font-semibold text-green-700 dark:text-green-300">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: "#22c55e" }} className="w-3 h-3" />
  </div>
);

// If / Else node — two source handles: green = TRUE branch, red = FALSE branch.
const ConditionNode = ({ data }: { data: any }) => {
  const cfg = data.config || {};
  return (
    <div className="relative px-4 py-3 shadow-md rounded-lg bg-amber-500/15 border-2 border-amber-500/50 min-w-[190px]">
      <Handle type="target" position={Position.Top} style={{ background: "#f59e0b" }} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <div className="font-semibold text-amber-700 dark:text-amber-300">{data.label || "If / Else"}</div>
      </div>
      <div className="mt-1 text-[11px] font-mono text-amber-700/80 dark:text-amber-200/80 truncate max-w-[210px]">
        {conditionSummary(cfg)}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide">
        <span className="text-green-600 dark:text-green-400">{cfg.true_path || "True"}</span>
        <span className="text-red-600 dark:text-red-400">{cfg.false_path || "False"}</span>
      </div>
      <Handle
        id="true"
        type="source"
        position={Position.Bottom}
        style={{ left: "25%", background: "#22c55e" }}
        className="w-3 h-3"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Bottom}
        style={{ left: "75%", background: "#ef4444" }}
        className="w-3 h-3"
      />
    </div>
  );
};

const ActionNode = ({ data }: { data: any }) => {
  const getIcon = (actionType: string) => {
    switch (actionType) {
      case "send_email": return <Mail className="h-4 w-4" />;
      case "send_sms": return <MessageSquare className="h-4 w-4" />;
      case "create_task": return <CheckCircle className="h-4 w-4" />;
      case "assign": return <User className="h-4 w-4" />;
      case "notification": return <Bell className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  return (
    <div className="px-4 py-2.5 shadow-md rounded-lg bg-blue-500/15 border-2 border-blue-500/50 min-w-[160px]">
      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
        {getIcon(data.actionType)}
        <div className="font-semibold">{data.label}</div>
      </div>
      <Handle type="target" position={Position.Top} style={{ background: "#3b82f6" }} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} style={{ background: "#3b82f6" }} className="w-3 h-3" />
    </div>
  );
};

const DelayNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2.5 shadow-md rounded-lg bg-purple-500/15 border-2 border-purple-500/50 min-w-[160px]">
    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
      <Clock className="h-4 w-4" />
      <div className="font-semibold">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} style={{ background: "#a855f7" }} className="w-3 h-3" />
    <Handle type="source" position={Position.Bottom} style={{ background: "#a855f7" }} className="w-3 h-3" />
  </div>
);

const WebhookNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2.5 shadow-md rounded-lg bg-orange-500/15 border-2 border-orange-500/50 min-w-[160px]">
    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
      <Globe className="h-4 w-4" />
      <div className="font-semibold">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} style={{ background: "#f97316" }} className="w-3 h-3" />
    <Handle type="source" position={Position.Bottom} style={{ background: "#f97316" }} className="w-3 h-3" />
  </div>
);

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  delay: DelayNode,
  webhook: WebhookNode,
};

interface WorkflowBuilderProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeClick?: (node: Node) => void;
}

export function WorkflowBuilder({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}: WorkflowBuilderProps) {
  // Connecting from a condition's true/false handle colors + labels the edge so
  // the if/else routing is visible, and records the branch in edge.data.
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const handle = connection.sourceHandle;
      const isTrue = handle === "true";
      const isFalse = handle === "false";
      const stroke = isTrue ? "#22c55e" : isFalse ? "#ef4444" : "#94a3b8";
      const edge: Edge = {
        ...(connection as any),
        animated: true,
        label: isTrue ? "true" : isFalse ? "false" : undefined,
        labelStyle: { fontSize: 10, fontWeight: 700, fill: stroke },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        style: { stroke, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        data: { branch: handle ?? null },
      };
      onEdgesChange(addEdge(edge, edges));
    },
    [edges, onEdgesChange]
  );

  const getDefaultConfig = (type: string, actionType?: string) => {
    switch (type) {
      case "action":
        switch (actionType) {
          case "send_email": return { subject: "", body: "", template: "welcome" };
          case "send_sms": return { message: "", provider: "twilio" };
          case "create_task": return { title: "", assign_to: "", priority: "medium" };
          case "assign": return { assign_to: "", round_robin: false };
          case "notification": return { message: "", type: "info" };
          default: return {};
        }
      case "delay":
        return { seconds: 3600, type: "fixed" };
      case "condition":
        return { field: "lead.status", operator: "eq", value: "new", true_path: "Yes", false_path: "No" };
      case "webhook":
        return { url: "", method: "POST", headers: {} };
      default:
        return {};
    }
  };

  const addNode = useCallback(
    (type: string, label: string, actionType?: string) => {
      const id = `${type}_${Date.now()}`;
      const newNode: Node = {
        id,
        type,
        position: { x: 250 + Math.random() * 200, y: 100 + Math.random() * 300 },
        data: { label, actionType, config: getDefaultConfig(type, actionType) },
      };
      onNodesChange([...nodes, newNode]);
    },
    [nodes, onNodesChange]
  );

  const paletteBtn = "w-full justify-start h-8 text-xs";

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      <div className="w-64 border-r border-border bg-muted/30 p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className="font-medium text-sm mb-3">Node Palette</h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Triggers</label>
              <div className="mt-1 space-y-1">
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("trigger", "Lead Created")}>
                  <Play className="h-3 w-3 mr-2 text-green-500" /> Lead Created
                </Button>
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("trigger", "Interaction Created")}>
                  <Play className="h-3 w-3 mr-2 text-green-500" /> Interaction Created
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Logic</label>
              <div className="mt-1 space-y-1">
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("condition", "If / Else")}>
                  <GitBranch className="h-3 w-3 mr-2 text-amber-500" /> If / Else Condition
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</label>
              <div className="mt-1 space-y-1">
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("action", "Send Email", "send_email")}>
                  <Mail className="h-3 w-3 mr-2 text-blue-500" /> Send Email
                </Button>
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("action", "Send SMS", "send_sms")}>
                  <MessageSquare className="h-3 w-3 mr-2 text-blue-500" /> Send SMS
                </Button>
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("action", "Create Task", "create_task")}>
                  <CheckCircle className="h-3 w-3 mr-2 text-blue-500" /> Create Task
                </Button>
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("action", "Assign Agent", "assign")}>
                  <User className="h-3 w-3 mr-2 text-blue-500" /> Assign Agent
                </Button>
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("action", "Send Notification", "notification")}>
                  <Bell className="h-3 w-3 mr-2 text-blue-500" /> Notification
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Flow Control</label>
              <div className="mt-1 space-y-1">
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("delay", "Wait 1 Hour")}>
                  <Clock className="h-3 w-3 mr-2 text-purple-500" /> Delay
                </Button>
                <Button variant="outline" size="sm" className={paletteBtn} onClick={() => addNode("webhook", "Call API")}>
                  <Globe className="h-3 w-3 mr-2 text-orange-500" /> Webhook
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-2">Tips:</p>
            <ul className="space-y-1">
              <li>• Click a node to configure it</li>
              <li>• Drag from a handle to connect</li>
              <li>• If/Else has green (true) &amp; red (false) outputs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => onNodesChange(applyNodeChanges(changes, nodes))}
          onEdgesChange={(changes) => onEdgesChange(applyEdgeChanges(changes, edges))}
          onConnect={onConnect}
          onNodeClick={(_, node) => onNodeClick?.(node)}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case "trigger": return "#22c55e";
                case "condition": return "#f59e0b";
                case "action": return "#3b82f6";
                case "delay": return "#a855f7";
                case "webhook": return "#f97316";
                default: return "#94a3b8";
              }
            }}
          />
          <Controls />
          <Background color="#94a3b8" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
