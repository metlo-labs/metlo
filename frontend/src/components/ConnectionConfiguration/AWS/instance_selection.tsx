import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Select,
  Spinner,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberDecrementStepper,
  NumberIncrementStepper,
  useToast,
} from "@chakra-ui/react"
import { MachineSpecifications } from "@common/types"
import axios, { AxiosError } from "axios"
import { useEffect, useState } from "react"
import { makeToast } from "utils"
import { getAPIURL } from "~/constants"

interface KeySetupInterface {
  id: string
  complete: (params: Record<string, any>) => void
  isCurrent: boolean
  setLoadingState: (x: boolean) => void
}

const InstanceSelection: React.FC<KeySetupInterface> = ({
  id,
  complete,
  isCurrent,
  setLoadingState,
}) => {
  const [instances, setInstances] = useState<Array<string>>(null)
  const [selectedInstance, setSelectedInstance] = useState<string>(null)
  const [selectedInstanceSpecs, setSelectedInstanceSpecs] =
    useState<MachineSpecifications>({
      maxCpu: 4,
      minCpu: 1,
      maxMem: 8,
      minMem: 2,
    })

  const toast = useToast()

  useEffect(() => {
    if (isCurrent) {
      setLoadingState(true)
      axios
        .post<Array<string>>(`${getAPIURL()}/setup_connection/aws/instances`, {
          id: id,
          specs: selectedInstanceSpecs,
        })
        .then(res => {
          setInstances(res.data)
          if (res.data.length > 0) {
            setSelectedInstance(res.data[0])
          }
        })
        .catch((err: AxiosError) => {
          setInstances([])
          setSelectedInstance("")
          toast(makeToast({
            title: "Couldn't fetch EC2 instance matching specs",
            status: "error",
            description: JSON.stringify(err.response.data),
          }, err.response?.status))
        })
        .finally(() => setLoadingState(false))
    }
  }, [selectedInstanceSpecs, toast, isCurrent, id, setLoadingState])

  if (instances != null) {
    return (
      <Grid
        templateColumns="repeat(3, 1fr)"
        templateRows="repeat(3,1fr)"
        gap={4}
        py={4}
        pr={4}
      >
        <GridItem colSpan={1} rowStart={1}>
          <Box>Minimum CPU Count</Box>
        </GridItem>
        <GridItem colSpan={1} rowStart={1}>
          <NumberInput
            defaultValue={2}
            min={0}
            step={0.5}
            max={100}
            onBlur={v =>
              setSelectedInstanceSpecs({
                ...selectedInstanceSpecs,
                minCpu: parseInt(v.target.value),
              })
            }
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </GridItem>
        <GridItem colSpan={1} rowStart={2}>
          <Box>Maximum CPU Count</Box>
        </GridItem>
        <GridItem colSpan={1} rowStart={2}>
          <NumberInput
            defaultValue={8}
            min={0}
            step={0.5}
            max={100}
            onBlur={v =>
              setSelectedInstanceSpecs({
                ...selectedInstanceSpecs,
                maxCpu: parseInt(v.target.value),
              })
            }
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </GridItem>
        <GridItem colSpan={1} rowStart={3}>
          <Box>Minimum Memory Count</Box>
        </GridItem>
        <GridItem colSpan={1} rowStart={3}>
          <NumberInput
            defaultValue={2}
            min={0}
            step={0.5}
            max={100}
            onBlur={v =>
              setSelectedInstanceSpecs({
                ...selectedInstanceSpecs,
                minMem: parseInt(v.target.value),
              })
            }
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </GridItem>
        <GridItem colSpan={1} rowStart={4}>
          <Box>Maximum Memory Count</Box>
        </GridItem>
        <GridItem colSpan={1} rowStart={4}>
          <NumberInput
            defaultValue={8}
            min={0}
            step={0.5}
            max={100}
            onBlur={v =>
              setSelectedInstanceSpecs({
                ...selectedInstanceSpecs,
                maxMem: parseInt(v.target.value),
              })
            }
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </GridItem>
        <GridItem colSpan={1} rowStart={5}>
          <Box>Compatible Instance Types</Box>
        </GridItem>
        <GridItem colSpan={2} rowStart={5}>
          <Box>
            <Select
              onChange={e => setSelectedInstance(e.target.value)}
              value={selectedInstance}
              disabled={instances.length == 0}
            >
              {instances.map((v, i) => (
                <option value={v} key={i}>
                  {v}
                </option>
              ))}
            </Select>
          </Box>
        </GridItem>
        <GridItem w={"full"} colSpan={6}>
          <Flex justifyContent={"flex-end"} my={4}>
            <Button
              onClick={() =>
                complete({ selected_instance_type: selectedInstance })
              }
              disabled={!selectedInstance}
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
export default InstanceSelection
