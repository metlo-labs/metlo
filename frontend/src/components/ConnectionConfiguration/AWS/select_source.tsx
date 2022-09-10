import {
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react"
import { AWS_SOURCE_TYPE } from "@common/enums"
import { useState } from "react"

interface KeySetupInterface {
  complete: (params: Record<string, any>) => void
}

const SelectMirrorSourceAWS: React.FC<KeySetupInterface> = ({ complete }) => {
  const [instanceID, setInstanceId] = useState("")
  const [networkInterfaceID, setNetworkInterfaceID] = useState<string>("")

  return (
    <VStack
      divider={
        <HStack
          w={"full"}
          borderBottomWidth={"0px"}
          wrap={"nowrap"}
          border={"none"}
        >
          <Divider color={"chakra-border-color"} />
          <Box>OR</Box>
          <Divider color={"chakra-border-color"} />
        </HStack>
      }
      w={"full"}
    >
      <Grid
        templateColumns="repeat(3, 1fr)"
        templateRows="repeat(2,1fr)"
        gap={4}
        py={4}
        pr={4}
        w={"full"}
      >
        <GridItem colSpan={1}>
          <Box>EC2 Source Instance ID</Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box>
            <Input
              onChange={e => setInstanceId(e.target.value)}
              value={instanceID}
            />
          </Box>
        </GridItem>
        <GridItem w={"full"} colSpan={3}>
          <Flex justifyContent={"flex-end"} my={4}>
            <Button
              onClick={() =>
                complete({
                  mirror_source_id: instanceID,
                  source_type: AWS_SOURCE_TYPE.INSTANCE,
                })
              }
              disabled={!instanceID}
            >
              Next Step
            </Button>
          </Flex>
        </GridItem>
      </Grid>
      <Grid
        templateColumns="repeat(3, 1fr)"
        templateRows="repeat(2,1fr)"
        gap={4}
        py={4}
        pr={4}
        w={"full"}
      >
        <GridItem colSpan={1}>
          <Box>EC2 Network Interface ID</Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box>
            <Input
              onChange={e => setNetworkInterfaceID(e.target.value)}
              value={networkInterfaceID}
            />
          </Box>
        </GridItem>
        <GridItem w={"full"} colSpan={3}>
          <Flex justifyContent={"flex-end"} my={4}>
            <Button
              onClick={() =>
                complete({
                  mirror_source_id: networkInterfaceID,
                  source_type: AWS_SOURCE_TYPE.NETWORK_INTERFACE,
                })
              }
              disabled={!networkInterfaceID}
            >
              Next Step
            </Button>
          </Flex>
        </GridItem>
      </Grid>
    </VStack>
  )
}
export default SelectMirrorSourceAWS
