import { useEffect, useRef } from "react"
import {
  HStack,
  VStack,
  Box,
  IconButton,
  Text,
  Checkbox,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react"
import { FiFilter } from "@react-icons/all-files/fi/FiFilter"
import { Alert, GetAlertParams, UpdateAlertParams } from "@common/types"
import { AlertType, RiskScore, SpecExtension, Status } from "@common/enums"
import { ALERT_PAGE_LIMIT } from "~/constants"
import { AlertComponent } from "components/Alert/AlertComponent"
import EmptyView from "components/utils/EmptyView"
import { PaginationComponent } from "components/PaginationComponent"

const RISK_SCORE_TO_LABEL: Record<RiskScore, string> = {
  [RiskScore.HIGH]: "High",
  [RiskScore.MEDIUM]: "Medium",
  [RiskScore.LOW]: "Low",
  [RiskScore.NONE]: "",
}

interface AlertListProps {
  alerts: Alert[]
  params: GetAlertParams
  setParams: (t: (e: GetAlertParams) => GetAlertParams) => void
  handleUpdateAlert: (
    alertId: string,
    updateAlertParams: UpdateAlertParams,
  ) => Promise<void>
  updating: boolean
  fetching: boolean
  hosts?: string[]
  pagination?: boolean
  totalCount?: number
  page?: number
  providedSpecString?: string
  providedSpecExtension?: SpecExtension
}

export const AlertList: React.FC<AlertListProps> = ({
  alerts,
  params,
  setParams,
  fetching,
  pagination,
  totalCount,
  hosts,
  page,
  handleUpdateAlert,
  updating,
  providedSpecString,
  providedSpecExtension,
}) => {
  const scrollDivRef = useRef(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const executeScroll = () => scrollDivRef.current?.scrollIntoView()

  useEffect(() => {
    if (pagination) {
      executeScroll()
    }
  }, [alerts, pagination])

  const handleHostFilter = (
    e: React.ChangeEvent<HTMLInputElement>,
    host: string,
  ) => {
    if (e.target.checked) {
      setParams(oldParams => ({
        ...oldParams,
        hosts: [...params.hosts, host],
        offset: 0,
      }))
    } else {
      setParams(oldParams => ({
        ...oldParams,
        hosts: params.hosts.filter(e => e !== host),
        offset: 0,
      }))
    }
  }

  const handleRiskScoreFilter = (
    e: React.ChangeEvent<HTMLInputElement>,
    riskScore: string,
  ) => {
    if (e.target.checked) {
      setParams(oldParams => ({
        ...oldParams,
        riskScores: [...params.riskScores, RiskScore[riskScore]],
        offset: 0,
      }))
    } else {
      setParams(oldParams => ({
        ...oldParams,
        riskScores: params.riskScores.filter(e => e !== RiskScore[riskScore]),
        offset: 0,
      }))
    }
  }

  const handleAlertTypeFilter = (
    e: React.ChangeEvent<HTMLInputElement>,
    alertType: string,
  ) => {
    if (e.target.checked) {
      setParams(oldParams => ({
        ...oldParams,
        alertTypes: [...params.alertTypes, AlertType[alertType]],
        offset: 0,
      }))
    } else {
      setParams(oldParams => ({
        ...oldParams,
        alertTypes: params.alertTypes.filter(e => e !== AlertType[alertType]),
        offset: 0,
      }))
    }
  }

  const handleStatusFilter = (
    e: React.ChangeEvent<HTMLInputElement>,
    status: string,
  ) => {
    if (e.target.checked) {
      setParams(oldParams => ({
        ...oldParams,
        status: [...params.status, Status[status]],
        offset: 0,
      }))
    } else {
      setParams(oldParams => ({
        ...oldParams,
        status: params.status.filter(e => e !== Status[status]),
        offset: 0,
      }))
    }
  }

  const riskFilterPanel = (
    <Accordion defaultIndex={[0, 1, 2, 3]} w="full" allowToggle allowMultiple>
      <VStack pb="4" borderBottomWidth={1} spacing="8">
        <AccordionItem border="0" w="full">
          <AccordionButton _hover={{ bg: "transparent" }} p="0">
            <AccordionIcon mr="10px" />
            <Box fontWeight="semibold" flex="1" textAlign="left">
              RISK SCORE
            </Box>
          </AccordionButton>
          <AccordionPanel pl="30px" pb="0">
            <VStack w="full" alignItems="flex-start">
              {Object.keys(RiskScore)
                .reverse()
                .filter(e => RiskScore[e] !== RiskScore.NONE)
                .map(risk => (
                  <Checkbox
                    key={risk}
                    onChange={e => handleRiskScoreFilter(e, risk)}
                    isChecked={params.riskScores.includes(RiskScore[risk])}
                  >
                    {RISK_SCORE_TO_LABEL[RiskScore[risk]]}
                  </Checkbox>
                ))}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem border="0" w="full">
          <AccordionButton _hover={{ bg: "transparent" }} p="0">
            <AccordionIcon mr="10px" />
            <Box fontWeight="semibold" flex="1" textAlign="left">
              ALERT TYPE
            </Box>
          </AccordionButton>
          <AccordionPanel pl="30px" pb="0">
            <VStack w="full" alignItems="flex-start">
              {Object.keys(AlertType).map(type => (
                <Checkbox
                  key={type}
                  onChange={e => handleAlertTypeFilter(e, type)}
                  isChecked={params.alertTypes.includes(AlertType[type])}
                >
                  {AlertType[type]}
                </Checkbox>
              ))}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
        {hosts && (
          <AccordionItem border="0" w="full">
            <AccordionButton _hover={{ bg: "transparent" }} p="0">
              <AccordionIcon mr="10px" />
              <Box fontWeight="semibold" flex="1" textAlign="left">
                HOSTS
              </Box>
            </AccordionButton>
            <AccordionPanel pl="30px" pb="0" wordBreak="break-all">
              <VStack w="full" alignItems="flex-start">
                {hosts.map(host => (
                  <Checkbox
                    key={host}
                    onChange={e => handleHostFilter(e, host)}
                    isChecked={params.hosts.includes(host)}
                  >
                    {host}
                  </Checkbox>
                ))}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        )}
        <AccordionItem border="0" w="full">
          <AccordionButton _hover={{ bg: "transparent" }} p="0">
            <AccordionIcon mr="10px" />
            <Box fontWeight="semibold" flex="1" textAlign="left">
              STATUS
            </Box>
          </AccordionButton>
          <AccordionPanel pl="30px" pb="0">
            <VStack w="full" alignItems="flex-start">
              {Object.keys(Status)
                .reverse()
                .map(status => (
                  <Checkbox
                    key={status}
                    onChange={e => handleStatusFilter(e, status)}
                    isChecked={params.status.includes(Status[status])}
                  >
                    {Status[status]}
                  </Checkbox>
                ))}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </VStack>
    </Accordion>
  )

  const modal = (
    <Modal size="full" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Filters</ModalHeader>
        <ModalCloseButton />
        <ModalBody maxH="600px" overflowY={"auto"}>
          {riskFilterPanel}
        </ModalBody>
      </ModalContent>
    </Modal>
  )

  return (
    <VStack h="full" overflowY="hidden" w="full" alignItems="flex-start">
      <HStack h="full" overflowY="hidden" w="full" spacing={{ base: 0, lg: 4 }}>
        <VStack
          alignItems="flex-start"
          alignSelf="flex-start"
          display={{ base: "none", lg: "block" }}
          minW="300px"
          w="300px"
          maxW="300px"
          spacing="4"
          overflowY="auto"
          h="full"
        >
          {riskFilterPanel}
        </VStack>
        {!fetching && alerts && alerts.length > 0 ? (
          <VStack
            h="full"
            w="full"
            overflowY="auto"
            spacing="4"
            alignSelf="flex-start"
          >
            {alerts.map((listAlert, i) => (
              <Box
                w="full"
                key={listAlert.uuid}
                ref={i === 0 ? scrollDivRef : null}
              >
                <AlertComponent
                  alert={listAlert}
                  handleUpdateAlert={handleUpdateAlert}
                  updating={updating}
                  providedSpecString={providedSpecString}
                  providedSpecExtension={providedSpecExtension}
                />
              </Box>
            ))}
          </VStack>
        ) : (
          <>
            {!fetching && (
              <EmptyView
                h="full"
                alignSelf="flex-start"
                text="No results found."
              />
            )}
          </>
        )}
        {modal}
      </HStack>
      {totalCount && (
        <HStack alignSelf="flex-end" py="3">
          <Text>
            {(page - 1) * ALERT_PAGE_LIMIT + 1}-
            {(page - 1) * ALERT_PAGE_LIMIT + alerts.length} of {totalCount}{" "}
            alerts
          </Text>
          <PaginationComponent
            pageSize={ALERT_PAGE_LIMIT}
            currentPage={page}
            setCurrentPage={e =>
              setParams(oldParams => ({
                ...oldParams,
                offset: (e - 1) * ALERT_PAGE_LIMIT,
              }))
            }
            tableSize={totalCount}
          />
        </HStack>
      )}
    </VStack>
  )
}
