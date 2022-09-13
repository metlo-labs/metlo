import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Select,
  Spinner,
} from "@chakra-ui/react"
import axios from "axios"
import { useEffect, useState } from "react"
import { getAPIURL } from "~/constants"

interface KeySetupInterface {
  id: string
  complete: (params: Record<string, any>) => void
  isCurrent: boolean
}

const OsSelection: React.FC<KeySetupInterface> = ({
  id,
  complete,
  isCurrent,
}) => {
  const [os_choice, set_choice] = useState("")
  const [OSChoices, setOSChoices] = useState<Array<[string, string]>>(null)

  useEffect(() => {
    if (isCurrent) {
      axios
        .post<Array<[string, string]>>(`/api/v1/setup_connection/aws/os`, {
          id: id,
        })
        .then(res => {
          setOSChoices(res.data)
          if (res.data.length > 0) {
            set_choice(res.data[0][1])
          }
        })
        .catch(err => {})
    }
  }, [isCurrent, id])

  if (OSChoices != null) {
    return (
      <Grid
        templateColumns="repeat(3, 1fr)"
        templateRows="repeat(3,1fr)"
        gap={4}
        py={4}
        pr={4}
      >
        <GridItem colSpan={1}>
          <Box>Source EC2 OS Choices</Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box>
            <Select
              onChange={e => set_choice(e.target.value)}
              value={os_choice}
            >
              {OSChoices.map((v, i) => (
                <option value={v[1]} key={i}>
                  {v[0]}
                </option>
              ))}
            </Select>
          </Box>
        </GridItem>
        <GridItem w={"full"} colSpan={3}>
          <Flex justifyContent={"flex-end"} my={4}>
            <Button
              onClick={() => complete({ ami: os_choice })}
              disabled={!os_choice}
            >
              Next Step
            </Button>
          </Flex>
        </GridItem>
      </Grid>
    )
  }
  return (
    <Flex w={"full"} h={"full"} justify={"center"} mt={8}>
      <Spinner size={"xl"} />
    </Flex>
  )
}
export default OsSelection
