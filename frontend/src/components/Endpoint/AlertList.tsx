import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  useColorMode,
  Badge,
  HStack,
  Code,
  Text,
  Box,
  StackDivider,
  useColorModeValue,
  Heading,
  Button,
} from "@chakra-ui/react";
import { ImCheckmark } from "@react-icons/all-files/im/ImCheckmark";
import { ImCross } from "@react-icons/all-files/im/ImCross";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "components/utils/TableUtils";
import { Alert } from "@common/types";
import { METHOD_TO_COLOR, RISK_TO_COLOR } from "~/constants";
import { getDateTimeString } from "utils";
import AlertDetail from "./AlertDetail";
import { RestMethod } from "@common/enums";
import EmptyView from "components/utils/EmptyView";

interface AlertListProps {
  alerts: Alert[];
  endpointPage?: boolean;
  method?: RestMethod;
  path?: string;
  uuid?: string;
}

const AlertList: React.FC<AlertListProps> = React.memo(
  ({ alerts, endpointPage, method, path, uuid }) => {
    const [alertList, setAlertList] = useState<Alert[]>(alerts);
    const router = useRouter();
    const colorMode = useColorMode();
    const headerBg = useColorModeValue("rgb(252, 252, 252)", "rgb(17, 19, 23)");
    const divColor = useColorModeValue("rgb(216, 216, 216)", "black");
    const headerTextColor = useColorModeValue("gray.700", "gray.200");
    const [alert, setAlert] = useState<Alert | undefined>();

    useEffect(() => {
      setAlertList(alerts);
    }, [alerts]);

    useEffect(() => {
      alertList.forEach((currAlert) => {
        if (currAlert.uuid === uuid) {
          setAlert(currAlert);
        }
      });
    }, [alertList, uuid]);

    const onRowClicked = (
      row: Alert,
      e: React.MouseEvent<Element, MouseEvent>
    ) => {
      if (endpointPage) {
        setAlert(row);
      } else {
        router.push({
          pathname: `/endpoint/${row.apiEndpointUuid}`,
          query: { tab: "alerts", uuid: row.uuid },
        });
      }
    };

    const selectedRowColor = useColorModeValue(
      "rgb(242, 242, 242)",
      "rgb(34, 37, 42)"
    );

    const conditionalStyles = [
      {
        when: (row: Alert) => {
          if (!alert) {
            return false;
          }
          return row.uuid == alert.uuid;
        },
        style: {
          backgroundColor: selectedRowColor,
        },
      },
    ];

    let columns: TableColumn<Alert>[] = [
      {
        name: "Risk",
        sortable: true,
        selector: (row: Alert) => row.riskScore || "",
        cell: (row: Alert) => (
          <Badge
            data-tag="allowRowEvents"
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
        selector: (row: Alert) =>
          `${row.apiEndpoint.method}_${row.apiEndpoint.path}`,
        cell: (row: Alert) => (
          <HStack data-tag="allowRowEvents">
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
          <Text data-tag="allowRowEvents" fontSize="sm" fontWeight="semibold">
            {row.type}
          </Text>
        ),
        id: "type",
        grow: 1,
      },
      {
        name: "Time",
        sortable: true,
        selector: (row: Alert) => row.createdAt.toISOString(),
        cell: (row: Alert) => (
          <Text data-tag="allowRowEvents" fontSize="sm" fontWeight="semibold">
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
          <Box data-tag="allowRowEvents" alignItems={"end"}>
            {row.resolved ? (
              <ImCheckmark color="#93DCAC" />
            ) : (
              <ImCross color="#FDB2B2" />
            )}
          </Box>
        ),
        center: true,
        id: "resolved",
        grow: 0,
      });
    }

    return (
      <HStack
        h="full"
        divider={<StackDivider borderWidth="2px" />}
        spacing="0"
        w="full"
        alignItems="flex-start"
      >
        <Box w={alert ? "calc(100% - 650px)" : "full"} h="full">
          <DataTable
            fixedHeader={true}
            fixedHeaderScrollHeight="100%"
            style={rowStyles}
            columns={columns}
            data={alertList}
            conditionalRowStyles={conditionalStyles}
            customStyles={getCustomStyles(colorMode.colorMode)}
            onRowClicked={onRowClicked}
            noDataComponent={<EmptyView notRounded text="No Alerts!" />}
          />
        </Box>
        {alert ? (
          <Box w="650px" h="full">
            <HStack
              w="full"
              justifyContent="space-between"
              alignItems="center"
              height="52px"
              px="4"
              borderBottom="1px"
              borderColor={divColor}
              color={headerTextColor}
              bg={headerBg}
            >
              <Heading size="md">Details</Heading>
              <Button variant="ghost" onClick={() => setAlert(undefined)}>
                <ImCross />
              </Button>
            </HStack>
            <Box h="calc(100% - 52px)">
              <AlertDetail
                alert={alert}
                method={method}
                path={path}
                alertList={alertList}
                setAlertList={setAlertList}
              />
            </Box>
          </Box>
        ) : null}
      </HStack>
    );
  }
);

export default AlertList;
