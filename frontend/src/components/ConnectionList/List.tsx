import React from "react";
import { Text, Image, useColorMode } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "components/utils/TableUtils";
import { ConnectionInfo } from "@common/types";
import { useRouter } from "next/router";

interface ConnectionListProps {
  connections: ConnectionInfo[];
}

const ConnectionList: React.FC<ConnectionListProps> = React.memo(
  ({ connections }) => {
    const router = useRouter();
    const colorMode = useColorMode();
    const columns: TableColumn<ConnectionInfo>[] = [
      {
        name: "",
        sortable: true,
        selector: (row: ConnectionInfo) => row.connectionType || "",
        cell: (row: ConnectionInfo) => (
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
        selector: (row: ConnectionInfo) => row.connectionType || "",
        cell: (row: ConnectionInfo) => (
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
        selector: (row: ConnectionInfo) => row.name || "",
        cell: (row: ConnectionInfo) => (
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
        selector: (row: ConnectionInfo) => row.createdAt.toISOString() || "",
        cell: (row: ConnectionInfo) => (
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
        onRowClicked={(row, evt) => {
          router.push(`/connections/${row.uuid}`);
        }}
      />
    );
  }
);

export default ConnectionList;
