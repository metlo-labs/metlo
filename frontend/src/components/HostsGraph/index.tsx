import React from "react"
import { VStack } from "@chakra-ui/react"
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"
import { getLayoutedElements } from "./layout"
import { CustomHostNode } from "./node"

export interface HostGraphEdge {
  srcHost: string
  dstHost: string
  numEndpoints: number
}

export interface HostGraphProps {
  hosts: string[]
  edges: HostGraphEdge[]
}

const HostGraph: React.FC<HostGraphProps> = React.memo(params => {
  const connectedHosts = new Set(
    params.edges.map(e => e.srcHost).concat(params.edges.map(e => e.dstHost)),
  )
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    params.hosts
      .filter(e => connectedHosts.has(e))
      .map(e => ({
        id: e,
        data: { label: e },
        position: { x: 0, y: 0 },
        type: "host",
      })),
    params.edges.map((e, i) => ({
      id: i,
      source: e.srcHost,
      target: e.dstHost,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    })),
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  return (
    <VStack w="full" h="full">
      <div style={{ height: "100%", width: "100%" }}>
        <ReactFlow
          nodeTypes={{ host: CustomHostNode }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{
            padding: 0.4,
          }}
        >
          <Background
            style={{ backgroundColor: "#F7FAFC" }}
            color="#A0AEC0"
            variant={BackgroundVariant.Dots}
          />
        </ReactFlow>
      </div>
    </VStack>
  )
})

export default HostGraph
