import React from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { Badge, useColorMode, Box, HStack, Text } from "@chakra-ui/react"
import EmptyView from "components/utils/EmptyView"
import { TableColumn } from "react-data-table-component"
import { ATTACK_PAGE_LIMIT, RISK_TO_COLOR } from "~/constants"
import {
  getCustomStyles,
  rowStyles,
  SkeletonCell,
} from "components/utils/TableUtils"
import { Attack } from "@common/types"
import { getDateTimeString } from "utils"
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
})

interface AttackTableProps {
  items: Attack[]
  totalCount: number
  setCurrentPage: (page: number) => void
  currentPage: number
  fetching: boolean
}

interface TableLoaderProps {
  currentPage: number
  totalCount: number
}

const TableLoader: React.FC<TableLoaderProps> = ({
  currentPage,
  totalCount,
}) => {
  const colorMode = useColorMode()
  const loadingColumns: TableColumn<any>[] = [
    {
      name: "Attack Type",
      id: "type",
      grow: 2,
    },
    {
      name: "Risk Score",
      id: "risk",
      grow: 0,
    },
    {
      name: "Endpoint",
      id: "endpoint",
      grow: 2,
    },
    {
      name: "Host",
      id: "host",
      grow: 1.5,
    },
    {
      name: "Start Time",
      id: "startTime",
      grow: 1.5,
    },
    {
      name: "End Time",
      id: "endTime",
      grow: 1.5,
    },
  ].map(e => ({
    ...e,
    sortable: false,
    cell: () => <SkeletonCell />,
  }))

  return (
    <Box w="full" h="full">
      <DataTable
        style={rowStyles}
        paginationComponentOptions={{ noRowsPerPage: true }}
        paginationTotalRows={totalCount}
        paginationServer
        columns={loadingColumns}
        data={Array.apply(null, Array(ATTACK_PAGE_LIMIT)).map(() => {
          return {}
        })}
        customStyles={getCustomStyles(colorMode.colorMode)}
        pagination
        paginationDefaultPage={currentPage}
      />
    </Box>
  )
}

export const List: React.FC<AttackTableProps> = React.memo(
  ({ items, totalCount, setCurrentPage, currentPage, fetching }) => {
    const colorMode = useColorMode()
    const router = useRouter()
    const columns: TableColumn<Attack>[] = [
      {
        name: "Attack Type",
        sortable: false,
        selector: (row: Attack) => row.attackType,
        id: "type",
        grow: 2,
      },
      {
        name: "Risk Score",
        sortable: false,
        selector: (row: Attack) => row.riskScore,
        cell: (row: Attack) => (
          <Badge
            p="1"
            fontSize="sm"
            colorScheme={RISK_TO_COLOR[row.riskScore]}
            pointerEvents="none"
          >
            {row.riskScore}
          </Badge>
        ),
        id: "risk",
        grow: 0,
      },
      {
        name: "Endpoint",
        sortable: false,
        selector: (row: Attack) => row.apiEndpointUuid,
        cell: (row: Attack) => (
          <HStack
            fontSize="sm"
            spacing="4"
            pointerEvents="none"
            alignItems="center"
          >
            <Text>{row.apiEndpoint?.method}</Text>
            <Text fontFamily="mono">{row.apiEndpoint.path}</Text>
          </HStack>
        ),
        id: "count",
        grow: 2,
      },
      {
        name: "Host",
        sortable: false,
        selector: (row: Attack) => row.host,
        id: "host",
        grow: 1.5,
      },
      {
        name: "Start Time",
        sortable: false,
        selector: (row: Attack) => getDateTimeString(row.startTime),
        id: "startTime",
        grow: 1.5,
      },
      {
        name: "End Time",
        sortable: false,
        selector: (row: Attack) => getDateTimeString(row.endTime) || "N/A",
        grow: 1.5,
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
          paginationTotalRows={totalCount}
          paginationServer
          onChangePage={setCurrentPage}
          progressPending={fetching}
          progressComponent={
            <TableLoader currentPage={currentPage} totalCount={totalCount} />
          }
          paginationPerPage={ATTACK_PAGE_LIMIT}
          columns={columns}
          data={items}
          customStyles={getCustomStyles(colorMode.colorMode)}
          paginationDefaultPage={currentPage}
          pagination
          onRowClicked={(row: Attack, e) =>
            router.push(`/protection/${row.uuid}`)
          }
        />
      )
    }
    return null
  },
)
