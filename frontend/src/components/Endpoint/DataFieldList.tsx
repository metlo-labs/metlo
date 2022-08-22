import React, { useEffect, useState } from "react";
import {
  useColorMode,
  Code,
  Badge,
  useColorModeValue,
  HStack,
  StackDivider,
  Box,
  Heading,
  Button,
} from "@chakra-ui/react";
import { ImCross } from "@react-icons/all-files/im/ImCross";
import { ImCheckmark } from "@react-icons/all-files/im/ImCheckmark";
import DataTable, { TableColumn } from "react-data-table-component";
import { DataField } from "@common/types";
import { getCustomStyles, rowStyles } from "components/utils/TableUtils";
import { RISK_TO_COLOR, DATA_CLASS_TO_RISK_SCORE } from "~/constants";
import { getDateTimeString } from "utils";
import DataFieldDetail from "./DataFieldDetail";
import EmptyView from "components/utils/EmptyView";
import { RiskScore } from "@common/enums";

interface DataFieldListProps {
  dataFields: DataField[];
  uuid?: string;
}

const DataFieldList: React.FC<DataFieldListProps> = React.memo(
  ({ dataFields, uuid }) => {
    const [dataFieldList, setDataFieldList] = useState<DataField[]>(dataFields);
    const colorMode = useColorMode();
    const headerBg = useColorModeValue("rgb(252, 252, 252)", "rgb(17, 19, 23)");
    const divColor = useColorModeValue("rgb(216, 216, 216)", "black");
    const headerTextColor = useColorModeValue("gray.700", "gray.200");
    const [dataField, setDataField] = useState<DataField | undefined>();
    const selectedRowColor = useColorModeValue(
      "rgb(242, 242, 242)",
      "rgb(34, 37, 42)"
    );

    useEffect(() => {
      setDataFieldList(dataFields);
    }, [dataFields]);

    useEffect(() => {
      dataFieldList.forEach((currDataField) => {
        if (currDataField.uuid === uuid) {
          setDataField(currDataField);
        }
      });
    }, [dataFieldList, uuid]);

    const rowNotRiskBG =
      colorMode.colorMode == "light"
        ? {
            opacity: 0.3,
          }
        : {
            filter: "brightness(50%)",
          };

    const conditionalStyles = [
      {
        when: (row: DataField) => {
          if (!dataField) {
            return false;
          }
          return row.uuid == dataField.uuid;
        },
        style: {
          backgroundColor: selectedRowColor,
        },
      },
      {
        when: (row: DataField) => {
          return !row.isRisk;
        },
        style: rowNotRiskBG,
      },
    ];

    const columns: TableColumn<DataField>[] = [
      {
        name: "Risk Score",
        sortable: true,
        selector: (row: DataField) =>
          DATA_CLASS_TO_RISK_SCORE[row.dataClass] || "",
        cell: (row: DataField) => (
          <Badge
            p="1"
            fontSize="sm"
            colorScheme={RISK_TO_COLOR[DATA_CLASS_TO_RISK_SCORE[row.dataClass ?? ""]]}
            pointerEvents="none"
          >
            {DATA_CLASS_TO_RISK_SCORE[row.dataClass ?? ""]}
          </Badge>
        ),
        id: "riskScore",
        grow: 0.5,
      },
      {
        name: "Sensitive Data Class",
        sortable: true,
        selector: (row: DataField) => row.dataClass || "",
        id: "dataClass",
        grow: 1,
      },
      {
        name: "Data Path",
        sortable: true,
        selector: (row: DataField) => row.dataPath,
        cell: (row: DataField) => (
          <Code p="1" pointerEvents="none">
            {row.dataPath}
          </Code>
        ),
        id: "dataPath",
        grow: 1,
      },
      {
        name: "Date Identified",
        sortable: true,
        selector: (row: DataField) => getDateTimeString(row.createdAt) || "",
        id: "dateIdentified",
        grow: 1,
      },
      {
        name: "Fake",
        sortable: true,
        selector: (row: DataField) => row.isRisk,
        cell: (row: DataField) => (
          <Box data-tag="allowRowEvents" alignItems="end">
            {!row.isRisk && row.dataClass && <ImCheckmark color="#93DCAC" />}
          </Box>
        ),
        grow: 0,
      },
    ];

    return (
      <HStack
        h="full"
        divider={<StackDivider borderWidth="2px" />}
        spacing="0"
        w="full"
        alignItems="flex-start"
      >
        <Box w={dataField ? "calc(100% - 650px)" : "full"} h="full">
          <DataTable
            fixedHeader={true}
            fixedHeaderScrollHeight="100%"
            style={rowStyles}
            columns={columns}
            data={dataFieldList}
            conditionalRowStyles={conditionalStyles}
            customStyles={getCustomStyles(colorMode.colorMode)}
            onRowClicked={setDataField}
            noDataComponent={<EmptyView notRounded text="No Fields!" />}
          />
        </Box>
        {dataField ? (
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
              <Button variant="ghost" onClick={() => setDataField(undefined)}>
                <ImCross />
              </Button>
            </HStack>
            <Box h="calc(100% - 52px)">
              <DataFieldDetail
                dataField={dataField}
                dataFieldList={dataFieldList}
                setdataFieldList={setDataFieldList}
              />
            </Box>
          </Box>
        ) : null}
      </HStack>
    );
  }
);

export default DataFieldList;
