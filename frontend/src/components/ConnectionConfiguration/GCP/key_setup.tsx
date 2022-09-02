import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"

interface KeySetupInterface {
  complete: (params: Record<string, any>) => void
  name: string
  setName: (name: string) => void
}

const KeySetup: React.FC<KeySetupInterface> = ({ complete, name, setName }) => {
  const [key, setKey] = useState(``)
  const [project, setProject] = useState("")
  const [zone, setZone] = useState("")
  const [network, setNetwork] = useState("")

  return (
    <VStack gap={4} py={4} pr={4}>
      <HStack w={"full"}>
        <Box w={"full"}>
          <Box>Connection Name</Box>
        </Box>
        <Box w={"full"}>
          <Box>
            <Input onChange={e => setName(e.target.value)} value={name} />
          </Box>
        </Box>
      </HStack>
      <HStack w={"full"}>
        <Box w={"full"}>
          <Box>Project</Box>
        </Box>
        <Box w={"full"}>
          <Box>
            <Input onChange={e => setProject(e.target.value)} value={project} />
          </Box>
        </Box>
      </HStack>
      <HStack w={"full"}>
        <Box w={"full"}>
          <Box>Network Name</Box>
        </Box>
        <Box w={"full"}>
          <Box>
            <Input onChange={e => setNetwork(e.target.value)} value={network} />
          </Box>
        </Box>
      </HStack>
      <HStack w={"full"}>
        <Box w={"full"}>
          <Box>Zone</Box>
        </Box>
        <Box w={"full"}>
          <Box>
            <Input onChange={e => setZone(e.target.value)} value={zone} />
          </Box>
        </Box>
      </HStack>
      <HStack w={"full"}>
        <Box w={"full"}>
          <Box>Key File</Box>
        </Box>
        <Box w={"full"}>
          <Box>
            <Textarea onChange={e => setKey(e.target.value)} value={key} />
          </Box>
        </Box>
      </HStack>
      <Box w={"full"}>
        <Flex justifyContent={"flex-end"} my={4}>
          <Button
            onClick={() =>
              complete({
                zone: zone,
                project: project,
                key_file: key,
                network_name: network,
              })
            }
            disabled={!(key && project && zone && network && isValidJSON(key))}
          >
            Next Step
          </Button>
        </Flex>
      </Box>
    </VStack>
  )
}
export default KeySetup

const isValidJSON = keyFile => {
  try {
    return JSON.parse(keyFile) && true
  } catch (err) {
    console.log(err)
    return false
  }
}
