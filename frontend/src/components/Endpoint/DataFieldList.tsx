import React, { useEffect, useState } from "react"
import {
  useColorMode,
  Code,
  Badge,
  useColorModeValue,
  HStack,
  Box,
  Heading,
  Button,
  Text,
} from "@chakra-ui/react"
import SplitPane from "react-split-pane"
import { ImCross } from "@react-icons/all-files/im/ImCross"
import DataTable, { TableColumn } from "react-data-table-component"
import { DataField } from "@common/types"
import { getCustomStyles, rowStyles } from "components/utils/TableUtils"
import { RISK_TO_COLOR, TAG_TO_COLOR } from "~/constants"
import {
  getDateTimeString,
  getMaxRiskScoreFromList,
  getRiskScores,
} from "utils"
import DataFieldDetail from "./DataFieldDetail"
import EmptyView from "components/utils/EmptyView"
import { DataSection } from "@common/enums"
import { DATA_SECTION_TO_LABEL_MAP } from "@common/maps"

interface DataFieldListProps {
  dataFields: DataField[]
  uuid?: string
}

interface FieldSection {
  section: DataSection
  dataFields: DataField[]
}

const columns: TableColumn<DataField>[] = [
  {
    name: "Tag",
    selector: (row: DataField) => row.dataTag,
    cell: (row: DataField) => (
      <Box pointerEvents="none">
        {row.dataTag && (
          <Badge
            py="1"
            px="2"
            fontSize="sm"
            colorScheme={TAG_TO_COLOR[row.dataTag]}
            pointerEvents="none"
          >
            {row.dataTag}
          </Badge>
        )}
      </Box>
    ),
    grow: 0,
  },
  {
    name: "Risk Score",
    sortable: true,
    selector: (row: DataField) =>
      getMaxRiskScoreFromList(getRiskScores(row.dataClasses)) || "",
    cell: (row: DataField) => (
      <Badge
        p="1"
        fontSize="sm"
        colorScheme={
          RISK_TO_COLOR[getMaxRiskScoreFromList(getRiskScores(row.dataClasses))]
        }
        pointerEvents="none"
      >
        {getMaxRiskScoreFromList(getRiskScores(row.dataClasses))}
      </Badge>
    ),
    id: "riskScore",
    grow: 0.5,
  },
  {
    name: "Sensitive Data Classes",
    sortable: true,
    selector: (row: DataField) => row.dataClasses.join(", ") || "",
    id: "dataClasses",
    grow: 1,
  },
  {
    name: "Field",
    sortable: true,
    selector: (row: DataField) => row.dataPath,
    cell: (row: DataField) => (
      <Box pointerEvents="none">
        {row.dataPath ? (
          <Code p="1" pointerEvents="none">
            {row.dataPath}
          </Code>
        ) : (
          <Text>None</Text>
        )}
      </Box>
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
]

const expandableTableColumns: TableColumn<FieldSection>[] = [
  {
    name: "Section",
    selector: (row: FieldSection) => DATA_SECTION_TO_LABEL_MAP[row?.section],
  },
]

const DataFieldList: React.FC<DataFieldListProps> = React.memo(
  ({ dataFields, uuid }) => {
    const [dataFieldList, setDataFieldList] = useState<DataField[]>(dataFields)
    const colorMode = useColorMode()
    const headerBg = useColorModeValue("rgb(252, 252, 252)", "rgb(17, 19, 23)")
    const divColor = useColorModeValue("rgb(216, 216, 216)", "black")
    const headerTextColor = useColorModeValue("gray.700", "gray.200")
    const [dataField, setDataField] = useState<DataField | undefined>()
    const [dataSections, setDataSections] = useState<FieldSection[]>([
      {
        section: DataSection.REQUEST_PATH,
        dataFields: [],
      },
      {
        section: DataSection.REQUEST_HEADER,
        dataFields: [],
      },
      {
        section: DataSection.REQUEST_QUERY,
        dataFields: [],
      },
      {
        section: DataSection.REQUEST_BODY,
        dataFields: [],
      },
      {
        section: DataSection.RESPONSE_HEADER,
        dataFields: [],
      },
      {
        section: DataSection.RESPONSE_BODY,
        dataFields: [],
      },
    ])
    const selectedRowColor = useColorModeValue(
      "rgb(242, 242, 242)",
      "rgb(34, 37, 42)",
    )

    useEffect(() => {
      setDataFieldList(dataFields)
    }, [dataFields])

    useEffect(() => {
      const tempReqPath = []
      const tempReqHeader = []
      const tempReqQuery = []
      const tempReqBody = []
      const tempResHeader = []
      const tempResBody = []
      dataFieldList.forEach(currDataField => {
        if (currDataField.uuid === uuid) {
          setDataField(currDataField)
        }
        switch (currDataField.dataSection) {
          case DataSection.REQUEST_PATH:
            tempReqPath.push(currDataField)
            break
          case DataSection.REQUEST_HEADER:
            tempReqHeader.push(currDataField)
            break
          case DataSection.REQUEST_QUERY:
            tempReqQuery.push(currDataField)
            break
          case DataSection.REQUEST_BODY:
            tempReqBody.push(currDataField)
            break
          case DataSection.RESPONSE_HEADER:
            tempResHeader.push(currDataField)
            break
          case DataSection.RESPONSE_BODY:
            tempResBody.push(currDataField)
          default:
            break
        }
      })
      setDataSections([
        {
          section: DataSection.REQUEST_PATH,
          dataFields: tempReqPath,
        },
        {
          section: DataSection.REQUEST_HEADER,
          dataFields: tempReqHeader,
        },
        {
          section: DataSection.REQUEST_QUERY,
          dataFields: tempReqQuery,
        },
        {
          section: DataSection.REQUEST_BODY,
          dataFields: tempReqBody,
        },
        {
          section: DataSection.RESPONSE_HEADER,
          dataFields: tempResHeader,
        },
        {
          section: DataSection.RESPONSE_BODY,
          dataFields: tempResBody,
        },
      ])
    }, [dataFieldList, uuid])

    const conditionalStyles = [
      {
        when: (row: DataField) => {
          if (!dataField) {
            return false
          }
          return row.uuid == dataField.uuid
        },
        style: {
          backgroundColor: selectedRowColor,
        },
      },
    ]

    const expandedComponent = (data: FieldSection) => (
      <DataTable
        data={data.dataFields}
        columns={columns}
        noTableHead
        onRowClicked={setDataField}
        style={rowStyles}
        customStyles={getCustomStyles(colorMode.colorMode, true)}
        conditionalRowStyles={conditionalStyles}
        noDataComponent={
          <EmptyView
            minH="100px"
            text={`No ${DATA_SECTION_TO_LABEL_MAP[data.section]} fields.`}
            notRounded
          />
        }
      />
    )

    const expandableTable = (
      <DataTable
        expandableRows
        columns={expandableTableColumns}
        data={dataSections}
        noTableHead
        style={rowStyles}
        customStyles={getCustomStyles(colorMode.colorMode)}
        expandableRowsComponent={props => expandedComponent(props.data)}
        expandableRowExpanded={row => row.dataFields?.length > 0}
      />
    )

    const tablePanel = (
      <DataTable
        fixedHeader={true}
        fixedHeaderScrollHeight="100%"
        style={rowStyles}
        columns={columns}
        data={[]}
        persistTableHead={dataFieldList.length > 0}
        customStyles={getCustomStyles(colorMode.colorMode)}
        noDataComponent={
          dataFieldList.length === 0 ? (
            <EmptyView notRounded text="No Fields!" />
          ) : (
            expandableTable
          )
        }
      />
    )

    const detailPanel = dataField ? (
      <Box h="full">
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
            setDataField={setDataField}
          />
        </Box>
      </Box>
    ) : null

    return (
      <Box h="full" w="full" position="relative">
        {dataField ? (
          /* @ts-ignore */
          <SplitPane
            split="vertical"
            minSize="0"
            defaultSize="60%"
            paneStyle={{ overflow: "hidden" }}
          >
            {tablePanel}
            {detailPanel}
          </SplitPane>
        ) : (
          tablePanel
        )}
      </Box>
    )
  },
)

export default DataFieldList
