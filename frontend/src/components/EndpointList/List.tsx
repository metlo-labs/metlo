import React from "react";
import {
  Badge,
  Box,
  Code,
  Skeleton,
  useColorMode,
  ColorMode,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import EmptyView from "../utils/EmptyView";
import _ from "lodash";
import DataTable, {
  Media,
  SortOrder,
  TableColumn,
  TableStyles,
} from "react-data-table-component";
import { Endpoint, RiskScore } from "../../types";

const PAGE_SIZE = 10;

interface EndpointTablesProps {
  endpoints: Endpoint[];
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

const conditionalRowStyles = [
  {
    when: (row: TableColumn<Endpoint>) => row.name !== null,
    style: {
      backgroundColor: "rgba(63, 195, 128, 0.9)",
      color: "white",
      "&:hover": {
        cursor: "pointer",
      },
    },
  },
];

const getCustomStyles = (colorMode: ColorMode): TableStyles => {
  const headerBg =
    colorMode == "light" ? "rgb(252, 252, 252)" : "rgb(17, 19, 23)";
  const headerTextColor =
    colorMode == "light" ? "rgb(163, 165, 170)" : "rgb(98, 100, 116)";
  const textColor = colorMode == "light" ? "black" : "white";
  const rowColor = colorMode == "light" ? "white" : "rgb(21, 23, 27)";
  const hoverRowColor =
    colorMode == "light" ? "rgb(252, 252, 252)" : "rgb(24, 26, 30)";
  return {
    rows: {
      style: {
        background: rowColor,
        color: textColor,
        minHeight: "64px",
        fontWeight: "500",
        "&:hover": {
          cursor: "pointer",
          background: hoverRowColor,
        },
      },
    },
    headRow: {
      style: {
        background: headerBg,
        color: headerTextColor,
      },
    },
    pagination: {
      style: {
        background: headerBg,
        color: textColor,
      },
      pageButtonsStyle: {
        color: textColor,
        fill: textColor,
        "&:disabled": {
          fill: textColor,
          color: textColor,
        },
      },
    },
  } as TableStyles;
};

const riskToColor = {
  [RiskScore.LOW]: "gray",
  [RiskScore.MEDIUM]: "orange",
  [RiskScore.HIGH]: "red",
};

const TableLoader: React.FC<TableLoaderProps> = ({
  currentPage,
  totalCount,
}) => {
  const colorMode = useColorMode();
  const loadingColumns: TableColumn<any>[] = [
    {
      name: "Table",
      selector: () => "",
      cell: () => (
        <Box w="100px" h="10px">
          <Skeleton startColor="gray.50" endColor="gray.200" height="20px" />
        </Box>
      ),
      id: "table_id",
    },
    {
      name: "Dataset",
      selector: () => "",
      cell: () => (
        <Box w="100px" h="10px">
          <Skeleton startColor="gray.50" endColor="gray.200" height="20px" />
        </Box>
      ),
      id: "table_dataset",
      hide: Media.LG,
    },
    {
      name: "Project",
      selector: () => "",
      cell: () => (
        <Box w="100px" h="10px">
          <Skeleton startColor="gray.50" endColor="gray.200" height="20px" />
        </Box>
      ),
      id: "table_project",
      hide: Media.MD,
    },
    {
      name: "Owner",
      selector: () => "",
      cell: () => (
        <Box w="100px" h="10px">
          <Skeleton startColor="gray.50" endColor="gray.200" height="20px" />
        </Box>
      ),
      id: "owner",
    },
    {
      name: "Datasource",
      selector: () => "",
      cell: () => (
        <Box w="full" h="20px">
          <Skeleton startColor="gray.50" endColor="gray.200" height="20px" />
        </Box>
      ),
      id: "datasource_name",
    },
  ];

  return (
    <Box w="full" h="full">
      <DataTable
        style={conditionalRowStyles}
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
      column: TableColumn<Endpoint>,
      sortDirection: SortOrder
    ) => {
      setOrdering(sortDirection.toUpperCase() as "ASC" | "DESC");
      setOrderBy(column.id?.toString());
    };

    const columns: TableColumn<Endpoint>[] = [
      {
        name: "Environment",
        sortable: true,
        selector: (row: Endpoint) => row.environment || "",
        id: "environment",
      },
      {
        name: "Host",
        sortable: true,
        selector: (row: Endpoint) => row.host || "",
        id: "host",
      },
      {
        name: "Path",
        sortable: true,
        selector: (row: Endpoint) => row.path || "",
        cell: (row: Endpoint) => <Code p="1">{row.path}</Code>,
        id: "path",
      },
      {
        name: "Method",
        sortable: true,
        selector: (row: Endpoint) => row.method || "",
        cell: (row: Endpoint) => <Badge>{row.method}</Badge>,
        id: "method",
      },
      {
        name: "Risk Score",
        sortable: true,
        selector: (row: Endpoint) => row.riskScore || "",
        cell: (row: Endpoint) => (
          <Badge colorScheme={riskToColor[row.riskScore]}>
            {row.riskScore}
          </Badge>
        ),
        id: "riskScore",
      },
    ];

    const onRowClicked = (
      row: Endpoint,
      e: React.MouseEvent<Element, MouseEvent>
    ) => {
      router.push(`/endpoint/${row.uuid}`);
    };

    const getTable = () => (
      <DataTable
        style={conditionalRowStyles}
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
