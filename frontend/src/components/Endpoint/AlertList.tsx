import React from "react";
import { useColorMode, Badge, HStack, Code, Text } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { Alert } from "@common/types";
import { METHOD_TO_COLOR, RISK_TO_COLOR } from "../../constants";

interface AlertListProps {
  alerts: Alert[];
  showEndpoint?: boolean;
}

const AlertList: React.FC<AlertListProps> = React.memo(
  ({ alerts, showEndpoint }) => {
    const colorMode = useColorMode();
    let columns: TableColumn<Alert>[] = [
      {
        name: "Risk",
        sortable: true,
        selector: (row: Alert) => row.risk || "",
        cell: (row: Alert) => (
          <Badge
            p="1"
            fontSize="sm"
            colorScheme={RISK_TO_COLOR[row.risk]}
            pointerEvents="none"
          >
            {row.risk}
          </Badge>
        ),
        id: "risk",
        grow: 0,
      },
    ];
    if (showEndpoint) {
      columns.push({
        name: "Endpoint",
        sortable: true,
        selector: (row: Alert) => `${row.endpoint.method}_${row.endpoint.path}`,
        cell: (row: Alert) => (
          <HStack>
            <Badge
              fontSize="sm"
              px="2"
              py="1"
              colorScheme={METHOD_TO_COLOR[row.endpoint.method] || "gray"}
            >
              {row.endpoint.method.toUpperCase()}
            </Badge>
            <Code p="1" pointerEvents="none">
              {row.endpoint.path}
            </Code>
          </HStack>
        ),
        id: "endpoint",
        grow: 1,
      });
    }
    columns.push(
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
            {row.createdAt.toISOString()}
          </Text>
        ),
        id: "time",
        grow: 1,
      }
    );
    return (
      <DataTable
        style={rowStyles}
        columns={columns}
        data={alerts}
        customStyles={getCustomStyles(colorMode.colorMode)}
      />
    );
  }
);

export default AlertList;
