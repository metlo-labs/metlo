import React, { useState } from "react";
import { useColorMode, Code, HStack, Badge, Text, useDisclosure, Box } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { ApiTrace } from "@common/types";
import { METHOD_TO_COLOR } from "../../constants";
import { statusCodeToColor } from "../utils/StatusCode";
import { getDateTimeString } from "../../utils";
import TraceDetail from "./TraceDetail";

interface TraceListProps {
  traces: ApiTrace[];
}

const TraceList: React.FC<TraceListProps> = React.memo(({ traces }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [ trace, setTrace ] = useState<ApiTrace | undefined>();
  const colorMode = useColorMode();

  const openModal = (trace: ApiTrace) => {
    setTrace(trace);
    onOpen();
  }

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
      cell: (row: ApiTrace) => (
        <Text
          fontFamily="mono"
          fontSize="sm"
        >{`${row.meta.source}:${row.meta.sourcePort}`}</Text>
      ),
      id: "source",
      grow: 1,
    },
    {
      name: "Destination",
      sortable: true,
      selector: (row: ApiTrace) =>
        `${row.meta.destination}:${row.meta.destinationPort}`,
      cell: (row: ApiTrace) => (
        <Text
          fontFamily="mono"
          fontSize="sm"
        >{`${row.meta.destination}:${row.meta.destinationPort}`}</Text>
      ),
      id: "destinaition",
      grow: 1,
    },
    {
      name: "Time",
      sortable: true,
      selector: (row: ApiTrace) =>
        `${row.createdAt}`,
      cell: (row: ApiTrace) => (
        <Text
          fontFamily="mono"
          fontSize="sm"
        >{getDateTimeString(row.createdAt)}</Text>
      )
    }
  ];
  return (
    <Box>
      <TraceDetail trace={trace} isOpen={isOpen} onClose={onClose} />
      <DataTable
        style={rowStyles}
        columns={columns}
        data={traces}
        customStyles={getCustomStyles(colorMode.colorMode)}
        onRowClicked={(row) => openModal(row)}
      />
    </Box>
  );
});

export default TraceList;
