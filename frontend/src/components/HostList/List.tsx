import React from "react"
import {
  Box,
  useColorMode,
  Wrap,
  WrapItem,
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
  setSelectedHost: React.Dispatch<React.SetStateAction<string>>
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
      grow: 2,
    },
    {
      name: "Endpoints",
      id: "endpoints",
      grow: 1,
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
    setSelectedHost,
  }) => {
    const router = useRouter()
    const colorMode = useColorMode()

    const handleRowSelect = (state) => {
      if (state.selectedRows?.length > 0) {
        setSelectedHost(state.selectedRows[0]?.host)
      } else {
        setSelectedHost(null)
      }
    }

    const columns: TableColumn<HostResponse>[] = [
      {
        name: "Host",
        sortable: false,
        selector: (row: HostResponse) => row.host || "",
        id: "host",
        grow: 2,
      },
      {
        name: "Endpoints",
        sortable: false,
        selector: (row: HostResponse) => row.numEndpoints,
        cell: (row: HostResponse) => (
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
                    hosts: row.host,
                  },
                })
              }
            >
              View All →
            </WrapItem>
          </Wrap>
        ),
        id: "endpoints",
        grow: 1,
      }
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
        selectableRowsSingle
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
