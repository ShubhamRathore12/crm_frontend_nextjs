"use client";

import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  OnConnect,
  useEdgesState,
  useNodesState,
  NodeTypes,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Mail, 
  MessageSquare, 
  Clock, 
  GitBranch, 
  User, 
  Bell, 
  CheckCircle,
  Globe,
  Plus
} from "lucide-react";

// Custom Node Components
const TriggerNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-300">
    <div className="flex items-center gap-2">
      <Play className="h-4 w-4 text-green-600" />
      <div className="font-medium text-green-800">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
  </div>
);

const ConditionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 border-yellow-300">
    <div className="flex items-center gap-2">
      <GitBranch className="h-4 w-4 text-yellow-600" />
      <div className="font-medium text-yellow-800">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-500" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500" />
  </div>
);

const ActionNode = ({ data }: { data: any }) => {
  const getIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email': return <Mail className="h-4 w-4" />;
      case 'send_sms': return <MessageSquare className="h-4 w-4" />;
      case 'create_task': return <CheckCircle className="h-4 w-4" />;
      case 'assign': return <User className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 border-blue-300">
      <div className="flex items-center gap-2">
        {getIcon(data.actionType)}
        <div className="font-medium text-blue-800">{data.label}</div>
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
};

const DelayNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 border-purple-300">
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-purple-600" />
      <div className="font-medium text-purple-800">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
  </div>
);

const WebhookNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-orange-100 border-2 border-orange-300">
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-orange-600" />
      <div className="font-medium text-orange-800">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500" />
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
}

export function WorkflowBuilder({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange 
}: WorkflowBuilderProps) {
  const [internalNodes, setInternalNodes, internalOnNodesChange] = useNodesState(nodes);
  const [internalEdges, setInternalEdges, internalOnEdgesChange] = useEdgesState(edges);

  React.useEffect(() => {
    onNodesChange(internalNodes);
  }, [internalNodes, onNodesChange]);

  React.useEffect(() => {
    onEdgesChange(internalEdges);
  }, [internalEdges, onEdgesChange]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setInternalEdges((eds) => addEdge(connection, eds)),
    [setInternalEdges]
  );

  const addNode = useCallback((type: string, label: string, actionType?: string) => {
    const id = `${type}_${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { 
        x: 250 + Math.random() * 200, 
        y: 100 + Math.random() * 300 
      },
      data: { 
        label,
        actionType,
        config: getDefaultConfig(type, actionType)
      },
    };
    setInternalNodes((nds) => [...nds, newNode]);
  }, [setInternalNodes]);

  const getDefaultConfig = (type: string, actionType?: string) => {
    switch (type) {
      case 'action':
        switch (actionType) {
          case 'send_email':
            return { subject: '', body: '', template: 'welcome' };
          case 'send_sms':
            return { message: '', provider: 'twilio' };
          case 'create_task':
            return { title: '', assign_to: '', priority: 'medium' };
          case 'assign':
            return { assign_to: '', round_robin: false };
          case 'notification':
            return { message: '', type: 'info' };
          default:
            return {};
        }
      case 'delay':
        return { seconds: 3600, type: 'fixed' };
      case 'condition':
        return { condition: '', true_path: '', false_path: '' };
      case 'webhook':
        return { url: '', method: 'POST', headers: {} };
      default:
        return {};
    }
  };

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      <div className="w-64 border-r bg-gray-50 p-4 space-y-4">
        <div>
          <h3 className="font-medium text-sm mb-3">Node Palette</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Triggers</label>
              <div className="mt-1 space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('trigger', 'Lead Created')}
                >
                  <Play className="h-3 w-3 mr-2 text-green-600" />
                  Lead Created
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('trigger', 'Interaction Created')}
                >
                  <Play className="h-3 w-3 mr-2 text-green-600" />
                  Interaction Created
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Logic</label>
              <div className="mt-1 space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('condition', 'Check Condition')}
                >
                  <GitBranch className="h-3 w-3 mr-2 text-yellow-600" />
                  Condition
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</label>
              <div className="mt-1 space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('action', 'Send Email', 'send_email')}
                >
                  <Mail className="h-3 w-3 mr-2 text-blue-600" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('action', 'Send SMS', 'send_sms')}
                >
                  <MessageSquare className="h-3 w-3 mr-2 text-blue-600" />
                  Send SMS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('action', 'Create Task', 'create_task')}
                >
                  <CheckCircle className="h-3 w-3 mr-2 text-blue-600" />
                  Create Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('action', 'Assign Agent', 'assign')}
                >
                  <User className="h-3 w-3 mr-2 text-blue-600" />
                  Assign Agent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('action', 'Send Notification', 'notification')}
                >
                  <Bell className="h-3 w-3 mr-2 text-blue-600" />
                  Notification
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Flow Control</label>
              <div className="mt-1 space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('delay', 'Wait 1 Hour')}
                >
                  <Clock className="h-3 w-3 mr-2 text-purple-600" />
                  Delay
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => addNode('webhook', 'Call API')}
                >
                  <Globe className="h-3 w-3 mr-2 text-orange-600" />
                  Webhook
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-2">Tips:</p>
            <ul className="space-y-1">
              <li>• Drag nodes to connect</li>
              <li>• Click nodes to configure</li>
              <li>• Save workflow when done</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={internalNodes}
          edges={internalEdges}
          onNodesChange={internalOnNodesChange}
          onEdgesChange={internalOnEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'trigger': return '#86efac';
                case 'condition': return '#fde047';
                case 'action': return '#93c5fd';
                case 'delay': return '#c4b5fd';
                case 'webhook': return '#fed7aa';
                default: return '#e5e7eb';
              }
            }}
          />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
