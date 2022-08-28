import React, { useState, useEffect } from "react"
import {
  useColorMode,
  Code,
  HStack,
  Badge,
  Text,
  Box,
  Button,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react"
import SplitPane from "react-split-pane"
import { ImCross } from "@react-icons/all-files/im/ImCross"
import { DateTime } from "luxon"
import DataTable, { TableColumn } from "react-data-table-component"
import { getCustomStyles, rowStyles } from "components/utils/TableUtils"
import { ApiTrace } from "@common/types"
import { METHOD_TO_COLOR } from "~/constants"
import { statusCodeToColor } from "components/utils/StatusCode"
import TraceDetail from "./TraceDetail"
import EmptyView from "components/utils/EmptyView"

interface TraceListProps {
  traces: ApiTrace[]
  uuid?: string
}

const getDateTimeString = (date: Date) =>
  DateTime.fromISO(date.toString()).toLocaleString(DateTime.DATETIME_SHORT)

const TraceList: React.FC<TraceListProps> = React.memo(({ traces, uuid }) => {
  const [trace, setTrace] = useState<ApiTrace | undefined>()
  const colorMode = useColorMode()
  const headerBg = useColorModeValue("rgb(252, 252, 252)", "rgb(17, 19, 23)")
  const divColor = useColorModeValue("rgb(216, 216, 216)", "black")
  const headerTextColor = useColorModeValue("gray.700", "gray.200")
  const selectedRowColor = useColorModeValue(
    "rgb(242, 242, 242)",
    "rgb(34, 37, 42)",
  )

  useEffect(() => {
    traces.forEach(currTrace => {
      if (currTrace.uuid === uuid) {
        setTrace(currTrace)
      }
    })
  }, [traces, uuid])

  const conditionalStyles = [
    {
      when: (row: ApiTrace) => {
        if (!trace) {
          return false
        }
        return row.uuid == trace.uuid
      },
      style: {
        backgroundColor: selectedRowColor,
      },
    },
  ]

  const columns: TableColumn<ApiTrace>[] = [
    {
      name: "Code",
      sortable: true,
      selector: (row: ApiTrace) => row.responseStatus || "",
      cell: (row: ApiTrace) => (
        <Badge
          fontSize="sm"
          px="2"
          py="1"
          colorScheme={statusCodeToColor(row.responseStatus) || "gray"}
          data-tag="allowRowEvents"
        >
          {row.responseStatus}
        </Badge>
      ),
      id: "code",
      minWidth: "unset",
      grow: 0,
    },
    {
      name: "Time",
      selector: (row: ApiTrace) => `${row.createdAt}`,
      cell: (row: ApiTrace) => (
        <Text fontSize="sm" data-tag="allowRowEvents">
          {getDateTimeString(row.createdAt)}
        </Text>
      ),
      id: "time",
      width: "160px",
    },
    {
      name: "Path",
      sortable: true,
      selector: (row: ApiTrace) => `${row.method}-${row.path}`,
      cell: (row: ApiTrace) => (
        <HStack w="full" data-tag="allowRowEvents">
          <Badge
            fontSize="sm"
            px="2"
            py="1"
            colorScheme={METHOD_TO_COLOR[row.method] || "gray"}
            data-tag="allowRowEvents"
          >
            {row.method.toUpperCase()}
          </Badge>
          <Code
            p="1"
            fontSize="sm"
            pointerEvents="none"
            whiteSpace="nowrap"
            data-tag="allowRowEvents"
          >
            {row.path}
          </Code>
        </HStack>
      ),
      grow: 1,
      id: "path",
    },
    {
      name: "Source",
      sortable: true,
      selector: (row: ApiTrace) => `${row.meta.source}:${row.meta.sourcePort}`,
      cell: (row: ApiTrace) => (
        <Text
          fontFamily="mono"
          fontSize="sm"
          data-tag="allowRowEvents"
        >{`${row.meta.source}:${row.meta.sourcePort}`}</Text>
      ),
      id: "source",
      width: "225px",
      hide: 1400,
    },
  ]

  const tracePanel = trace ? (
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
        <Button variant="ghost" onClick={() => setTrace(undefined)}>
          <ImCross />
        </Button>
      </HStack>
      <Box h="calc(100% - 52px)">
        <TraceDetail trace={trace} />
      </Box>
    </Box>
  ) : null

  const tablePanel = (
    <DataTable
      fixedHeader={true}
      fixedHeaderScrollHeight="100%"
      style={rowStyles}
      conditionalRowStyles={conditionalStyles}
      columns={columns}
      data={traces}
      customStyles={getCustomStyles(colorMode.colorMode)}
      onRowClicked={setTrace}
      noDataComponent={<EmptyView notRounded text="No Traces!" />}
    />
  )

  return (
    <Box h="full" w="full" position="relative">
      {trace ? (
        /* @ts-ignore */
        <SplitPane
          split="vertical"
          minSize="0"
          defaultSize="60%"
          paneStyle={{ overflow: "hidden" }}
        >
          {tablePanel}
          {tracePanel}
        </SplitPane>
      ) : (
        tablePanel
      )}
    </Box>
  )
})

export default TraceList
