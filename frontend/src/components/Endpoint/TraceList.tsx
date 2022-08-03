import React from "react";
import { useColorMode, Code } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { TraceParams } from "../../../../common/dist/types";

interface TraceListProps {
  traces: TraceParams[];
}

const TraceList: React.FC<TraceListProps> = React.memo(({ traces }) => {
  const colorMode = useColorMode();
  const columns: TableColumn<TraceParams>[] = [
    {
      name: "Path",
      sortable: true,
      selector: (row: TraceParams) => row.request.url.path || "",
      cell: (row: TraceParams) => (
        <Code p="1" pointerEvents="none">
          {row.request.url.path}
        </Code>
      ),
      id: "path",
      grow: 2,
    },
    {
      name: "Source",
      sortable: true,
      selector: (row: TraceParams) =>
        `${row.meta.source}:${row.meta.sourcePort}`,
      id: "source",
      grow: 1,
    },
    {
      name: "Destination",
      sortable: true,
      selector: (row: TraceParams) =>
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
