import React, { MutableRefObject } from "react"
import {
  Badge,
  Box,
  Text,
  useColorMode,
  VStack,
  Tag,
  Tooltip,
  HStack,
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
  selectedUuids: MutableRefObject<string[]>
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
    selectedUuids,
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

    const handleRowSelect = state => {
      if (state.selectedRows?.length > 0) {
        selectedUuids.current = state.selectedRows.map(e => e.uuid)
      } else {
        selectedUuids.current = []
      }
    }

    const columns: TableColumn<ApiEndpoint>[] = [
      {
        name: "Risk",
        sortable: false,
        selector: (row: ApiEndpoint) => row.riskScore || "",
        cell: (row: ApiEndpoint) => (
          <Badge
            fontSize="sm"
            fontWeight="medium"
            colorScheme={RISK_TO_COLOR[row.riskScore]}
            pointerEvents="none"
            p={1}
          >
            {row.riskScore}
          </Badge>
        ),
        id: "riskScore",
        grow: 0,
      },
      {
        name: "Endpoint",
        sortable: false,
        selector: (row: ApiEndpoint) => row.method + row.path,
        cell: (row: ApiEndpoint) => (
          <VStack pointerEvents="none" spacing={1} alignItems="flex-start">
            <Text
              pointerEvents="none"
              fontWeight="medium"
              fontFamily="mono"
              color="gray.900"
            >
              <HStack>
                <strong>{row.method}</strong>
                <Text>{row.path}</Text>
              </HStack>
            </Text>
            <Text pointerEvents="none" fontWeight="normal">
              {row.host}
            </Text>
          </VStack>
        ),
        id: "endpoint",
        grow: 4,
      },
      {
        name: "Permissions",
        sortable: false,
        cell: (row: ApiEndpoint) => {
          return (
            <Box pointerEvents="none">
              <HStack>
                {row.resourcePermissions.map(e => {
                  return (
                    <Badge
                      textTransform="unset"
                      fontWeight="semibold"
                      px="2"
                      py="1"
                      rounded="md"
                      key={e}
                    >
                      {e}
                    </Badge>
                  )
                })}
              </HStack>
            </Box>
          )
        },
        id: "permissions",
        grow: 1.5,
      },
      {
        name: "Visibility",
        sortable: false,
        selector: (row: ApiEndpoint) => row.host || "",
        cell: (row: ApiEndpoint) => (
          <VStack spacing={1} alignItems="flex-start">
            <Badge>{row.isPublic ? "Public" : "Private"}</Badge>
          </VStack>
        ),
        id: "visibility",
        grow: 0,
      },
      {
        name: "Sensitive Data",
        sortable: false,
        cell: (row: ApiEndpoint) => {
          return (
            <Box pointerEvents="none">
              {row.dataClasses?.map(e => {
                return (
                  <Tag
                    px={2}
                    py={1}
                    m="2px"
                    fontSize="xx-small"
                    fontWeight="normal"
                    key={e}
                    colorScheme={
                      RISK_TO_COLOR[
                        dataClasses.find(({ className }) => className == e)
                          ?.severity
                      ]
                    }
                  >
                    {dataClasses.find(({ className }) => className == e)
                      ?.shortName || e}
                  </Tag>
                )
              })}
            </Box>
          )
        },
        id: "dataClasses",
        grow: 1,
      },
      {
        name: "Last Active",
        sortable: false,
        selector: (row: ApiEndpoint) =>
          getDateTimeString(row.lastActive) || "N/A",
        cell: (row: ApiEndpoint) => (
          <Tooltip
            placement="top"
            label={getDateTimeString(row.lastActive) || "N/A"}
          >
            <Text data-tag="allowRowEvents" fontWeight="normal">
              {getDateTimeRelative(row.lastActive) || "N/A"}
            </Text>
          </Tooltip>
        ),
        id: "lastActive",
        right: true,
        grow: 0,
        width: "150px",
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
        theme="solarized"
        columns={columns}
        data={endpoints}
        customStyles={getCustomStyles(colorMode.colorMode)}
        pagination
        onSort={handleSort}
        onRowClicked={onRowClicked}
        paginationDefaultPage={currentPage}
        selectableRows
        selectableRowsHighlight
        onSelectedRowsChange={handleRowSelect}
        selectableRowSelected={(row: ApiEndpoint) =>
          selectedUuids.current.includes(row.uuid)
        }
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
