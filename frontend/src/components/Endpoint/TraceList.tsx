import React from "react";
import { useColorMode, Code, HStack, Badge } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { ApiTrace } from "../../../../common/dist/types";
import { METHOD_TO_COLOR } from "../../constants";
import { statusCodeToColor } from "../utils/StatusCode";

interface TraceListProps {
  traces: ApiTrace[];
}

const TraceList: React.FC<TraceListProps> = React.memo(({ traces }) => {
  const colorMode = useColorMode();
  const columns: TableColumn<ApiTrace>[] = [
    {
      name: "Code",
      sortable: true,
      selector: (row: ApiTrace) => row.responseStatus || "",
      cell: (row: ApiTrace) => (
        <Badge
          fontSize="sm"
          px="2"
          py="1"
          colorScheme={statusCodeToColor(row.responseStatus) || "gray"}
        >
          {row.responseStatus}
        </Badge>
      ),
      id: "path",
      grow: 0,
    },
    {
      name: "Path",
      sortable: true,
      selector: (row: ApiTrace) => `${row.method}-${row.path}`,
      cell: (row: ApiTrace) => (
        <HStack>
          <Badge
            fontSize="sm"
            px="2"
            py="1"
            colorScheme={METHOD_TO_COLOR[row.method] || "gray"}
          >
            {row.method.toUpperCase()}
          </Badge>
          <Code p="1" pointerEvents="none">
            {row.path}
          </Code>
        </HStack>
      ),
      id: "path",
      grow: 2,
    },
    {
      name: "Source",
      sortable: true,
      selector: (row: ApiTrace) => `${row.meta.source}:${row.meta.sourcePort}`,
      id: "source",
      grow: 1,
    },
    {
      name: "Destination",
      sortable: true,
      selector: (row: ApiTrace) =>
        `${row.meta.destination}:${row.meta.destinationPort}`,
      id: "destinaition",
      grow: 1,
    },
  ];
  return (
    <DataTable
      style={rowStyles}
      columns={columns}
      data={traces}
      customStyles={getCustomStyles(colorMode.colorMode)}
    />
  );
});

export default TraceList;
