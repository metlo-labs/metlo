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
  Select,
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
import { AlertType, RiskScore, Status } from "@common/enums"
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

enum Order {
  DESC = "DESC",
  ASC = "ASC",
}

interface AlertListProps {
  alerts: Alert[]
  params: GetAlertParams
  setParams: (value: React.SetStateAction<GetAlertParams>) => void
  handleUpdateAlert: (alertId: string, updateAlertParams: UpdateAlertParams) => Promise<void>
  updating: boolean
  fetching: boolean
  pagination?: boolean
  totalCount?: number
  page?: number
  setPage?: React.Dispatch<React.SetStateAction<number>>
}

export const AlertList:React.FC<AlertListProps> = ({ alerts, params, setParams, fetching, pagination, totalCount, page, setPage, handleUpdateAlert, updating }) => {
  const scrollDivRef = useRef(null)
  const { isOpen, onOpen, onClose } = useDisclosure();

  const executeScroll = () => scrollDivRef.current?.scrollIntoView()

  useEffect(() => {
    if (pagination) {
      executeScroll()
    }
  }, [alerts, pagination])

  const handleRiskScoreFilter = (
    e: React.ChangeEvent<HTMLInputElement>,
    riskScore: string,
  ) => {
    if (e.target.checked) {
      setParams({
        ...params,
        riskScores: [...params.riskScores, RiskScore[riskScore]],
      })
    } else {
      setParams({
        ...params,
        riskScores: params.riskScores.filter(e => e !== RiskScore[riskScore]),
      })
    }
  }

  const handleAlertTypeFilter = (
    e: React.ChangeEvent<HTMLInputElement>,
    alertType: string,
  ) => {
    if (e.target.checked) {
      setParams({
        ...params,
        alertTypes: [...params.alertTypes, AlertType[alertType]],
      })
    } else {
      setParams({
        ...params,
        alertTypes: params.alertTypes.filter(e => e !== AlertType[alertType]),
      })
    }
  }

  const handleStatusFilter = (
    e: React.ChangeEvent<HTMLInputElement>,
    status: string,
  ) => {
    if (e.target.checked) {
      setParams({ ...params, status: [...params.status, Status[status]] })
    } else {
      setParams({
        ...params,
        status: params.status.filter(e => e !== Status[status]),
      })
    }
  }

  const riskFilterPanel = (
    <Accordion defaultIndex={[0, 1, 2]} w="full" allowToggle allowMultiple>
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
        <AccordionItem border="0" w="full">
          <AccordionButton _hover={{ bg: "transparent" }} p="0">
            <AccordionIcon mr="10px" />
            <Box fontWeight="semibold" flex="1" textAlign="left">
              STATUS
            </Box>
          </AccordionButton>
          <AccordionPanel pl="30px" pb="0">
            <VStack w="full" alignItems="flex-start">
              {Object.keys(Status).reverse().map(status => (
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
      <HStack px="8" w="full" justifyContent="space-between">
            <Box>
              <IconButton visibility={{ base: "visible", lg: "hidden"}} aria-label="Filter Button" icon={<FiFilter />} onClick={onOpen}/>
            </Box>
            <HStack>
              <Text>Sort By</Text>
              <Select
                defaultValue={Order.DESC}
                w="fit-content"
                onChange={e =>
                  setParams({ ...params, order: e.target.value as Order })
                }
              >
                <option value={Order.DESC}>Highest Risk</option>
                <option value={Order.ASC}>Lowest Risk</option>
              </Select>
            </HStack>
          </HStack>
        <HStack h="full" overflowY="hidden" w="full" spacing={{ base: 0, lg: 4 }}>
          <VStack
            pl="8"
            alignItems="flex-start"
            alignSelf="flex-start"
            display={{ base: "none", lg: "block"}}
            w="400px"
            spacing="4"
          >
            {riskFilterPanel}
          </VStack>
          {!fetching && alerts && alerts.length > 0 ? (
            <VStack
              pl={{ base: "8", lg: "0"}}
              pr="4"
              pb="8"
              h="full"
              w="full"
              overflowY="auto"
              spacing="4"
              alignSelf="flex-start"
            >
              {alerts.map((listAlert, i) => (
                <Box w="full" key={listAlert.uuid} ref={i === 0 ? scrollDivRef : null}>
                  <AlertComponent alert={listAlert} handleUpdateAlert={handleUpdateAlert} updating={updating} />
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
          <HStack alignSelf="flex-end" p="3" pr="70px">
            <Text>
              {(page - 1) * params.offset + 1}-
              {(page - 1) * params.offset + alerts.length} of {totalCount}{" "}
              alerts
            </Text>
            <PaginationComponent
              pageSize={ALERT_PAGE_LIMIT}
              currentPage={page}
              setCurrentPage={setPage}
              tableSize={totalCount}
            />
          </HStack>
        )}
    </VStack>
  )
}