import React, { useState } from "react";
import { useRouter } from "next/router";
import { useColorMode, Badge, HStack, Code, Text, Box, useDisclosure } from "@chakra-ui/react";
import { ImCheckmark } from "@react-icons/all-files/im/ImCheckmark";
import { ImCross } from "@react-icons/all-files/im/ImCross";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { Alert } from "@common/types";
import { METHOD_TO_COLOR, RISK_TO_COLOR } from "../../constants";
import { getDateTimeString } from "../../utils";
import AlertDetail from "./AlertDetail";
import { RestMethod } from "@common/enums";

interface AlertListProps {
  alerts: Alert[];
  endpointPage?: boolean;
  method?: RestMethod;
  path?: string;
}

const AlertList: React.FC<AlertListProps> = React.memo(
  ({ alerts, endpointPage, method, path }) => {
    const router = useRouter();
    const colorMode = useColorMode();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [alert, setAlert ] = useState<Alert| undefined>();
    const [resolutionMessage, setResolutionMessage] = useState<string>();
    const onRowClicked = (
      row: Alert,
      e: React.MouseEvent<Element, MouseEvent>
    ) => {
      if (endpointPage) {
        setResolutionMessage(row.resolutionMessage);
        openModal(row);
      } else {
        router.push({ pathname: `/endpoint/${row.apiEndpointUuid}`, query: { tab: "alerts"} })
      }
    }
    const openModal = (alert: Alert) => {
      setAlert(alert);
      onOpen();
    }

    let columns: TableColumn<Alert>[] = [
      {
        name: "Risk",
        sortable: true,
        selector: (row: Alert) => row.riskScore || "",
        cell: (row: Alert) => (
          <Badge
            p="1"
            fontSize="sm"
            colorScheme={RISK_TO_COLOR[row.riskScore]}
            pointerEvents="none"
          >
            {row.riskScore}
          </Badge>
        ),
        id: "risk",
        grow: 0,
      },
    ];
    if (!endpointPage) {
      columns.push({
        name: "Endpoint",
        sortable: true,
        selector: (row: Alert) => `${row.apiEndpoint.method}_${row.apiEndpoint.path}`,
        cell: (row: Alert) => (
          <HStack>
            <Badge
              fontSize="sm"
              px="2"
              py="1"
              colorScheme={METHOD_TO_COLOR[row.apiEndpoint.method] || "gray"}
            >
              {row.apiEndpoint.method.toUpperCase()}
            </Badge>
            <Code p="1" pointerEvents="none">
              {row.apiEndpoint.path}
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
            {getDateTimeString(row.createdAt)}
          </Text>
        ),
        id: "time",
        grow: 1,
      }
    );
    if (endpointPage) {
      columns.push({
          name: "Resolved",
          sortable: true,
          selector: (row: Alert) => row.resolved,
          cell: (row: Alert) => (
            <Box alignItems={"end"}>
              {row.resolved ? <ImCheckmark color="#93DCAC" /> : <ImCross color="#FDB2B2" />}
            </Box>
          ),
          center: true,
          id: "resolved",
          grow: 0,
      })
    }
    return (
      <Box>
        <AlertDetail resolutionMessage={resolutionMessage} setResolutionMessage={setResolutionMessage} alert={alert} isOpen={isOpen} onClose={onClose} method={method} path={path} />
        <DataTable
          style={rowStyles}
          columns={columns}
          data={alerts}
          customStyles={getCustomStyles(colorMode.colorMode)}
          onRowClicked={onRowClicked}
        />
      </Box>
    );
  }
);

export default AlertList;
