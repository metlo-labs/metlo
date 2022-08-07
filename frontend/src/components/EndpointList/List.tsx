import React from "react";
import { Badge, Box, Code, useColorMode, HStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import EmptyView from "../utils/EmptyView";
import DataTable, { SortOrder, TableColumn } from "react-data-table-component";
import { METHOD_TO_COLOR, RISK_TO_COLOR } from "../../constants";
import { getCustomStyles, rowStyles, SkeletonCell } from "../utils/TableUtils";
import { ApiEndpoint } from "@common/types";

const PAGE_SIZE = 10;

interface EndpointTablesProps {
  endpoints: ApiEndpoint[];
  totalCount: number;
  currentPage: number;
  setCurrentPage: (e: number) => void;
  fetching: boolean;
  setOrdering: (e: "ASC" | "DESC") => void;
  setOrderBy: (e: string | undefined) => void;
}

interface TableLoaderProps {
  currentPage: number;
  totalCount: number;
}

const TableLoader: React.FC<TableLoaderProps> = ({
  currentPage,
  totalCount,
}) => {
  const colorMode = useColorMode();
  const loadingColumns: TableColumn<any>[] = [
    {
      name: "Risk Score",
      id: "riskScore",
      grow: 1,
    },
    {
      name: "Path",
      id: "pathMethod",
      grow: 3,
    },
    {
      name: "Environment",
      id: "environment",
      grow: 1,
    },
    {
      name: "Host",
      id: "host",
      grow: 1,
    },
    {
      name: "First Detected",
      id: "firstDetected",
      grow: 2,
    },
    {
      name: "Last Active",
      id: "lastActive",
      grow: 2,
    },
  ].map((e) => ({
    ...e,
    sortable: true,
    cell: (row: ApiEndpoint) => <SkeletonCell />,
  }));

  return (
    <Box w="full" h="full">
      <DataTable
        style={rowStyles}
        paginationComponentOptions={{ noRowsPerPage: true }}
        paginationTotalRows={totalCount}
        paginationServer
        columns={loadingColumns}
        data={Array.apply(null, Array(PAGE_SIZE)).map(() => {
          return {};
        })}
        customStyles={getCustomStyles(colorMode.colorMode)}
        pagination
        paginationDefaultPage={currentPage}
      />
    </Box>
  );
};

const List: React.FC<EndpointTablesProps> = React.memo(
  ({
    endpoints,
    totalCount,
    currentPage,
    fetching,
    setCurrentPage,
    setOrdering,
    setOrderBy,
  }) => {
    const router = useRouter();
    const colorMode = useColorMode();
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    const handleSort = (
      column: TableColumn<ApiEndpoint>,
      sortDirection: SortOrder
    ) => {
      setOrdering(sortDirection.toUpperCase() as "ASC" | "DESC");
      setOrderBy(column.id?.toString());
    };

    const columns: TableColumn<ApiEndpoint>[] = [
      {
        name: "Risk Score",
        sortable: true,
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
        grow: 1,
      },
      {
        name: "Path",
        sortable: true,
        selector: (row: ApiEndpoint) => row.method + row.path,
        cell: (row: ApiEndpoint) => (
          <HStack pointerEvents="none">
            <Badge
              p="1"
              colorScheme={METHOD_TO_COLOR[row.method] || "gray"}
              fontSize="sm"
            >
              {row.method}
            </Badge>
            <Code p="1">{row.path}</Code>
          </HStack>
        ),
        id: "pathMethod",
        grow: 3,
      },
      {
        name: "Host",
        sortable: true,
        selector: (row: ApiEndpoint) => row.host || "",
        id: "host",
        grow: 1,
      },
      {
        name: "First Detected",
        sortable: true,
        selector: (row: ApiEndpoint) => row.firstDetected?.toString() || "",
        id: "firstDetected",
        grow: 2,
      },
      {
        name: "Last Active",
        sortable: true,
        selector: (row: ApiEndpoint) => row.lastActive?.toString() || "",
        id: "lastActive",
        grow: 2,
      },
    ];

    const onRowClicked = (
      row: ApiEndpoint,
      e: React.MouseEvent<Element, MouseEvent>
    ) => {
      router.push(`/endpoint/${row.uuid}`);
    };

    const getTable = () => (
      <DataTable
        style={rowStyles}
        paginationComponentOptions={{ noRowsPerPage: true }}
        paginationTotalRows={totalCount}
        paginationServer
        onChangePage={handlePageChange}
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
    );

    if (totalCount == 0 && !fetching) {
      return <EmptyView />;
    }
    if (totalCount > 0) {
      return getTable();
    }
    return null;
  }
);

export default List;
