import React from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js"
import { LayoutPosition } from "chart.js/types/layout"
import { Doughnut } from "react-chartjs-2"
import { DataField } from "@common/types"
import { useColorModeValue } from "@chakra-ui/react"
import { PIE_BACKGROUND_COLORS, PIE_BORDER_COLORS } from "~/constants"

ChartJS.register(ArcElement, Tooltip, Legend)
ChartJS.register({
  id: "Pie Chart Center",
  beforeDraw: function (chart: any) {
    if (chart.config.options.elements?.center) {
      const ctx = chart.ctx
      const centerConfig = chart.config.options.elements.center
      const lineHeight = 40

      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const centerX = (chart.chartArea.left + chart.chartArea.right) / 2
      let centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2
      centerY -= lineHeight

      ctx.font = `bold 18px Arial`
      ctx.fillStyle = centerConfig.headerColor
      ctx.fillText(centerConfig.header, centerX, centerY)
      centerY += lineHeight
      ctx.font = `38px Arial`
      ctx.fillStyle = centerConfig.textColor
      ctx.fillText(centerConfig.text, centerX, centerY)
    }
  },
})

interface EndpointPIIChartProps {
  piiFields: DataField[]
}

const EndpointPIIChart: React.FC<EndpointPIIChartProps> = React.memo(
  ({ piiFields }) => {
    const headerColor = useColorModeValue(
      "rgb(102, 105, 117)",
      "rgb(116, 120, 138)",
    )
    const textColor = useColorModeValue("#000", "#FFF")
    let dataClassToCount = {} as { [k: string]: number }
    piiFields
      .map(e => e.dataClasses)
      .forEach(dataClass =>
        dataClass.forEach(
          e => (dataClassToCount[e] = (dataClassToCount[e] || 0) + 1),
        ),
      )
    const data = {
      labels: Object.keys(dataClassToCount),
      datasets: [
        {
          data: Object.values(dataClassToCount),
          backgroundColor: PIE_BACKGROUND_COLORS,
          borderColor: PIE_BORDER_COLORS,
          borderWidth: 1,
        },
      ],
    }
    const options = {
      animation: 0,
      responsive: true,
      elements: {
        center: {
          headerColor,
          textColor,
          header: "Total Fields",
          text: piiFields.length.toString(),
        },
      },
      cutout: "60%",
      plugins: {
        legend: {
          position: "top" as LayoutPosition,
          onClick: e => {},
        },
      },
    } as ChartOptions

    return <Doughnut options={options} data={data} />
  },
)

export default EndpointPIIChart
