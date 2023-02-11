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
  VStack,
  StackDivider,
  useToast,
} from "@chakra-ui/react"
import SplitPane from "react-split-pane"
import { ImCross } from "icons/im/ImCross"
import { DateTime } from "luxon"
import DataTable, { TableColumn } from "react-data-table-component"
import { getCustomStyles, rowStyles } from "components/utils/TableUtils"
import { ApiTrace, DataField } from "@common/types"
import { statusCodeToColor } from "components/utils/StatusCode"
import TraceDetail from "./TraceDetail"
import EmptyView from "components/utils/EmptyView"
import { updateFullTraceCaptureEnabled } from "api/endpoints"
import { makeToast } from "utils"

interface TraceListProps {
  traces: ApiTrace[]
  dataFields?: DataField[]
  uuid?: string
  endpointUuid?: string
  fullTraceCaptureEnabled?: boolean
}

const getDateTimeString = (date: Date) =>
  DateTime.fromISO(date.toString()).toLocaleString(DateTime.DATETIME_SHORT)

const TraceList: React.FC<TraceListProps> = React.memo(
  ({ traces, dataFields, uuid, endpointUuid, fullTraceCaptureEnabled }) => {
    const [trace, setTrace] = useState<ApiTrace | undefined>()
    const [fullTraceCaptureEnabledState, setFullTraceCaptureEnabled] =
      useState<boolean>(fullTraceCaptureEnabled)
    const [updatingFullTrace, setUpdatingFullTrace] = useState<boolean>(false)
    const colorMode = useColorMode()
    const toast = useToast()
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

    const handleEnableFullTraceCapture = async (enabled: boolean) => {
      setUpdatingFullTrace(true)
      try {
        await updateFullTraceCaptureEnabled(endpointUuid, { enabled })
        setFullTraceCaptureEnabled(enabled)
        const title = enabled
          ? "Success! New traces will store the whole request and response..."
          : "New traces will have the request and response redacted..."
        toast(
          makeToast({
            title,
            status: "success",
            duration: 3000,
          }),
        )
      } catch (err) {
        toast(
          makeToast(
            {
              title: "Updating Full Trace Capture failed",
              status: "error",
              description: err.response?.data,
              duration: 3000,
            },
            err.response?.status,
          ),
        )
      } finally {
        setUpdatingFullTrace(false)
      }
    }

    const columns: TableColumn<ApiTrace>[] = [
      {
        name: "Code",
        sortable: true,
        selector: (row: ApiTrace) => row.responseStatus || "",
        cell: (row: ApiTrace) => (
          <Badge
            fontSize="sm"
            fontWeight="medium"
            px="2"
            py="1"
            colorScheme={statusCodeToColor(row.responseStatus) || "gray"}
            data-tag="allowRowEvents"
            pointerEvents="none"
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
          <Text pointerEvents="none" fontSize="sm" data-tag="allowRowEvents">
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
          <Code
            p="1"
            fontSize="sm"
            pointerEvents="none"
            data-tag="allowRowEvents"
          >
            {row.path}
          </Code>
        ),
        grow: 3,
        id: "path",
      },
      {
        name: "Source",
        sortable: false,
        selector: (row: ApiTrace) => row.meta.source,
        cell: (row: ApiTrace) => (
          <Text fontFamily="mono" fontSize="sm" data-tag="allowRowEvents">
            {row.meta.source}
          </Text>
        ),
        id: "source",
        width: "255px",
        hide: 1300,
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
          <Button
            border="0"
            variant="ghost"
            onClick={() => setTrace(undefined)}
          >
            <ImCross />
          </Button>
        </HStack>
        <Box h="calc(100% - 52px)">
          <TraceDetail trace={trace} dataFields={dataFields} />
        </Box>
      </Box>
    ) : null

    const tablePanel = (
      <VStack w="full" h="full" divider={<StackDivider />} spacing="0">
        {endpointUuid ? (
          <HStack
            px="4"
            py="2"
            w="full"
            justifyContent="flex-end"
            backgroundColor={headerBg}
          >
            {fullTraceCaptureEnabledState ? (
              <Button
                isLoading={updatingFullTrace}
                onClick={() => handleEnableFullTraceCapture(false)}
                size="md"
                variant="delete"
              >
                Disable Full Trace Capture
              </Button>
            ) : (
              <Button
                isLoading={updatingFullTrace}
                onClick={() => handleEnableFullTraceCapture(true)}
                size="md"
                variant="create"
              >
                Enable Full Trace Capture
              </Button>
            )}
          </HStack>
        ) : null}
        <Box w="full" flex="1" overflow="hidden">
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
        </Box>
      </VStack>
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
          <Box
            display="flex"
            flex={1}
            height="100%"
            position="absolute"
            outline="none"
            overflow="hidden"
            w="full"
          >
            {tablePanel}
          </Box>
        )}
      </Box>
    )
  },
)

export default TraceList
