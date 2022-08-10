import React, { useEffect, useState } from "react";
import { useColorMode, Code, Badge, useColorModeValue, HStack, StackDivider, Box, Heading, Button } from "@chakra-ui/react";
import { ImCross } from "@react-icons/all-files/im/ImCross";
import { ImCheckmark } from "@react-icons/all-files/im/ImCheckmark";
import { PIIField } from "@common/types";
import DataTable, { TableColumn } from "react-data-table-component";
import { getCustomStyles, rowStyles } from "../utils/TableUtils";
import { RISK_TO_COLOR, DATA_CLASS_TO_RISK_SCORE } from "../../constants";
import { getDateTimeString } from "../../utils";
import PIIDataDetail from "./PIIDataDetail";
import EmptyView from "components/utils/EmptyView";

interface PIIDataListProps {
  piiFields: PIIField[];
}

const PIIDataList: React.FC<PIIDataListProps> = React.memo(({ piiFields }) => {
  const [piiFieldList, setPiiFieldList] = useState<PIIField[]>(piiFields);
  const colorMode = useColorMode();
  const headerBg = useColorModeValue("rgb(252, 252, 252)", "rgb(17, 19, 23)");
  const divColor = useColorModeValue("rgb(216, 216, 216)", "black");
  const headerTextColor = useColorModeValue("gray.700", "gray.200");
  const [piiField, setPiiField] = useState<PIIField| undefined>();

  useEffect(() => {
    setPiiFieldList(piiFields);
  }, [piiFields]);

  const selectedRowColor = useColorModeValue(
    "rgb(242, 242, 242)",
    "rgb(34, 37, 42)"
  );

  const conditionalStyles = [
    {
      when: (row: PIIField) => {
        if (!piiField) {
          return false;
        }
        return row.uuid == piiField.uuid;
      },
      style: {
        backgroundColor: selectedRowColor,
      },
    },
  ];

  const columns: TableColumn<PIIField>[] = [
    {
      name: "Risk Score",
      sortable: true,
      selector: (row: PIIField) => DATA_CLASS_TO_RISK_SCORE[row.dataClass] || "",
      cell: (row: PIIField) => (
        <Badge
          p="1"
          fontSize="sm"
          colorScheme={RISK_TO_COLOR[DATA_CLASS_TO_RISK_SCORE[row.dataClass]]}
          pointerEvents="none"
        >
          {DATA_CLASS_TO_RISK_SCORE[row.dataClass]}
        </Badge>
      ),
      id: "riskScore",
      grow: 0.5,
    },
    {
      name: "Data Type",
      sortable: true,
      selector: (row: PIIField) => row.dataClass || "",
      id: "dataType",
      grow: 1,
    },
    {
      name: "Data Path",
      sortable: true,
      selector: (row: PIIField) => row.dataPath,
      cell: (row: PIIField) => (
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
      selector: (row: PIIField) => getDateTimeString(row.createdAt) || "",
      id: "dateIdentified",
      grow: 1,
    },
    {
      name: "Fake",
      sortable: true,
      selector: (row: PIIField) => row.isRisk,
      cell: (row: PIIField) => (
        <Box data-tag="allowRowEvents" alignItems="end">
          {!row.isRisk && <ImCheckmark color="#93DCAC" />}
        </Box>
      ),
      grow: 0,
    }
  ];

  return (
    <HStack
        h="full"
        divider={<StackDivider borderWidth="2px" />}
        spacing="0"
        w="full"
        alignItems="flex-start"
    >
      <Box w={piiField ? "calc(100% - 650px)" : "full"} h="full">
        <DataTable
          fixedHeader={true}
          fixedHeaderScrollHeight="100%"
          style={rowStyles}
          columns={columns}
          data={piiFieldList}
          conditionalRowStyles={conditionalStyles}
          customStyles={getCustomStyles(colorMode.colorMode)}
          onRowClicked={setPiiField}
          noDataComponent={<EmptyView notRounded text="No PII Fields!" />}
        />
      </Box>
      {piiField ? (
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
            <Button variant="ghost" onClick={() => setPiiField(undefined)}>
              <ImCross />
            </Button>
          </HStack>
          <Box h="calc(100% - 52px)">
            <PIIDataDetail piiField={piiField} piiFieldList={piiFieldList} setPiiFieldList={setPiiFieldList}  />
          </Box>
        </Box>
      ) : null}
    </HStack>
  );
});

export default PIIDataList;
