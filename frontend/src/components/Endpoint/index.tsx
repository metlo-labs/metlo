import React, { useState } from "react"
import NextLink from "next/link"
import { BiInfoCircle } from "icons/bi/BiInfoCircle"
import { BsSearch } from "icons/bs/BsSearch"
import { GrStackOverflow } from "icons/gr/GrStackOverflow"
import { TiFlowSwitch } from "icons/ti/TiFlowSwitch"
import { FaBell } from "icons/fa/FaBell"
import {
  Badge,
  Code,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useToast,
} from "@chakra-ui/react"
import { useRouter } from "next/router"
import { SectionHeader } from "components/utils/Card"
import {
  Alert,
  ApiEndpointDetailed,
  DataClass,
  GetAlertParams,
  Usage,
} from "@common/types"
import { METHOD_TO_COLOR } from "~/constants"
import DataFieldList from "./DataFieldList"
import TraceList from "./TraceList"
import { AlertTab } from "./AlertTab"
import EndpointOverview from "./Overview"
import { deleteEndpoint } from "api/endpoints"
import { makeToast } from "utils"
import { EditPath } from "./EditPath"

interface EndpointPageProps {
  endpoint: ApiEndpointDetailed
  usage: Usage[]
  alerts: Alert[]
  dataClasses: DataClass[]
  totalAlertsCount: number
  initAlertParams: GetAlertParams
}

const EndpointPage: React.FC<EndpointPageProps> = React.memo(
  ({
    endpoint,
    usage,
    alerts,
    dataClasses,
    totalAlertsCount,
    initAlertParams,
  }) => {
    const router = useRouter()
    const headerColor = useColorModeValue(
      "rgb(179, 181, 185)",
      "rgb(91, 94, 109)",
    )
    const [deleting, setDeleting] = useState<boolean>(false)
    const { isOpen, onOpen, onClose } = useDisclosure()
    const cancelRef = React.useRef()
    const toast = useToast()
    const { tab, uuid } = router.query
    const getDefaultTab = () => {
      switch (tab) {
        case "overview":
          return 0
        case "fields":
          return 1
        case "traces":
          return 2
        case "alerts":
          return 3
        case "tests":
          return 4
        default:
          return 0
      }
    }

    const handleEndpointDelete = async () => {
      try {
        setDeleting(true)
        await deleteEndpoint(endpoint.uuid)
        router.push("/endpoints")
      } catch (err) {
        toast(
          makeToast(
            {
              title: "Deleting endpoint failed...",
              status: "error",
              description: err.response?.data,
            },
            err.response?.status,
          ),
        )
      } finally {
        setDeleting(false)
      }
    }

    return (
      <VStack
        w="full"
        alignItems="flex-start"
        spacing="0"
        h="100vh"
        overflow="hidden"
      >
        <VStack w="full" alignItems="flex-start" pt="6" px="6">
          <HStack w="full" justifyContent="space-between">
            <VStack alignItems="flex-start">
              <NextLink href="/endpoints">
                <HStack color={headerColor} spacing="1" cursor="pointer">
                  <TiFlowSwitch />
                  <Text fontWeight="semibold">Endpoints</Text>
                </HStack>
              </NextLink>
              <HStack spacing="4" pb="6">
                <Badge
                  fontSize="xl"
                  px="2"
                  py="1"
                  colorScheme={METHOD_TO_COLOR[endpoint?.method] || "gray"}
                >
                  {endpoint?.method.toUpperCase()}
                </Badge>
                <Code fontSize="xl" fontWeight="semibold" p="1">
                  {endpoint.path}
                </Code>
              </HStack>
            </VStack>
            <HStack>
              <EditPath
                endpointPath={endpoint.path}
                endpointId={endpoint.uuid}
              />
              <Button colorScheme="red" isLoading={deleting} onClick={onOpen}>
                Delete
              </Button>
            </HStack>
          </HStack>
        </VStack>
        <Tabs
          w="full"
          display="flex"
          flexDir="column"
          flexGrow="1"
          defaultIndex={getDefaultTab()}
          overflow="hidden"
        >
          <TabList>
            <Tab>
              <SectionHeader text="Overview" sym={BiInfoCircle} />
            </Tab>
            <Tab>
              <SectionHeader text="Detected Fields" sym={BsSearch} />
            </Tab>
            <Tab>
              <SectionHeader text="Traces" sym={GrStackOverflow} />
            </Tab>
            <Tab>
              <SectionHeader text="Alerts" sym={FaBell} />
            </Tab>
          </TabList>
          <TabPanels flexGrow="1" h="full" overflow="hidden">
            <TabPanel p="0" overflow="auto" h="full">
              <EndpointOverview endpoint={endpoint} usage={usage} />
            </TabPanel>
            <TabPanel p="0" h="full">
              <DataFieldList
                dataFields={endpoint.dataFields}
                uuid={uuid as string}
                dataClasses={dataClasses}
              />
            </TabPanel>
            <TabPanel p="0" h="full">
              <TraceList traces={endpoint.traces} uuid={uuid as string} />
            </TabPanel>
            <TabPanel p="0" h="full">
              <AlertTab
                initAlerts={alerts}
                initAlertParams={initAlertParams}
                initTotalCount={totalAlertsCount}
                providedSpecString={endpoint.openapiSpec?.spec}
                providedSpecExtension={endpoint.openapiSpec?.extension}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Endpoint
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete this endpoint?
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  isLoading={deleting}
                  colorScheme="red"
                  onClick={handleEndpointDelete}
                  ml={3}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    )
  },
)

export default EndpointPage
