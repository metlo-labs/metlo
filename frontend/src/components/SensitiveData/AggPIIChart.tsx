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
  Stack,
} from "@chakra-ui/react"
import { PIE_BACKGROUND_COLORS, PIE_BORDER_COLORS } from "~/constants"

ChartJS.register(ArcElement, Tooltip, Legend)

interface AggPIIChartProps extends StackProps {
  piiDataTypeCount: Map<string, number>
  totalPIIFields: number
  totalEndpoints: number
}

const AggPIIChart: React.FC<AggPIIChartProps> = React.memo(
  ({ totalPIIFields, totalEndpoints, piiDataTypeCount, ...props }) => {
    const data = Object.values(piiDataTypeCount)
    const labels = Object.keys(piiDataTypeCount)
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
      maintainAspectRatio: false,
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
      <Stack
        direction={{ base: "column", md: "row" }}
        overflow="hidden"
        alignItems="flex-start"
        bg="cellBG"
        spacing="0"
        divider={<StackDivider />}
        w="full"
        h={{ base: "unset", md: "60" }}
      >
        <Stack
          minW={{ base: "full", md: "250px" }}
          w={{ base: "full", md: "250px" }}
          maxW={{ base: "full", md: "250px" }}
          direction={{ base: "row", md: "column" }}
          divider={<StackDivider />}
          spacing="0"
          h="full"
        >
          <VStack
            bg="cellBG"
            p="4"
            spacing="1"
            h="50%"
            w={{ base: "50%", md: "unset" }}
            textAlign="center"
            justifyContent="center"
          >
            <Text fontSize="xl" fontWeight="semibold" rounded="md">
              {totalPIIFields}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              PII Fields
            </Text>
          </VStack>
          <VStack
            bg="cellBG"
            p="4"
            spacing="1"
            h="50%"
            w={{ base: "50%", md: "unset" }}
            textAlign="center"
            justifyContent="center"
          >
            <Text fontSize="xl" fontWeight="semibold" rounded="md">
              {totalEndpoints}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              Endpoints
            </Text>
          </VStack>
        </Stack>
        <HStack
          w={{ base: "full", md: "calc(100% - 250px)" }}
          spacing="6"
          flexGrow="1"
          alignItems="center"
          h="60"
          display={labels.length > 0 ? "flex" : "none"}
        >
          <Box p="4" w={{ base: "full", sm: "220px" }} h="full">
            <Doughnut options={options} data={chartData} />
          </Box>
          <Box
            h="100%"
            w="full"
            display={{ base: "none", sm: "grid", md: "none", lg: "grid" }}
            overflow={{ base: "hidden", sm: "auto" }}
          >
            <Grid
              alignSelf="center"
              w="full"
              templateColumns="repeat(2, 1fr)"
              gap="2"
              p="4"
            >
              {labels.map((e, i) => (
                <GridItem key={i}>
                  <HStack alignItems="baseline">
                    <Box bg={PIE_BACKGROUND_COLORS[i]} px="2" py="1" />
                    <Text fontSize="sm">{e}</Text>
                  </HStack>
                </GridItem>
              ))}
            </Grid>
          </Box>
        </HStack>
      </Stack>
    )
  },
)

export default AggPIIChart
