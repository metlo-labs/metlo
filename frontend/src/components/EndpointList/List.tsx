import React, { useEffect, useState } from "react"
import {
  Badge,
  Box,
  Text,
  useColorMode,
  HStack,
  Tag,
  Tooltip,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import EmptyView from "components/utils/EmptyView"
import dynamic from "next/dynamic"
import { SortOrder, TableColumn } from "react-data-table-component"
import { RISK_TO_COLOR } from "~/constants"
import {
  getCustomStyles,
  rowStyles,
  SkeletonCell,
} from "components/utils/TableUtils"
import { ApiEndpoint, DataClass } from "@common/types"
import { getDateTimeRelative, getDateTimeString } from "utils"

const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
})

const PAGE_SIZE = 10

interface EndpointTablesProps {
  endpoints: ApiEndpoint[]
  totalCount: number
  currentPage: number
  setCurrentPage: (e: number) => void
  fetching: boolean
  setOrdering: (e: "ASC" | "DESC") => void
  setOrderBy: (e: string | undefined) => void
  dataClasses: DataClass[]
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
      name: "Risk",
      id: "riskScore",
      grow: 1,
    },
    {
      name: "Path",
      id: "path",
      grow: 3,
    },
    {
      name: "Sensitive Data Classes",
      id: "dataClasses",
      grow: 2,
    },
    {
      name: "Host",
      id: "host",
      grow: 2,
    },
    {
      name: "First Detected",
      id: "firstDetected",
      grow: 1.5,
    },
    {
      name: "Last Active",
      id: "lastActive",
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
        data={Array.apply(null, Array(PAGE_SIZE)).map(() => {
          return {}
        })}
        customStyles={getCustomStyles(colorMode.colorMode)}
        pagination
        paginationDefaultPage={currentPage}
      />
    </Box>
  )
}

const List: React.FC<EndpointTablesProps> = React.memo(
  ({
    endpoints,
    totalCount,
    currentPage,
    fetching,
    setCurrentPage,
    setOrdering,
    setOrderBy,
    dataClasses,
  }) => {
    const router = useRouter()
    const colorMode = useColorMode()

    const handleSort = (
      column: TableColumn<ApiEndpoint>,
      sortDirection: SortOrder,
    ) => {
      setOrdering(sortDirection.toUpperCase() as "ASC" | "DESC")
      setOrderBy(column.id?.toString())
    }

    const columns: TableColumn<ApiEndpoint>[] = [
      {
        name: "Risk",
        sortable: false,
        selector: (row: ApiEndpoint) => row.riskScore || "",
        cell: (row: ApiEndpoint) => (
          <Badge
            p="1"
            fontSize="sm"
            colorScheme={RISK_TO_COLOR[row.riskScore]}
            pointerEvents="none"
          >
            {row.riskScore}
          </Badge>
        ),
        id: "riskScore",
        minWidth: "75px",
        grow: 1,
      },
      {
        name: "Path",
        sortable: false,
        selector: (row: ApiEndpoint) => row.method + row.path,
        cell: (row: ApiEndpoint) => (
          <HStack
            fontSize="sm"
            spacing="4"
            pointerEvents="none"
            alignItems="center"
          >
            <Text>{row.method}</Text>
            <Text fontFamily="mono">{row.path}</Text>
          </HStack>
        ),
        id: "path",
        grow: 3,
      },
      {
        name: "Sensitive Data Classes",
        sortable: false,
        cell: (row: ApiEndpoint) => {
          return (
            <Box>
              {row.dataClasses?.map(e => {
                return (
                  <Tag
                    p="1"
                    m="2px"
                    fontSize="xx-small"
                    key={e}
                    colorScheme={
                      RISK_TO_COLOR[
                        dataClasses.find(({ className }) => className == e)
                          ?.severity
                      ]
                    }
                  >
                    {e}
                  </Tag>
                )
              })}
            </Box>
          )
        },
        id: "dataClasses",
        grow: 2,
      },
      {
        name: "Host",
        sortable: false,
        selector: (row: ApiEndpoint) => row.host || "",
        id: "host",
        grow: 2,
      },
      {
        name: "First Detected",
        sortable: false,
        selector: (row: ApiEndpoint) =>
          getDateTimeString(row.firstDetected) || "N/A",
        id: "firstDetected",
        grow: 1.5,
      },
      {
        name: "Last Active",
        sortable: false,
        selector: (row: ApiEndpoint) =>
          getDateTimeRelative(row.lastActive) || "N/A",
        cell: (row: ApiEndpoint) => (
          <Tooltip
            placement="top"
            label={getDateTimeString(row.lastActive) || "N/A"}
          >
            {getDateTimeRelative(row.lastActive) || "N/A"}
          </Tooltip>
        ),
        id: "lastActive",
        grow: 1.5,
      },
    ]

    const onRowClicked = (
      row: ApiEndpoint,
      e: React.MouseEvent<Element, MouseEvent>,
    ) => {
      router.push(`/endpoint/${row.uuid}`)
    }

    const getTable = () => (
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
        columns={columns}
        data={endpoints}
        customStyles={getCustomStyles(colorMode.colorMode)}
        pagination
        onSort={handleSort}
        onRowClicked={onRowClicked}
        paginationDefaultPage={currentPage}
      />
    )

    if (totalCount == 0 && !fetching) {
      return <EmptyView text="No results found." />
    }
    if (totalCount > 0) {
      return getTable()
    }
    return null
  },
)

export default List
