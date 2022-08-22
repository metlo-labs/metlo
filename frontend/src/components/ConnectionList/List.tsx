import React, { useState } from "react";
import { Text, Image, useColorMode, useDisclosure } from "@chakra-ui/react";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "components/utils/TableUtils";
import { ConnectionInfo } from "@common/types";
import { useRouter } from "next/router";
import ConnectionSelector from "components/ConnectionInfo/connectionSelector";

interface ConnectionListProps {
  connections: ConnectionInfo[];
  selectedConnection?: string;
  setConnections: (v: ConnectionInfo[]) => void;
}

const ConnectionList: React.FC<ConnectionListProps> = React.memo(
  ({ connections, selectedConnection, setConnections }) => {
    const router = useRouter();
    const colorMode = useColorMode();
    const [openConnection, setOpenConnection] = useState(selectedConnection);

    const onConnectionUpdate = (updatedConnection: ConnectionInfo) => {
      const newConns = connections.map((v) => {
        if (v.uuid == updatedConnection.uuid) {
          return updatedConnection;
        }
        return v;
      });
      setConnections(newConns);
    };

    const {
      isOpen,
      onOpen: _onOpen,
      onClose: _onClose,
    } = useDisclosure({ isOpen: !!selectedConnection });

    const onOpen = (connectionId: string) => {
      setOpenConnection(connectionId);
      router.push(`?id=${connectionId}`, undefined, { shallow: true });
      _onOpen();
    };

    const onClose = () => {
      const currentURL = new URL(window.location.href);
      router.push(currentURL.origin + currentURL.pathname, undefined, {
        shallow: true,
      });
      setOpenConnection(null);
      _onClose();
    };

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
      <>
        <ConnectionSelector
          connection={connections.find((v) => v.uuid === openConnection)}
          setConnectionUpdated={onConnectionUpdate}
          isOpen={isOpen}
          onClose={onClose}
        />
        <DataTable
          style={rowStyles}
          columns={columns}
          data={connections}
          customStyles={getCustomStyles(colorMode.colorMode)}
          onRowClicked={(row, evt) => {
            onOpen(row.uuid);
          }}
        />
      </>
    );
  }
);

export default ConnectionList;
