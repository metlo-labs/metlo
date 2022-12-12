import React from "react"
import { Badge, Box, Heading, VStack, Text } from "@chakra-ui/react"
import { Handle, NodeProps, Position } from "reactflow"
import { useRouter } from "next/router"

export type HostNodeData = {
  host: string
  numEndpoints: number
}

export const CustomHostNode = React.memo(
  ({ data }: NodeProps<HostNodeData>) => {
    const router = useRouter()
    return (
      <Box
        bg="white"
        _hover={{ bg: "gray.50" }}
        px="4"
        py="4"
        rounded="md"
        width="350px"
        height="150px"
        borderWidth="2px"
        onClick={() =>
          router.push({
            pathname: "/endpoints",
            query: {
              tab: "list",
              hosts: data.host,
            },
          })
        }
      >
        <VStack alignItems="flex-start">
          <Badge fontSize="xs">Service</Badge>
          <Heading fontSize="md" fontWeight="semibold" fontFamily="mono">
            {data.host}
          </Heading>
          <Text fontSize="sm">
            <strong>{data.numEndpoints}</strong> Endpoints
          </Text>
        </VStack>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </Box>
    )
  },
)
