"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export default function CanvasPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch topics: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTopics(data);
        
        // Transform DB topics into React Flow nodes
        const loadedNodes: Node[] = data.map((t: any) => ({
          id: t.id,
          position: { x: t.positionX || Math.random() * 200, y: t.positionY || Math.random() * 200 },
          data: { label: t.title },
          className: "bg-white border-2 border-gray-200 rounded-lg p-3 shadow-sm min-w-[150px] max-w-[250px] text-sm break-words",
        }));
        setNodes(loadedNodes);

        // Transform DB parent-child relations into React Flow edges
        const loadedEdges: Edge[] = data
          .filter((t: any) => t.parentId)
          .map((t: any) => ({
            id: `e-${t.parentId}-${t.id}`,
            source: t.parentId,
            target: t.id,
            animated: true,
            className: "custom-edge",
          }));
        setEdges(loadedEdges);
      })
      .catch((err) => {
        console.error("[CanvasPage] Failed to load topics:", err);
      });
  }, [setNodes, setEdges]);

  // Handle saving new position when user drags a node
  const onNodeDragStop = useCallback(
    async (_: any, node: Node) => {
      await fetch(`/api/topics/${node.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionX: node.position.x, positionY: node.position.y }),
      });
    },
    []
  );

  // Handle connecting two nodes
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      
      setEdges((eds) => addEdge({ ...params, animated: true, className: "custom-edge" }, eds));
      
      // Update the DB to reflect the new parent (source)
      await fetch(`/api/topics/${params.target}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: params.source }),
      });
    },
    [setEdges]
  );

  // Handle deleting edges
  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        // Update the DB to remove the parent relation
        await fetch(`/api/topics/${edge.target}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: "null" }),
        });
      }
    },
    []
  );

  return (
    <div className="h-[80vh] w-full flex flex-col relative animate-in fade-in">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700">
          <ArrowLeft size={16} className="mr-1" /> ダッシュボードに戻る
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <h2 className="text-2xl font-bold">思考キャンバス</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            ノードをドラッグして線を繋ごう。線を選択してDeleteキーで削除できます。
          </span>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeDragStop={onNodeDragStop}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={16} size={1} color="#e5e7eb" />
        </ReactFlow>
      </div>
    </div>
  );
}
