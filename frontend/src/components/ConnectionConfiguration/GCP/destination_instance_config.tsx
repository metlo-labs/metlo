import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Input,
  Select,
  useToast,
} from "@chakra-ui/react"
import axios from "axios"
import { useEffect, useState } from "react"

interface KeySetupInterface {
  complete: (params: Record<string, any>) => void
  isSelected: boolean
  id: string
}

type osChoiceResp = [description: string, link: string]

const SourceMigConfig: React.FC<KeySetupInterface> = ({
  complete,
  isSelected,
  id,
}) => {
  const [imageTemplateURL, setImageTemplateURL] = useState("")
  const [instanceName, setInstanceName] = useState("")
  const [osChoices, setOSChoices] = useState<Array<osChoiceResp>>([])
  const toast = useToast()

  useEffect(() => {
    if (isSelected) {
      axios
        .post<Array<osChoiceResp>>("/api/v1/setup_connection/gcp/os", {
          id: id,
        })
        .then(os_choice => {
          setOSChoices(os_choice.data)
          setImageTemplateURL(os_choice.data[0][1])
        })
        .catch(err => {
          toast({
            title: "Encountered an error fetching OS Choices",
            description: "Check the console for more details",
          })
          console.warn(err)
        })
    }
  }, [isSelected])

  return (
    <Grid
      templateColumns="repeat(3, 1fr)"
      templateRows="repeat(2, 1fr)"
      gap={4}
      py={4}
      pr={4}
    >
      <GridItem colSpan={1}>
        <Box>Compute Engine Image</Box>
      </GridItem>
      <GridItem colSpan={2}>
        <Box>
          <Select
            value={imageTemplateURL}
            onChange={v => setImageTemplateURL(v.target.value)}
          >
            {osChoices.map((v, i) => {
              return (
                <option key={i} value={v[1]}>
                  {v[0]}
                </option>
              )
            })}
          </Select>
        </Box>
      </GridItem>
      <GridItem colSpan={1}>
        <Box>Compute Engine Instance</Box>
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
                source_image: imageTemplateURL,
                machine_type: instanceName,
              })
            }
            disabled={!(imageTemplateURL && instanceName)}
          >
            Next Step
          </Button>
        </Flex>
      </GridItem>
    </Grid>
  )
}
export default SourceMigConfig
