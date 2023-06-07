import { useRouter } from "next/router"
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Button,
  Heading,
  HStack,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react"
import superjson from "superjson"
import { useState, useRef } from "react"
import { GetServerSideProps } from "next"
import { ApiEndpoint, DataClass, DataField } from "@common/types"
import {
  GetEndpointParams,
  GetNewDetectionsParams,
  NewDetectionsAggRes,
} from "@common/api/endpoint"
import {
  HostType,
  NewDetectionType,
  RestMethod,
  RiskScore,
} from "@common/enums"
import EndpointList from "components/EndpointList"
import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import {
  deleteEndpointsBatch,
  getEndpoints,
  getHosts,
  getNewDetections,
  getNewDetectionsAgg,
} from "api/endpoints"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"
import { getDataClasses } from "api/dataClasses"
import { makeToast } from "utils"
import { formatMetloAPIErr, MetloAPIErr } from "api/utils"
import { getResourcePerms } from "api/testing-config"
import { EndpointsTab } from "enums"
import NewDetectionList from "components/NewDetectionList"

interface EndpointsProps {
  params: string
  endpoints: string
  totalCount: number
  hosts: string
  resourcePermissions: string
  dataClasses: string
  detectionParams: string
  newDetections: string
  newDetectionsAgg: string
  tab: EndpointsTab
}

const Endpoints: React.FC<EndpointsProps> = ({
  params,
  endpoints,
  totalCount,
  hosts,
  resourcePermissions,
  dataClasses,
  detectionParams,
  newDetections,
  newDetectionsAgg,
  tab,
}) => {
  const parsedInitParams = superjson.parse<GetEndpointParams>(params)
  const parsedInitEndpoints = superjson.parse<ApiEndpoint[]>(endpoints)
  const parsedInitDetectionParams =
    superjson.parse<GetNewDetectionsParams>(detectionParams)
  const parsedInitNewDetections =
    superjson.parse<(ApiEndpoint | DataField)[]>(newDetections)
  const parsedNewDetectionsAgg =
    superjson.parse<NewDetectionsAggRes[]>(newDetectionsAgg)
  const parsedHosts = superjson.parse<string[]>(hosts) ?? []
  const parsedResourcePermissions =
    superjson.parse<string[]>(resourcePermissions) ?? []
  const parsedDataClasses = superjson.parse<DataClass[]>(dataClasses) ?? []
  const toast = useToast()
  const router = useRouter()

  const [fetching, setFetching] = useState<boolean>(false)
  const selectedUuids = useRef<string[]>([])
  const [deleting, setDeleting] = useState<boolean>(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef()

  const setParams = (newParams: GetEndpointParams) => {
    setFetching(true)
    newParams = { ...parsedInitParams, ...newParams }
    router.push({
      query: {
        ...router.query,
        ...newParams,
        riskScores: newParams.riskScores?.join(",") ?? undefined,
        hosts: newParams.hosts?.join(",") ?? undefined,
        methods: newParams.methods?.join(",") ?? undefined,
        dataClasses: newParams.dataClasses?.join(",") ?? undefined,
        resourcePermissions:
          newParams.resourcePermissions?.join(",") ?? undefined,
      },
    })
    setFetching(false)
    selectedUuids.current = []
  }

  const setDetectionParams = (newParams: GetNewDetectionsParams) => {
    setFetching(true)
    newParams = { ...parsedInitDetectionParams, ...newParams }
    router.push({
      query: {
        ...router.query,
        ...newParams,
        detectionRiskScores:
          newParams.detectionRiskScores?.join(",") ?? undefined,
        detectionHosts: newParams.detectionHosts?.join(",") ?? undefined,
      },
    })
    setFetching(false)
  }

  const setTab = (newTab: EndpointsTab) => {
    router.push({
      query: {
        ...router.query,
        tab: newTab,
      },
    })
  }

  const deleteEndpointsHandler = async () => {
    setDeleting(true)
    try {
      if (selectedUuids.current.length === 0) {
        throw new Error("Need to select endpoints to delete")
      }
      await deleteEndpointsBatch(selectedUuids.current)
      toast(
        makeToast({
          title: "Successfully deleted endpoints",
          status: "success",
        }),
      )
      setParams({ offset: 0 })
      onClose()
    } catch (err) {
      toast(
        makeToast({
          title: "Deleting endpoints failed",
          status: "error",
          description: formatMetloAPIErr(
            err.response?.data ?? (err as MetloAPIErr),
          ),
        }),
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageWrapper title="Endpoints">
      <ContentContainer maxContentW="100rem" px="4" py="8">
        <VStack w="full" spacing="4">
          <HStack alignSelf="end" spacing="0">
            <Badge
              as="button"
              onClick={() => setTab(EndpointsTab.ALL)}
              roundedLeft="md"
              p="1"
              w="24"
              borderWidth="2px 1px 2px 2px"
              colorScheme={tab === EndpointsTab.NEW ? "none" : "gray"}
              opacity={tab === EndpointsTab.NEW ? 0.5 : 1}
              rounded="none"
            >
              All
            </Badge>
            <Badge
              as="button"
              onClick={() => setTab(EndpointsTab.NEW)}
              roundedRight="md"
              p="1"
              w="24"
              borderWidth="2px 2px 2px 1px"
              colorScheme={tab === EndpointsTab.NEW ? "gray" : "none"}
              opacity={tab === EndpointsTab.NEW ? 1 : 0.5}
              rounded="none"
            >
              New
            </Badge>
          </HStack>
          {tab === EndpointsTab.ALL ? (
            <>
              <VStack w="full" alignItems="flex-start" spacing="0">
                <HStack mb="4" w="full" justifyContent="space-between">
                  <Heading fontWeight="semibold" size="lg">
                    Endpoints
                  </Heading>
                  <Button
                    isLoading={deleting}
                    variant="delete"
                    size="md"
                    onClick={onOpen}
                  >
                    Delete
                  </Button>
                </HStack>
                <EndpointList
                  hosts={parsedHosts}
                  endpoints={parsedInitEndpoints}
                  fetching={fetching}
                  params={parsedInitParams}
                  totalCount={totalCount}
                  setParams={setParams}
                  resourcePermissions={parsedResourcePermissions}
                  dataClasses={parsedDataClasses}
                  selectedUuids={selectedUuids}
                />
              </VStack>
              <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
                size="3xl"
              >
                <AlertDialogOverlay>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      Delete Selected Endpoints
                    </AlertDialogHeader>
                    <AlertDialogBody>
                      Are you sure you want to delete the selected endpoints?
                      <Text>
                        This will delete{" "}
                        <strong>{selectedUuids.current.length}</strong>{" "}
                        endpoint(s).
                      </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                      <HStack>
                        <Button ref={cancelRef} onClick={onClose}>
                          Cancel
                        </Button>
                        <Button
                          isLoading={deleting}
                          variant="delete"
                          onClick={deleteEndpointsHandler}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogOverlay>
              </AlertDialog>
            </>
          ) : (
            <VStack w="full" alignItems="flex-start" spacing="0">
              <Heading fontWeight="semibold" size="lg" mb="4" w="full">
                New Detections
              </Heading>
              <NewDetectionList
                hosts={parsedHosts}
                newDetections={parsedInitNewDetections}
                fetching={fetching}
                params={parsedInitDetectionParams}
                totalCount={totalCount}
                setParams={setDetectionParams}
                dataClasses={parsedDataClasses}
                detectionAgg={parsedNewDetectionsAgg}
              />
            </VStack>
          )}
        </VStack>
      </ContentContainer>
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const dataClasses: DataClass[] = await getDataClasses({})
  const resourcePermissions: string[] = await getResourcePerms()
  let tab = context.query.tab as string
  if (!Object.values(EndpointsTab).includes(tab as EndpointsTab)) {
    tab = EndpointsTab.ALL
  }

  let params: GetEndpointParams = {
    riskScores: ((context.query.riskScores as string) || "")
      .split(",")
      .filter(e => Object.values(RiskScore).includes(e as RiskScore))
      .map(e => e as RiskScore),
    hosts: ((context.query.hosts as string) || null)?.split(",") ?? [],
    methods: ((context.query.methods as string) || "")
      .split(",")
      .filter(e => Object.values(RestMethod).includes(e as RestMethod))
      .map(e => e as RestMethod),
    dataClasses: ((context.query.dataClasses as string) || "")
      .split(",")
      .filter(e => dataClasses.find(({ className }) => className == e)),
    resourcePermissions: ((context.query.resourcePermissions as string) || "")
      .split(",")
      .filter(e => e),
    hostType: (context.query.hostType as HostType) || HostType.ANY,
    offset: parseInt((context.query.offset as string) ?? "0"),
    searchQuery: (context.query.searchQuery as string) ?? "",
    isAuthenticated: (context.query.isAuthenticated as string) ?? "",
    limit: ENDPOINT_PAGE_LIMIT,
  }
  let detectionParams: GetNewDetectionsParams = {
    detectionRiskScores: ((context.query.detectionRiskScores as string) || "")
      .split(",")
      .filter(e => Object.values(RiskScore).includes(e as RiskScore))
      .map(e => e as RiskScore),
    detectionHosts:
      ((context.query.detectionHosts as string) || null)?.split(",") ?? [],
    start: (context.query.start as string) || null,
    end: (context.query.end as string) || null,
    detectionType:
      (context.query.detectionType as NewDetectionType) ||
      NewDetectionType.ENDPOINT,
    detectionOffset: parseInt((context.query.detectionOffset as string) ?? "0"),
    detectionLimit: ENDPOINT_PAGE_LIMIT,
  }
  let endpoints = []
  let newDetections = []
  let newDetectionsAgg = []
  let totalCount = 0
  let hosts = []
  const hostsPromise = getHosts()
  if (tab === EndpointsTab.NEW) {
    const newDetectionsPromise = getNewDetections(detectionParams)
    const newDetectionsAggPromise = getNewDetectionsAgg()
    const [hostsResp, newDetectionsResp, newDetectionsAggResp] =
      await Promise.all([
        hostsPromise,
        newDetectionsPromise,
        newDetectionsAggPromise,
      ])
    newDetections = newDetectionsResp[0]
    totalCount = newDetectionsResp[1]
    newDetectionsAgg = newDetectionsAggResp
    hosts = hostsResp
  } else {
    const endpointsPromise = getEndpoints(params)
    const [hostsResp, endpointsResp] = await Promise.all([
      hostsPromise,
      endpointsPromise,
    ])
    endpoints = endpointsResp[0]
    totalCount = endpointsResp[1]
    hosts = hostsResp
  }
  return {
    props: {
      params: superjson.stringify(params),
      endpoints: superjson.stringify(endpoints),
      totalCount: totalCount,
      hosts: superjson.stringify(hosts),
      resourcePermissions: superjson.stringify(resourcePermissions),
      dataClasses: superjson.stringify(dataClasses),
      detectionParams: superjson.stringify(detectionParams),
      newDetections: superjson.stringify(newDetections),
      newDetectionsAgg: superjson.stringify(newDetectionsAgg),
      tab,
    },
  }
}

export default Endpoints
