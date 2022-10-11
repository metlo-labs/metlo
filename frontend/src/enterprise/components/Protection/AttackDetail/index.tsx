import React, { useState } from "react"
import NextLink from "next/link"
import SplitPane from "react-split-pane"
import { ImCross } from "@react-icons/all-files/im/ImCross"
import DataTable, { TableColumn } from "react-data-table-component"
import { HiShieldCheck } from "@react-icons/all-files/hi/HiShieldCheck"
import { FiCheckCircle } from "@react-icons/all-files/fi/FiCheckCircle"
import { FiClock } from "@react-icons/all-files/fi/FiClock"
import { ChevronDownIcon } from "@chakra-ui/icons"
import {
  Badge,
  Box,
  Button,
  Code,
  Divider,
  Grid,
  GridItem,
  Heading,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react"
import { ApiTrace, Attack } from "@common/types"
import { DataAttribute, DataHeading } from "components/utils/Card"
import TraceDetail from "components/Endpoint/TraceDetail"
import { METHOD_TO_COLOR, RISK_TO_COLOR, STATUS_TO_COLOR } from "~/constants"
import { Status } from "@common/enums"
import { getDateTimeString, makeToast } from "utils"
import { statusCodeToColor } from "components/utils/StatusCode"
import { getCustomStyles, rowStyles } from "components/utils/TableUtils"
import EmptyView from "components/utils/EmptyView"
import { resolveAttack } from "api/attacks"

interface AttackDetailPageProps {
  initialAttack: Attack
  traces: ApiTrace[]
}

export const AttackDetailPage: React.FC<AttackDetailPageProps> = React.memo(
  ({ initialAttack, traces }) => {
    const [attack, setAttack] = useState<Attack>(initialAttack)
    const [resolving, setResolving] = useState<boolean>(false)
    const [trace, setTrace] = useState<ApiTrace | undefined>()
    const headerColor = "rgb(179, 181, 185)"
    const selectedRowColor = "rgb(242, 242, 242)"
    const headerBg = "rgb(252, 252, 252)"
    const divColor = "rgb(216, 216, 216)"
    const headerTextColor = "gray.700"
    const toast = useToast()

    const handleResolveClick = async () => {
      setResolving(true)
      try {
        await resolveAttack(attack?.uuid)
        setAttack({ ...attack, resolved: true, snoozed: false })
      } catch (err) {
        toast(
          makeToast(
            {
              title: "Resolve attack failed",
              status: "error",
              description: err.response?.data,
            },
            err.response?.status,
          ),
        )
      } finally {
        setResolving(false)
      }
    }

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
        selector: (row: ApiTrace) =>
          `${row.meta.source}:${row.meta.sourcePort}`,
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
      <VStack w="full" spacing="0" h="full">
        <Grid w="full" templateColumns="repeat(2, 1fr)" gap={4} p="4">
          <GridItem>
            <DataHeading>Status</DataHeading>
            <Badge
              py="1"
              px="2"
              fontSize="sm"
              colorScheme={
                STATUS_TO_COLOR[
                  attack?.resolved ? Status.RESOLVED : Status.OPEN
                ]
              }
              pointerEvents="none"
            >
              {attack?.resolved ? "RESOLVED" : "OPEN"}
            </Badge>
          </GridItem>
          <GridItem>
            <DataHeading>Host</DataHeading>
            <DataAttribute>{attack?.host}</DataAttribute>
          </GridItem>
          <GridItem>
            <DataHeading>Risk Score</DataHeading>
            <Badge
              py="1"
              px="2"
              fontSize="sm"
              colorScheme={RISK_TO_COLOR[attack?.riskScore]}
              pointerEvents="none"
            >
              {attack?.riskScore}
            </Badge>
          </GridItem>
          <GridItem>
            <DataHeading>Source IP</DataHeading>
            <DataAttribute>{attack?.sourceIP ?? "N/A"}</DataAttribute>
          </GridItem>
          <GridItem>
            <DataHeading>Start Time</DataHeading>
            <DataAttribute>
              {getDateTimeString(attack?.startTime) || "N/A"}
            </DataAttribute>
          </GridItem>
          <GridItem>
            <DataHeading>End Time</DataHeading>
            <DataAttribute>
              {getDateTimeString(attack?.endTime) || "N/A"}
            </DataAttribute>
          </GridItem>
          <GridItem colSpan={2}>
            <DataHeading>Description</DataHeading>
            <Code p="1">{attack?.description}</Code>
          </GridItem>
        </Grid>
        <Divider w="100vw" pt="4" borderColor={divColor} />
        <DataTable
          fixedHeader={true}
          fixedHeaderScrollHeight="100%"
          style={rowStyles}
          conditionalRowStyles={conditionalStyles}
          columns={columns}
          data={traces}
          customStyles={getCustomStyles("light")}
          onRowClicked={setTrace}
          noDataComponent={<EmptyView notRounded text="No Traces!" />}
        />
      </VStack>
    )
    return (
      <VStack
        w="full"
        alignItems="flex-start"
        spacing="0"
        h="100vh"
        overflow="hidden"
      >
        <VStack w="full" alignItems="flex-start" pt="6" px="6">
          <NextLink href="/protection">
            <HStack color={headerColor} spacing="1" cursor="pointer">
              <HiShieldCheck />
              <Text fontWeight="semibold">Protection</Text>
            </HStack>
          </NextLink>
          <HStack w="full" justifyContent="space-between">
            <HStack>
              <Heading fontWeight="medium" size="lg">
                {attack?.attackType}
              </Heading>
              {attack?.resolved && (
                <FiCheckCircle fontSize="20px" color="green" />
              )}
            </HStack>
            {!attack?.resolved && (
              <HStack>
                <Menu>
                  <MenuButton
                    as={Button}
                    border="1px"
                    leftIcon={<FiClock />}
                    rightIcon={<ChevronDownIcon />}
                  >
                    Snooze
                  </MenuButton>
                  <MenuList>
                    <MenuItem>1 hr</MenuItem>
                    <MenuItem>4 hrs</MenuItem>
                    <MenuItem>8 hrs</MenuItem>
                    <MenuItem>24 hrs</MenuItem>
                    <MenuItem>Other...</MenuItem>
                  </MenuList>
                </Menu>
                <Button
                  isLoading={resolving}
                  onClick={handleResolveClick}
                  leftIcon={<FiCheckCircle />}
                  colorScheme="green"
                >
                  Resolve
                </Button>
              </HStack>
            )}
          </HStack>
        </VStack>
        <Divider w="100vw" pt="4" borderColor={divColor} />
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
      </VStack>
    )
  },
)
