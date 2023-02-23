import { useRouter } from "next/router"
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
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
import { ApiEndpoint, DataClass } from "@common/types"
import { GetEndpointParams } from "@common/api/endpoint"
import { HostType, RestMethod, RiskScore } from "@common/enums"
import EndpointList from "components/EndpointList"
import { PageWrapper } from "components/PageWrapper"
import { ContentContainer } from "components/utils/ContentContainer"
import { deleteEndpointsBatch, getEndpoints, getHosts } from "api/endpoints"
import { ENDPOINT_PAGE_LIMIT } from "~/constants"
import { getDataClasses } from "api/dataClasses"
import { makeToast } from "utils"
import { formatMetloAPIErr, MetloAPIErr } from "api/utils"

interface EndpointsProps {
  params: string
  endpoints: string
  totalCount: number
  hosts: string
  dataClasses: string
}

const Endpoints: React.FC<EndpointsProps> = ({
  params,
  endpoints,
  totalCount,
  hosts,
  dataClasses,
}) => {
  const parsedInitParams = superjson.parse<GetEndpointParams>(params)
  const parsedInitEndpoints = superjson.parse<ApiEndpoint[]>(endpoints)
  const parsedHosts = superjson.parse<string[]>(hosts) ?? []
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
        ...newParams,
        riskScores: newParams.riskScores?.join(",") ?? "",
        hosts: newParams.hosts?.join(",") ?? "",
        methods: newParams.methods?.join(",") ?? "",
        dataClasses: newParams.dataClasses?.join(",") ?? "",
      },
    })
    setFetching(false)
    selectedUuids.current = []
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
      <ContentContainer maxContentW="100rem" px="8" py="8">
        <VStack w="full" alignItems="flex-start" spacing="0">
          <HStack mb="4" w="full" justifyContent="space-between">
            <Heading fontWeight="semibold" size="xl">
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
              <AlertDialogHeader>Delete Selected Endpoints</AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete the selected endpoints?
                <Text>
                  This will delete{" "}
                  <strong>{selectedUuids.current.length}</strong> endpoint(s).
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
      </ContentContainer>
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const dataClasses: DataClass[] = await getDataClasses({})
  const params: GetEndpointParams = {
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
    hostType: (context.query.hostType as HostType) || HostType.ANY,
    offset: parseInt((context.query.offset as string) ?? "0"),
    searchQuery: (context.query.searchQuery as string) ?? "",
    isAuthenticated: (context.query.isAuthenticated as string) ?? "",
    limit: ENDPOINT_PAGE_LIMIT,
  }
  const hostsPromise = getHosts()
  const endpointsPromise = getEndpoints(params)
  const [hosts, endpointsResp] = await Promise.all([
    hostsPromise,
    endpointsPromise,
  ])
  const endpoints = endpointsResp[0]
  const totalCount = endpointsResp[1]
  return {
    props: {
      params: superjson.stringify(params),
      endpoints: superjson.stringify(endpoints),
      totalCount: totalCount,
      hosts: superjson.stringify(hosts),
      dataClasses: superjson.stringify(dataClasses),
    },
  }
}

export default Endpoints
