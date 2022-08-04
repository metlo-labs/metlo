import React from "react";
import { useColorMode, Badge } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { Alert } from "@common/types";
import { RISK_TO_COLOR } from "../../constants";

interface AlertListProps {
  alerts: Alert[];
}

const AlertList: React.FC<AlertListProps> = React.memo(({ alerts }) => {
  const colorMode = useColorMode();
  const columns: TableColumn<Alert>[] = [
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
    {
      name: "Type",
      sortable: true,
      selector: (row: Alert) => row.type || "",
      id: "type",
      grow: 1,
    },
    {
      name: "Description",
      sortable: true,
      selector: (row: Alert) => row.description || "",
      id: "title",
      grow: 2,
    },
    {
      name: "Time",
      sortable: true,
      selector: (row: Alert) => row.createdAt.toISOString(),
      id: "time",
      grow: 1,
    },
  ];
  return (
    <DataTable
      style={rowStyles}
      columns={columns}
      data={alerts}
      customStyles={getCustomStyles(colorMode.colorMode)}
    />
  );
});

export default AlertList;
