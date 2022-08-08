import React from "react";
import { Badge, Box, Code, useColorMode, HStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import EmptyView from "../utils/EmptyView";
import DataTable, { SortOrder, TableColumn } from "react-data-table-component";
import { METHOD_TO_COLOR, RISK_TO_COLOR } from "../../constants";
import { getCustomStyles, rowStyles, SkeletonCell } from "../utils/TableUtils";
import { Alert, Endpoint } from "@common/types";
import { getDateTimeString } from "../../utils";

const PAGE_SIZE = 10;

interface AlertTablesProps {
  alerts: Alert[];
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
      name: "Risk",
      selector: (row: Alert) => row.riskScore || "",
      id: "risk",
      grow: 0,
    },
    {
      name: "Endpoint",
      selector: (row: Alert) => `${row.apiEndpoint.method}_${row.apiEndpoint.path}`,
      id: "endpoint",
      grow: 1,
    },
    {
      name: "Type",
      selector: (row: Alert) => row.type || "",
      id: "type",
      grow: 1,
    },
    {
      name: "Description",
      selector: (row: Alert) => row.description || "",
      id: "title",
      grow: 1,
    },
    {
      name: "Time",
      selector: (row: Alert) => row.createdAt.toISOString(),
      id: "time",
      grow: 1,
    },
  ].map((e) => ({
    ...e,
    sortable: true,
    cell: (row: Endpoint) => <SkeletonCell />,
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

const List: React.FC<AlertTablesProps> = React.memo(
  ({
    alerts,
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
      column: TableColumn<Alert>,
      sortDirection: SortOrder
    ) => {
      setOrdering(sortDirection.toUpperCase() as "ASC" | "DESC");
      setOrderBy(column.id?.toString());
    };

    const columns: TableColumn<Alert>[] = [
      {
        name: "Risk",
        sortable: true,
        selector: (row: Alert) => row.riskScore || "",
        cell: (row: Alert) => (
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
        sortable: true,
        selector: (row: Alert) => `${row.apiEndpoint.method}_${row.apiEndpoint.path}`,
        cell: (row: Alert) => (
          <HStack>
            <Badge
              fontSize="sm"
              px="2"
              py="1"
              colorScheme={METHOD_TO_COLOR[row.apiEndpoint.method] || "gray"}
            >
              {row.apiEndpoint.method.toUpperCase()}
            </Badge>
            <Code p="1" pointerEvents="none">
              {row.apiEndpoint.path}
            </Code>
          </HStack>
        ),
        id: "endpoint",
        grow: 1,
      },
      {
        name: "Type",
        sortable: true,
        selector: (row: Alert) => row.type || "",
        cell: (row: Alert) => (
          <Text fontSize="sm" fontWeight="semibold">
            {row.type}
          </Text>
        ),
        id: "type",
        grow: 1,
      },
      {
        name: "Description",
        sortable: true,
        selector: (row: Alert) => row.description || "",
        cell: (row: Alert) => (
          <Text fontSize="sm" fontWeight="semibold">
            {row.description}
          </Text>
        ),
        id: "title",
        grow: 1,
      },
      {
        name: "Time",
        sortable: true,
        selector: (row: Alert) => row.createdAt.toISOString(),
        cell: (row: Alert) => (
          <Text fontSize="sm" fontWeight="semibold">
            {getDateTimeString(row.createdAt)}
          </Text>
        ),
        id: "time",
        grow: 1,
      }
    ];

    const onRowClicked = (
      row: Alert,
      e: React.MouseEvent<Element, MouseEvent>
    ) => {
      router.push({ pathname: `/endpoint/${row.apiEndpointUuid}`, query: { tab: "alerts" }});
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
        data={alerts}
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
