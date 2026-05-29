import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import dagre from "dagre";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Node,
  type Edge,
  type OnConnect,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X, MessageSquare, Folder, GitBranch, AlertTriangle } from "lucide-react";
import type { FileNode } from "../types/types";

const MAX_PARENTS = 5;

/*  Custom Nodes                                                       */


function ChatNode({ data }: NodeProps) {
  return (
    <div className={`group relative px-5 py-3.5 rounded-2xl border transition-all duration-300 shadow-lg min-w-[160px]
      ${data.isHighlighted
        ? "bg-emerald-500/20 border-emerald-400/60 shadow-emerald-500/20"
        : "bg-zinc-900/90 border-zinc-700/60 hover:border-emerald-400/40 hover:shadow-emerald-500/10"
      }
      backdrop-blur-xl`}
    >
      {/* Invisible tree handles (used by Dagre structural layout) */}
      <Handle type="target" position={Position.Top} id="tree-target" className="opacity-0 w-1 h-1 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} id="tree-source" className="opacity-0 w-1 h-1 pointer-events-none" />

      {/* 4 Amber Dots for Inheriting Context */}
      <Handle type="source" position={Position.Top} id="amber-top" className="w-3! h-3! bg-amber-500! border-2! border-zinc-900! -top-1.5! transition-all hover:bg-amber-400! hover:scale-125! cursor-crosshair" />
      <Handle type="target" position={Position.Top} id="amber-top-target" className="opacity-0 w-3 h-3 absolute top-0 -translate-y-1.5 z-[-1] pointer-events-none" />
      
      <Handle type="source" position={Position.Bottom} id="amber-bottom" className="w-3! h-3! bg-amber-500! border-2! border-zinc-900! -bottom-1.5! transition-all hover:bg-amber-400! hover:scale-125! cursor-crosshair" />
      <Handle type="target" position={Position.Bottom} id="amber-bottom-target" className="opacity-0 w-3 h-3 absolute bottom-0 translate-y-1.5 z-[-1] pointer-events-none" />

      <Handle type="source" position={Position.Left} id="amber-left" className="w-3! h-3! bg-amber-500! border-2! border-zinc-900! -left-1.5! transition-all hover:bg-amber-400! hover:scale-125! cursor-crosshair" />
      <Handle type="target" position={Position.Left} id="amber-left-target" className="opacity-0 w-3 h-3 absolute left-0 -translate-x-1.5 z-[-1] pointer-events-none" />

      <Handle type="source" position={Position.Right} id="amber-right" className="w-3! h-3! bg-amber-500! border-2! border-zinc-900! -right-1.5! transition-all hover:bg-amber-400! hover:scale-125! cursor-crosshair" />
      <Handle type="target" position={Position.Right} id="amber-right-target" className="opacity-0 w-3 h-3 absolute right-0 translate-x-1.5 z-[-1] pointer-events-none" />

      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
          <MessageSquare size={14} className="text-emerald-400" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Chat</span>
          <span className="text-[13px] font-semibold text-zinc-200 truncate max-w-[140px]">
            {data.label as string}
          </span>
        </div>
      </div>
    </div>
  );
}

function FolderNode({ data }: NodeProps) {
  return (
    <div className="px-5 py-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 backdrop-blur-xl shadow-md min-w-[160px]">
      <Handle type="target" position={Position.Top} id="tree-target" className="opacity-0 w-1 h-1 pointer-events-none" />
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/20">
          <Folder size={14} className="text-cyan-400" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Folder</span>
          <span className="text-[13px] font-semibold text-zinc-300 truncate max-w-[140px]">
            {data.label as string}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="tree-source" className="opacity-0 w-1 h-1 pointer-events-none" />
    </div>
  );
}

const nodeTypes = {
  chatNode: ChatNode,
  folderNode: FolderNode,
};


/*  Custom Edges                                                       */


function RemovableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a1a]/95 border border-zinc-700/60 rounded-lg shadow-xl"
        >
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest pl-1">Inherits</span>
          <button
            onClick={() => {
              const edgeData = data as any;
              if (edgeData?.onCancel) {
                edgeData.onCancel(id, edgeData.targetNodeId, edgeData.sourceId);
              }
            }}
            className="p-0.5 ml-1 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/30 text-red-500/80 hover:text-red-400 transition-colors"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = {
  removable: RemovableEdge,
};


/*  Tree → ReactFlow Nodes/Edges                                       */


function flattenTree(
  node: FileNode,
  parentId: string | null,
  nodes: Node[],
  edges: Edge[],
) {
  const isFolder = node.type === "folder";
  const nodeId = node.id;

  nodes.push({
    id: nodeId,
    type: isFolder ? "folderNode" : "chatNode",
    position: { x: 0, y: 0 }, // Position will be set by dagre
    data: { label: node.name, isHighlighted: false },
    draggable: true,
    connectable: !isFolder, // Only chat nodes can be connected
  });

  if (parentId) {
    edges.push({
      id: `tree-${parentId}-${nodeId}`,
      source: parentId,
      sourceHandle: "tree-source",
      target: nodeId,
      targetHandle: "tree-target",
      type: "straight",
      animated: false,
      style: { stroke: "#52525b", strokeWidth: 1.5, strokeDasharray: "4 4", opacity: 0.5 },
      markerEnd: undefined,
    });
  }

  const children = node.children || [];
  children.forEach((child) => {
    flattenTree(child, nodeId, nodes, edges);
  });
}

function parseInheritanceEdges(
  node: FileNode,
  edges: Edge[],
  handleCancelEdge: (edgeId: string, targetNodeId: string) => void
) {
  if (node.type === "chat" && node.contextParents) {
    node.contextParents.forEach((parent) => {
      edges.push({
        id: `inherit-${parent.chatId}-${node.id}`,
        source: parent.chatId,
        target: node.id,
        sourceHandle: parent.sourceHandle,
        targetHandle: parent.targetHandle,
        type: "removable",
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#f59e0b",
          width: 18,
          height: 18,
        },
        data: {
          onCancel: handleCancelEdge,
          targetNodeId: node.id,
          sourceId: parent.chatId, // Store source
          targetId: node.id,   // Store target
        },
      });
    });
  }

  const children = node.children || [];
  children.forEach((child) => {
    parseInheritanceEdges(child, edges, handleCancelEdge);
  });
}

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 80;

  dagreGraph.setGraph({ rankdir: direction, ranksep: 120, nodesep: 60 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    // Only use structural tree edges for the hierarchy calculation, ignore inherit edges
    if (edge.id.startsWith("tree-")) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      // Target handle on top, Source handle on bottom for TB layout
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });

  return { nodes: newNodes, edges };
}


/*  Main Component                                                     */


interface KnowledgeGraphProps {
  folderNode: FileNode;
  onClose: () => void;
  onConnect: (sourceId: string, targetId: string, sourceHandle: string, targetHandle: string) => void;
  onDisconnect: (sourceId: string, targetId: string) => void;
}

export default function KnowledgeGraph(props: KnowledgeGraphProps) {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner {...props} />
    </ReactFlowProvider>
  );
}

function KnowledgeGraphInner({ folderNode, onClose, onConnect, onDisconnect }: KnowledgeGraphProps) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  // 1. Declare state hooks first
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [inheritanceCounts, setInheritanceCounts] = useState<Record<string, number>>({});

  // 2. Stabilize prop callbacks to prevent dependency chains that reset the graph
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  useEffect(() => {
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onConnect, onDisconnect]);

  // 3. Declare callbacks that state hooks rely on
  const handleCancelEdge = useCallback(
    (edgeId: string, targetNodeId: string, sourceId?: string) => {
      // Use direct data passed from the edge instead of searching the state
      if (sourceId && targetNodeId) {
        onDisconnectRef.current(sourceId, targetNodeId);
      }

      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setInheritanceCounts((prev) => ({
        ...prev,
        [targetNodeId]: Math.max(0, (prev[targetNodeId] || 1) - 1),
      }));
    },
    [setEdges]
  );

  // 3. Compute derived state (layout/edges)
  const { initialNodes, initialEdges, initialCounts } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];
    const counts: Record<string, number> = {};

    flattenTree(folderNode, null, n, e);
    parseInheritanceEdges(folderNode, e, handleCancelEdge);
    
    e.forEach(edge => {
      if (edge.id.startsWith("inherit-")) {
        counts[edge.target] = (counts[edge.target] || 0) + 1;
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(n, e, "TB");
    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges, initialCounts: counts };
  }, [folderNode, handleCancelEdge]);

  // 4. Update core state when folderNode/tree changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setInheritanceCounts(initialCounts);
  }, [initialNodes, initialEdges, initialCounts, setNodes, setEdges]);

  const handleConnect: OnConnect = useCallback(
    (params) => {
      // Find both source and target nodes
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      // Only allow chat-to-chat connections
      if (!sourceNode || !targetNode) return;
      if (sourceNode.type !== "chatNode" || targetNode.type !== "chatNode") {
        setConnectionError("Only chat-to-chat connections are allowed.");
        setTimeout(() => setConnectionError(null), 3000);
        return;
      }

      // Prevent self-connection
      if (params.source === params.target) return;

      // Prevent duplicate connections
      const alreadyConnected = edges.some(
        (e) =>
          e.id.startsWith("inherit-") &&
          e.source === params.source &&
          e.target === params.target,
      );
      if (alreadyConnected) {
        setConnectionError("These chats are already connected.");
        setTimeout(() => setConnectionError(null), 3000);
        return;
      }

      // Check max parents limit
      const currentCount = inheritanceCounts[params.target!] || 0;
      if (currentCount >= MAX_PARENTS) {
        setConnectionError(`A chat can inherit from at most ${MAX_PARENTS} other chats.`);
        setTimeout(() => setConnectionError(null), 3000);
        return;
      }

      // Create the inheritance edge
      const newEdge: Edge = {
        ...params,
        id: `inherit-${params.source}-${params.target}`,
        type: "removable",
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#f59e0b",
          width: 18,
          height: 18,
        },
        data: {
          onCancel: handleCancelEdge,
          targetNodeId: params.target,
          sourceId: params.source,
          targetId: params.target,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setInheritanceCounts((prev) => ({
        ...prev,
        [params.target!]: (prev[params.target!] || 0) + 1,
      }));

      // Highlight the target node to give visual feedback
      setNodes((nds) =>
        nds.map((n) =>
          n.id === params.target
            ? { ...n, data: { ...n.data, isHighlighted: true } }
            : n,
        ),
      );

      // Notify parent
      onConnectRef.current(params.source!, params.target!, params.sourceHandle!, params.targetHandle!);
    },
    [nodes, edges, inheritanceCounts, setEdges, setNodes, handleCancelEdge],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      

      if (!connectionState.isValid) {
        const coords =
          "clientX" in event
            ? { x: event.clientX, y: event.clientY }
            : {
                x: (event as TouchEvent).changedTouches?.[0]?.clientX,
                y: (event as TouchEvent).changedTouches?.[0]?.clientY,
              };

        if (coords.x === undefined || coords.y === undefined) return;

        const flowPosition = screenToFlowPosition({ x: coords.x, y: coords.y });

       
        const targetNode = nodes.find((n) => {
          const x = n.position.x;
          const y = n.position.y;
          const w = n.measured?.width || 160;
          const h = n.measured?.height || 60;
          return (
            flowPosition.x >= x &&
            flowPosition.x <= x + w &&
            flowPosition.y >= y &&
            flowPosition.y <= y + h
          );
        });

        if (
          targetNode &&
          targetNode.type === "chatNode" &&
          targetNode.id !== connectionState.fromNodeId
        ) {
          
          const topDist = Math.abs(flowPosition.y - targetNode.position.y);
          const bottomDist = Math.abs(
            flowPosition.y - (targetNode.position.y + (targetNode.measured?.height || 60))
          );
          const leftDist = Math.abs(flowPosition.x - targetNode.position.x);
          const rightDist = Math.abs(
            flowPosition.x - (targetNode.position.x + (targetNode.measured?.width || 160))
          );

          let min = topDist;
          let closestHandle = "amber-top-target";

          if (bottomDist < min) {
            min = bottomDist;
            closestHandle = "amber-bottom-target";
          }
          if (leftDist < min) {
            min = leftDist;
            closestHandle = "amber-left-target";
          }
          if (rightDist < min) {
            min = rightDist;
            closestHandle = "amber-right-target";
          }

          
          handleConnect({
            source: connectionState.fromNodeId,
            sourceHandle: connectionState.fromHandleId,
            target: targetNode.id,
            targetHandle: closestHandle,
          });
        }
      }
    },
    [nodes, screenToFlowPosition, handleConnect]
  );

  // Count inheritance edges
  const inheritEdges = edges.filter((e) => e.id.startsWith("inherit-"));

  return (
    <div className="w-full h-screen flex flex-col bg-(--theme-bg-base) overflow-hidden">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-(--theme-bg-base)/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <GitBranch size={18} className="text-amber-400" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-zinc-100 tracking-tight">
                Knowledge Graph — <span className="text-cyan-400">{folderNode.name}</span>
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                Drag between the <span className="text-amber-400">yellow connection dots</span> on chats to establish inheritance context.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {inheritEdges.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <GitBranch size={12} className="text-amber-400" />
                <span className="text-[11px] font-bold text-amber-300">
                  {inheritEdges.length} connection{inheritEdges.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Error Toast */}
        {connectionError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-[12px] font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
            <AlertTriangle size={14} className="text-red-400" />
            {connectionError}
          </div>
        )}



        {/* Graph Canvas */}



        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onConnectEnd={onConnectEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
            minZoom={0.2}
            maxZoom={2}
            className="bg-transparent"
            proOptions={{ hideAttribution: true }}
            connectionLineStyle={{ stroke: "#f59e0b", strokeWidth: 2 }}
            defaultEdgeOptions={{
              type: "smoothstep",
            }}
          >
            
            <Background color="#333" gap={20} size={1} />
            <Controls
              className="!bg-zinc-900 !border-zinc-800 !rounded-xl !shadow-xl [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-700 [&>button:hover]:!text-white"
            />
            <MiniMap
              nodeColor={(n) => (n.type === "chatNode" ? "#10b981" : "#06b6d4")}
              maskColor="rgba(0,0,0,0.7)"
              className="!bg-zinc-900 !border-zinc-800 !rounded-xl"
            />
            <Panel position="bottom-center" className="mb-4">
              <div className="flex items-center gap-6 px-5 py-2.5 bg-zinc-900/90 border border-zinc-800/60 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500/80 border border-cyan-400/40" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Folder</span>
                </div>
                <div className="w-px h-4 bg-zinc-700" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-amber-400 rounded-full" />
                  <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">Inherits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-zinc-600 rounded-full border-dashed" style={{ borderTop: "2px dashed #52525b" }} />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tree</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
