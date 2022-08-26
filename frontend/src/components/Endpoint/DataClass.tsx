import {
  useColorModeValue,
  VStack,
  Text,
  Code,
  HStack,
  Badge,
  Box,
  Grid,
  GridItem,
  Button,
} from "@chakra-ui/react"
import { RiEyeOffFill } from "@react-icons/all-files/ri/RiEyeOffFill"
import { DataClass, RiskScore } from "@common/enums"
import { DATA_CLASS_TO_RISK_SCORE, RISK_TO_COLOR } from "~/constants"

interface DataClassComponentProps {
  dataClass: DataClass
  matches: string[]
  handleIgnoreClick: (ignoredDataClass: DataClass) => Promise<void>
  updating: boolean
}

const RISK_SCORE_TO_COMPONENT_COLOR: Record<RiskScore, string[]> = {
  [RiskScore.HIGH]: ["red.100", "rgba(254, 178, 178, 0.16)"],
  [RiskScore.MEDIUM]: ["orange.100", "rgba(251, 211, 141, 0.16)"],
  [RiskScore.LOW]: ["gray.100", "rgba(226, 232, 240, 0.16)"],
  [RiskScore.NONE]: ["green.100", "rgba(154, 230, 180, 0.16)"],
}

export const DataClassComponent: React.FC<DataClassComponentProps> = ({
  dataClass,
  matches,
  handleIgnoreClick,
  updating,
}) => {
  const riskScore = DATA_CLASS_TO_RISK_SCORE[dataClass]
  const colors = RISK_SCORE_TO_COMPONENT_COLOR[riskScore]
  const color = useColorModeValue(colors[0], colors[1])

  return (
    <VStack
      p="4"
      rounded="md"
      bgColor={color}
      w="full"
      spacing="2"
      alignItems="flex-start"
    >
      <HStack w="full" justifyContent="space-between">
        <Text w="full" fontWeight="semibold">
          {dataClass}
        </Text>
        <Badge fontSize="lg" colorScheme={RISK_TO_COLOR[riskScore]}>
          {riskScore}
        </Badge>
      </HStack>
      {matches?.length > 0 && (
        <VStack w="full" alignItems="flex-start">
          <Text>Example Matches</Text>
          <Grid
            w="full"
            gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
            gap="4"
          >
            {matches.map((match, idx) => (
              <GridItem key={idx}>
                <Code w="full" p="2" rounded="md">
                  {match}
                </Code>
              </GridItem>
            ))}
          </Grid>
        </VStack>
      )}
      <Box alignSelf="flex-end" pt="4">
        <Button
          isLoading={updating}
          onClick={() => handleIgnoreClick(dataClass)}
          leftIcon={<RiEyeOffFill />}
          border="1px"
        >
          Ignore
        </Button>
      </Box>
    </VStack>
  )
}
