import { CloseIcon } from "@chakra-ui/icons"
import {
  Grid,
  GridItem,
  IconButton,
  Input,
  Select,
  Spinner,
  VStack,
  Box,
  Wrap,
  Flex,
  Button,
  HStack,
} from "@chakra-ui/react"
import { protocols } from "@common/enums"
import { TrafficFilterRuleSpecs } from "@common/types"
import { useEffect, useState } from "react"

interface GenericStepAWSInterface {
  id: string
  complete: (params: Record<string, any>) => void
  isCurrent: boolean
}

const update_attribute = (
  data: Array<TrafficFilterRuleSpecs>,
  attribute_name,
  change_at,
  change_to,
) => {
  return data.map((v, idx) => {
    if (idx === change_at) {
      v[attribute_name] = change_to
      return v
    }
    return v
  })
}

const SetupRulesFilter: React.FC<GenericStepAWSInterface> = ({
  id,
  complete,
  isCurrent,
}) => {
  const [rules, updateRules] = useState<Array<TrafficFilterRuleSpecs>>([
    {
      destination_CIDR: "0.0.0.0/0",
      source_CIDR: "0.0.0.0/0",
      destination_port: "",
      source_port: "",
      direction: "in",
      protocol: protocols.TCP,
    },
  ])
  return (
    <Flex direction={"column"} gap={8}>
      <Box>Add Rules for mirroring data</Box>
      <Grid gap={4}>
        {rules.map((v, i) => (
          <GridItem key={i}>
            <Grid
              templateColumns={{ lg: "repeat(6,1fr)", sm: "repeat(4,1fr)" }}
              templateRows={{ lg: "repeat(1,1fr)", sm: "repeat(2,1fr)" }}
              gap={2}
            >
              <GridItem rowStart={{ lg: 1, sm: 1 }}>
                <VStack>
                  <GridItem>Destination CIDR</GridItem>
                  <Input
                    value={rules[i].destination_CIDR}
                    onChange={v => {
                      updateRules(
                        update_attribute(
                          rules,
                          "destination_CIDR",
                          i,
                          v.target.value,
                        ),
                      )
                    }}
                  />
                </VStack>
              </GridItem>
              <GridItem rowStart={{ lg: 1, sm: 1 }}>
                <VStack>
                  <GridItem>Source CIDR</GridItem>
                  <Input
                    value={rules[i].source_CIDR}
                    onChange={v => {
                      updateRules(
                        update_attribute(
                          rules,
                          "source_CIDR",
                          i,
                          v.target.value,
                        ),
                      )
                    }}
                  />
                </VStack>
              </GridItem>
              <GridItem rowStart={{ lg: 1, sm: 1 }}>
                <VStack>
                  <GridItem>Destination Port</GridItem>
                  <Input
                    value={rules[i].destination_port}
                    onChange={v => {
                      updateRules(
                        update_attribute(
                          rules,
                          "destination_port",
                          i,
                          v.target.value,
                        ),
                      )
                    }}
                  />
                </VStack>
              </GridItem>
              <GridItem rowStart={{ lg: 1, sm: 2 }}>
                <VStack>
                  <GridItem>Source Port</GridItem>
                  <Input
                    value={rules[i].source_port}
                    onChange={v => {
                      updateRules(
                        update_attribute(
                          rules,
                          "source_port",
                          i,
                          v.target.value,
                        ),
                      )
                    }}
                  />
                </VStack>
              </GridItem>
              <GridItem rowStart={{ lg: 1, sm: 2 }}>
                <VStack>
                  <GridItem>Traffic Direction</GridItem>
                  <Select
                    value={rules[i].direction}
                    onChange={v => {
                      updateRules(
                        update_attribute(rules, "direction", i, v.target.value),
                      )
                    }}
                  >
                    <option value={"out"}>Out</option>
                    <option value={"in"}>In</option>
                  </Select>
                </VStack>
              </GridItem>
              <GridItem rowStart={{ lg: 1, sm: 1 }} rowSpan={{ sm: 2 }}>
                <VStack justify={{ lg: "flex-end", sm: "center" }} h={"full"}>
                  <IconButton
                    icon={<CloseIcon />}
                    aria-label={`remove id ${i}`}
                    onClick={() => {
                      //   let new_rules = rules.splice(i, 1);
                      //   console.log(new_rules);
                      //   console.log(rules);
                      updateRules(rules.filter((_, idx) => idx != i))
                    }}
                  />
                </VStack>
              </GridItem>
            </Grid>
          </GridItem>
        ))}
      </Grid>
      <VStack justify={"flex-end"} h={"full"} align={"flex-start"}>
        <Button
          onClick={() => {
            updateRules([
              ...rules,
              {
                destination_CIDR: "0.0.0.0/0",
                source_CIDR: "0.0.0.0/0",
                destination_port: "",
                source_port: "",
                direction: "in",
                protocol: protocols.TCP,
              },
            ])
          }}
        >
          New Filter
        </Button>
      </VStack>
      <HStack justify={"flex-end"}>
        <Button
          onClick={() => complete({ mirror_rules: rules })}
          disabled={rules.length == 0}
        >
          Next Step
        </Button>
      </HStack>
    </Flex>
  )
}
export default SetupRulesFilter
