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
    const headerColor = useColorModeValue("rgb(102, 105, 117)", "rgb(116, 120, 138)")
    const textColor = useColorModeValue("#000", "#FFF")
    let dataClassToCount = {}
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
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
            "rgba(255, 159, 64, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
    const options = {
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
        },
      },
    } as ChartOptions

    return <Doughnut options={options} data={data} />
  },
)

export default EndpointPIIChart
