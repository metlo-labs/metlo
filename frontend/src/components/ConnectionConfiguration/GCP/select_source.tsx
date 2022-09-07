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
import { GCP_SOURCE_TYPE } from "@common/enums"
import { useState } from "react"

interface KeySetupInterface {
  complete: (params: Record<string, any>) => void
}

const SelectMirrorSourceGCP: React.FC<KeySetupInterface> = ({ complete }) => {
  const [instanceName, setInstanceName] = useState("")
  const [subnetwork, setSubnetwork] = useState("")
  const [tag, setTag] = useState("")

  return (
    <VStack
      divider={
        <HStack
          w={"full"}
          borderBottomWidth={"0px"}
          wrap={"nowrap"}
          border={"none"}
          m={2}
        >
          <Divider color={"chakra-border-color"} />
          <Box>OR</Box>
          <Divider color={"chakra-border-color"} />
        </HStack>
      }
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
          <Box>Source Compute Instance Name</Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box>
            <Input
              onChange={e => setInstanceName(e.target.value)}
              value={instanceName}
            />
          </Box>
        </GridItem>
        <GridItem w={"full"} colSpan={3}>
          <Flex justifyContent={"flex-end"} my={4}>
            <Button
              onClick={() =>
                complete({
                  mirror_source_value: [instanceName],
                  source_type: GCP_SOURCE_TYPE.INSTANCE,
                })
              }
              disabled={!instanceName}
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
          <Box>Source Subnet Name</Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box>
            <Input
              onChange={e => setSubnetwork(e.target.value)}
              value={subnetwork}
            />
          </Box>
        </GridItem>
        <GridItem w={"full"} colSpan={3}>
          <Flex justifyContent={"flex-end"} my={4}>
            <Button
              onClick={() =>
                complete({
                  mirror_source_value: [subnetwork],
                  source_type: GCP_SOURCE_TYPE.SUBNET,
                })
              }
              disabled={!subnetwork}
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
          <Box>Source Network Tag Names</Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box>
            <Input onChange={e => setTag(e.target.value)} value={tag} />
          </Box>
        </GridItem>
        <GridItem w={"full"} colSpan={3}>
          <Flex justifyContent={"flex-end"} my={4}>
            <Button
              onClick={() =>
                complete({
                  mirror_source_value: [tag],
                  source_type: GCP_SOURCE_TYPE.TAG,
                })
              }
              disabled={!tag}
            >
              Next Step
            </Button>
          </Flex>
        </GridItem>
      </Grid>
    </VStack>
  )
}
export default SelectMirrorSourceGCP
