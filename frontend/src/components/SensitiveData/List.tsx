import React from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { Badge, Text, useColorMode, Button } from "@chakra-ui/react"
import EmptyView from "components/utils/EmptyView"
import { TableColumn } from "react-data-table-component"
import { RISK_TO_COLOR } from "~/constants"
import { getCustomStyles, rowStyles } from "components/utils/TableUtils"
import { PIIDataClassAggItem } from "@common/types"
import { GetSensitiveDataAggParams } from "@common/api/summary"
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
})

const PAGE_SIZE = 10

interface PIITableProps {
  items: PIIDataClassAggItem[]
  params: GetSensitiveDataAggParams
}

const List: React.FC<PIITableProps> = React.memo(({ items, params }) => {
  const colorMode = useColorMode()
  const router = useRouter()
  const columns: TableColumn<PIIDataClassAggItem>[] = [
    {
      name: "Risk Score",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.risk,
      cell: (row: PIIDataClassAggItem) => (
        <Badge
          p="1"
          fontSize="sm"
          fontWeight="medium"
          colorScheme={RISK_TO_COLOR[row.risk]}
          pointerEvents="none"
        >
          {row.risk}
        </Badge>
      ),
      id: "risk",
    },
    {
      name: "Data Class",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.dataClass,
      cell: (row: PIIDataClassAggItem) => (
        <Text fontWeight="medium" color="gray.900">
          {row.dataClass}
        </Text>
      ),
      id: "dataClass",
    },
    {
      name: "Count",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.count,
      id: "count",
      right: true,
    },
    {
      name: "Endpoints",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.numEndpoints,
      cell: (row: PIIDataClassAggItem) => <Text>{row.numEndpoints}</Text>,
      id: "numEndpoints",
      right: true,
    },
    {
      name: "Hosts",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.numHosts,
      id: "numHosts",
      right: true,
    },
    {
      name: "",
      sortable: false,
      cell: (row: PIIDataClassAggItem) => (
        <Button
          size="xs"
          variant="createSecondary"
          fontWeight="medium"
          onClick={() =>
            router.push({
              pathname: "/endpoints",
              query: {
                dataClasses: row.dataClass,
                hosts: params.hosts.join(","),
              },
            })
          }
        >
          View
        </Button>
      ),
      right: true,
    },
  ]

  if (items.length == 0) {
    return <EmptyView text="No results found." />
  }
  if (items.length > 0) {
    return (
      <DataTable
        style={rowStyles}
        paginationComponentOptions={{ noRowsPerPage: true }}
        paginationTotalRows={items.length}
        paginationPerPage={PAGE_SIZE}
        columns={columns}
        data={items}
        customStyles={getCustomStyles(colorMode.colorMode, false, true)}
        pagination
      />
    )
  }
  return null
})

export default List
