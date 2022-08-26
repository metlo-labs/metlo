import React from "react"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { LayoutPosition } from "chart.js/types/layout"
import { Pie } from "react-chartjs-2"
import { DataField } from "@common/types"

ChartJS.register(ArcElement, Tooltip, Legend)

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as LayoutPosition,
    },
  },
}

interface EndpointPIIChartProps {
  piiFields: DataField[]
}

const EndpointPIIChart: React.FC<EndpointPIIChartProps> = React.memo(
  ({ piiFields }) => {
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
            "rgba(255, 99, 132, 0.3)",
            "rgba(54, 162, 235, 0.3)",
            "rgba(255, 206, 86, 0.3)",
            "rgba(75, 192, 192, 0.3)",
            "rgba(153, 102, 255, 0.3)",
            "rgba(255, 159, 64, 0.3)",
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
    return <Pie options={options} data={data} />
  },
)

export default EndpointPIIChart
