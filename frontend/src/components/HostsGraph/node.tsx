import React from "react"
import { Badge, Box, Heading, VStack } from "@chakra-ui/react"
import { Handle, NodeProps, Position } from "reactflow"

export type HostNodeData = {
  label: string
}

export const CustomHostNode = React.memo(
  ({ data }: NodeProps<HostNodeData>) => {
    return (
      <Box bg="white" px="4" py="4" rounded="md" width="350px" height="150px" borderWidth="2px">
        <VStack alignItems="flex-start">
          <Badge fontSize="xs">Service</Badge>
          <Heading fontSize="md" fontWeight="semibold" fontFamily="mono">
            {data.label}
          </Heading>
        </VStack>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </Box>
    )
  },
)
