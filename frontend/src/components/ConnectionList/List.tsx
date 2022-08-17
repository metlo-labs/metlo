import React from "react";
import { Text, Image, useColorMode } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "components/utils/TableUtils";
import { ListConnections } from "@common/types";

interface ConnectionListProps {
  connections: ListConnections[];
}

const ConnectionList: React.FC<ConnectionListProps> = React.memo(
  ({ connections }) => {
    const colorMode = useColorMode();
    const columns: TableColumn<ListConnections>[] = [
      {
        name: "",
        sortable: true,
        selector: (row: ListConnections) => row.connectionType || "",
        cell: (row: ListConnections) => (
          <Image
            alt={`${row.connectionType}-image`}
            height="8"
            src={`connections/${row.connectionType}_${colorMode.colorMode}.svg`}
          />
        ),
        id: "icon",
        grow: 0,
      },
      {
        name: "Type",
        sortable: true,
        selector: (row: ListConnections) => row.connectionType || "",
        cell: (row: ListConnections) => (
          <Text fontSize="sm" fontWeight="semibold">
            {row.connectionType}
          </Text>
        ),
        id: "path",
        grow: 0,
      },
      {
        name: "Name",
        sortable: true,
        selector: (row: ListConnections) => row.name || "",
        cell: (row: ListConnections) => (
          <Text fontSize="sm" fontWeight="semibold">
            {row.name}
          </Text>
        ),
        id: "name",
        grow: 1,
      },
      {
        name: "Created",
        sortable: true,
        selector: (row: ListConnections) => row.createdAt.toISOString() || "",
        cell: (row: ListConnections) => (
          <Text fontSize="sm" fontWeight="semibold">
            {row.createdAt.toISOString()}
          </Text>
        ),
        id: "created",
        grow: 1,
      },
    ];
    return (
      <DataTable
        style={rowStyles}
        columns={columns}
        data={connections}
        customStyles={getCustomStyles(colorMode.colorMode)}
      />
    );
  }
);

export default ConnectionList;
