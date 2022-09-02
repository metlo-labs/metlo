import { Box, Button, Flex, Grid, GridItem, Input } from "@chakra-ui/react"
import { useState } from "react"

interface KeySetupInterface {
  complete: (params: Record<string, any>) => void
}

const SourceInstanceID: React.FC<KeySetupInterface> = ({ complete }) => {
  const [instanceName, setInstanceName] = useState("")

  return (
    <Grid
      templateColumns="repeat(3, 1fr)"
      templateRows="repeat(3,1fr)"
      gap={4}
      py={4}
      pr={4}
    >
      <GridItem colSpan={1}>
        <Box>Source GCloud Compute Engine Instance Name</Box>
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
            onClick={() => complete({ source_instance_name: instanceName })}
            disabled={!instanceName}
          >
            Next Step
          </Button>
        </Flex>
      </GridItem>
    </Grid>
  )
}
export default SourceInstanceID
