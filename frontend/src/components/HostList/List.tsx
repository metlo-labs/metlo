import React from "react"
import {
  Box,
  Text,
  useColorMode,
  Wrap,
  WrapItem,
  Button,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import EmptyView from "components/utils/EmptyView"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"
import {
  getCustomStyles,
  rowStyles,
  SkeletonCell,
} from "components/utils/TableUtils"
import { HostResponse } from "@common/types"

const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
})

const PAGE_SIZE = 10

interface HostTableProps {
  hosts: HostResponse[]
  totalCount: number
  currentPage: number
  setCurrentPage: (e: number) => void
  fetching: boolean
  setSelectedHosts: React.Dispatch<React.SetStateAction<string[]>>
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
      name: "Host",
      id: "host",
      grow: 7,
    },
    {
      name: "Endpoints",
      id: "endpoints",
      grow: 4,
    },
    {
      name: "",
      id: "cta",
      right: true,
    }
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

const List: React.FC<HostTableProps> = React.memo(
  ({
    hosts,
    totalCount,
    currentPage,
    fetching,
    setCurrentPage,
    setSelectedHosts,
  }) => {
    const router = useRouter()
    const colorMode = useColorMode()

    const handleRowSelect = state => {
      if (state.selectedRows?.length > 0) {
        setSelectedHosts(state.selectedRows?.map(e => e.host) ?? [])
      } else {
        setSelectedHosts([])
      }
    }

    const columns: TableColumn<HostResponse>[] = [
      {
        name: "Host",
        sortable: false,
        selector: (row: HostResponse) => row.host || "",
        cell: (row: HostResponse) => (
          <Text color="gray.900" fontWeight="medium">
            {row.host}
          </Text>
        ),
        id: "host",
        grow: 7,
      },
      {
        name: "Endpoints",
        sortable: false,
        selector: (row: HostResponse) => row.numEndpoints,
        cell: (row: HostResponse) => (
          <Text color="gray.900">{row.numEndpoints}</Text>
        ),
        id: "endpoints",
        right: true,
        grow: 4,
      },
      {
        name: "",
        sortable: false,
        cell: (row: HostResponse) => (
          <Button
            size="xs"
            fontWeight="medium"
            variant="createSecondary"
            onClick={() =>
              router.push({
                pathname: "/endpoints",
                query: {
                  hosts: row.host,
                },
              })
            }
          >
            View
          </Button>
        ),
        id: "cta",
        right: true,
      },
    ]

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
        data={hosts}
        customStyles={getCustomStyles(colorMode.colorMode, false, true)}
        pagination
        paginationDefaultPage={currentPage}
        selectableRows
        onSelectedRowsChange={handleRowSelect}
        selectableRowsHighlight
      />
    )

    if (totalCount == 0 && !fetching) {
      return <EmptyView text="No hosts found." />
    }
    if (totalCount > 0) {
      return getTable()
    }
    return null
  },
)

export default List
