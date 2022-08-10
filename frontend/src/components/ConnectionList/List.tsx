import React from "react";
import { Text, Image, useColorMode } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "components/utils/TableUtils";
import { Connection } from "@common/types";

interface ConnectionListProps {
  connections: Connection[];
}

const ConnectionList: React.FC<ConnectionListProps> = React.memo(
  ({ connections }) => {
    const colorMode = useColorMode();
    const columns: TableColumn<Connection>[] = [
      {
        name: "",
        sortable: true,
        selector: (row: Connection) => row.type || "",
        cell: (row: Connection) => (
          <Image
            height="8"
            src={`connections/${row.type}_${colorMode.colorMode}.svg`}
          />
        ),
        id: "icon",
        grow: 0,
      },
      {
        name: "Type",
        sortable: true,
        selector: (row: Connection) => row.type || "",
        cell: (row: Connection) => (
          <Text fontSize="sm" fontWeight="semibold">
            {row.type}
          </Text>
        ),
        id: "path",
        grow: 0,
      },
      {
        name: "Name",
        sortable: true,
        selector: (row: Connection) => row.name || "",
        cell: (row: Connection) => (
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
        selector: (row: Connection) => row.createdAt.toISOString() || "",
        cell: (row: Connection) => (
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
