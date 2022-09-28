import React from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js"
import { Doughnut } from "react-chartjs-2"
import {
  HStack,
  StackProps,
  Grid,
  GridItem,
  Text,
  VStack,
  Box,
  StackDivider,
} from "@chakra-ui/react"
import { AttackType } from "@common/enums"
import { PIE_BACKGROUND_COLORS, PIE_BORDER_COLORS } from "~/constants"

ChartJS.register(ArcElement, Tooltip, Legend)

interface AggAttackChartProps extends StackProps {
  attackTypeCount: Record<AttackType, number>
  totalAttacks: number
  totalEndpoints: number
}

export const AggAttackChart: React.FC<AggAttackChartProps> = React.memo(
  ({ totalAttacks, totalEndpoints, attackTypeCount, ...props }) => {
    const data = Object.values(attackTypeCount)
    const labels = Object.keys(attackTypeCount)
    const chartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: PIE_BACKGROUND_COLORS,
          borderColor: PIE_BORDER_COLORS,
          borderWidth: 1,
        },
      ],
    }
    const options = {
      responsive: true,
      cutout: "60%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          caretSize: 0,
          bodyFont: {
            size: 11,
          },
        },
      },
    } as ChartOptions
    return (
      <HStack
        overflow="hidden"
        alignItems="flex-start"
        bg="cellBG"
        spacing="0"
        divider={<StackDivider />}
        w="full"
        h="60"
      >
        <VStack divider={<StackDivider />} spacing="0" h="full">
          <VStack
            bg="cellBG"
            py="4"
            spacing="1"
            px="20"
            h="50%"
            justifyContent="center"
          >
            <Text fontSize="xl" fontWeight="semibold" rounded="md">
              {data.reduce((partialSum, a) => partialSum + a, 0)}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              Open Attacks
            </Text>
          </VStack>
          <VStack
            bg="cellBG"
            py="4"
            spacing="1"
            h="50%"
            justifyContent="center"
          >
            <Text fontSize="xl" fontWeight="semibold" rounded="md">
              {totalEndpoints}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              Endpoints
            </Text>
          </VStack>
        </VStack>
        <HStack spacing="12" flexGrow="1" alignItems="center" p="4" h="full">
          <Box w="220px">
            <Doughnut options={options} data={chartData} />
          </Box>
          <VStack
            display={{ base: "none", md: "inherit" }}
            flexGrow="1"
            alignItems="flex-start"
            spacing="4"
            h="full"
            py="8"
          >
            <Grid templateColumns="repeat(2, 1fr)" gap="4">
              {labels.map((e, i) => (
                <GridItem key={i}>
                  <HStack>
                    <Box bg={PIE_BACKGROUND_COLORS[i]} px="2" py="1" />
                    <Text fontSize="sm">{e}</Text>
                  </HStack>
                </GridItem>
              ))}
            </Grid>
          </VStack>
        </HStack>
      </HStack>
    )
  },
)
