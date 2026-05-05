import { Handle, Position, useReactFlow, getOutgoers, Node, Edge, useNodeConnections } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

type TopicNodeData = {
  title: string;
  color: string;
  contrastColor: string;
  categoryName?: string;
  isExpanded?: boolean;
  [key: string]: unknown;
};

export default function TopicNode({ id, data }: { id: string, data: TopicNodeData }) {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  
  const isExpanded = data.isExpanded !== false;
  
  // Automatically re-render component when connections change
  const connections = useNodeConnections({ handleType: 'source' });
  const hasChildren = connections.length > 0;

  const toggleExpand = () => {
    const nodes = getNodes();
    const edges = getEdges();
    const currentNode = nodes.find(n => n.id === id);
    if (!currentNode) return;

    const hiding = isExpanded;
    const newIsExpanded = !isExpanded;

    const getTargetDescendants = (node: Node, allNodes: Node[], allEdges: Edge[], isHiding: boolean) => {
      let descendants: Node[] = [];
      const outgoers = getOutgoers(node, allNodes, allEdges);
      
      outgoers.forEach((outgoer) => {
        descendants.push(outgoer);
        
        // 隠す目的の場合は無条件で再帰し、開く目的の場合は子ノード自身が「開いている状態」の場合のみ再帰する
        const outgoerExpanded = outgoer.data.isExpanded !== false;
        if (isHiding || outgoerExpanded) {
          descendants = descendants.concat(getTargetDescendants(outgoer, allNodes, allEdges, isHiding));
        }
      });
      return descendants;
    };

    const targetDescendants = getTargetDescendants(currentNode, nodes, edges, hiding);
    const targetIds = new Set(targetDescendants.map(n => n.id));

    // ノード自身の開閉状態と、関係する子孫ノードのhidden状態を同時に更新
    setNodes(nodes.map(node => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, isExpanded: newIsExpanded } };
      }
      if (targetIds.has(node.id)) {
        return { ...node, hidden: hiding };
      }
      return node;
    }));

    setEdges(edges.map(edge => {
      if (targetIds.has(edge.target)) {
        return { ...edge, hidden: hiding };
      }
      return edge;
    }));
  };

  return (
    <div 
      className="bg-white border-2 rounded-lg p-3 shadow-sm min-w-[150px] max-w-[250px] text-sm break-words relative transition-colors duration-200"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center justify-between w-full min-h-[24px]">
          {data.categoryName ? (
            <span 
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-90" 
              style={{ backgroundColor: data.color, color: data.contrastColor }}
            >
              {data.categoryName}
            </span>
          ) : (
             <div /> // spacer
          )}
          
          {hasChildren && (
            <button 
              onClick={toggleExpand} 
              className="p-1 -mr-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              title={isExpanded ? "子ノードを隠す" : "子ノードを表示する"}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>
        <span className="mt-1 font-medium text-gray-800">{data.title}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}