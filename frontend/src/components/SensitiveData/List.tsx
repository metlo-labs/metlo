import React from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { Badge, useColorMode, Wrap, WrapItem } from "@chakra-ui/react"
import EmptyView from "components/utils/EmptyView"
import { TableColumn } from "react-data-table-component"
import { RISK_TO_COLOR } from "~/constants"
import { getCustomStyles, rowStyles } from "components/utils/TableUtils"
import { PIIDataClassAggItem, GetSensitiveDataAggParams } from "@common/types"
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
      name: "Data Class",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.dataClass,
      id: "dataClass",
    },
    {
      name: "Risk Score",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.risk,
      cell: (row: PIIDataClassAggItem) => (
        <Badge
          p="1"
          fontSize="sm"
          colorScheme={RISK_TO_COLOR[row.risk]}
          pointerEvents="none"
        >
          {row.risk}
        </Badge>
      ),
      id: "risk",
    },
    {
      name: "Count",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.count,
      id: "count",
    },
    {
      name: "Endpoints",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.numEndpoints,
      cell: (row: PIIDataClassAggItem) => (
        <Wrap
          display="flex"
          alignItems="center"
          h="full"
          pr="5"
          className="my-box"
          cursor="pointer"
        >
          <WrapItem>{row.numEndpoints}</WrapItem>
          <WrapItem
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
            View All →
          </WrapItem>
        </Wrap>
      ),
      id: "numEndpoints",
    },
    {
      name: "Hosts",
      sortable: true,
      selector: (row: PIIDataClassAggItem) => row.numHosts,
      id: "numHosts",
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
