import {
  Heading,
  VStack,
  useToast,
} from "@chakra-ui/react"
import React, { useEffect, useState } from "react"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { Alert, GetAlertParams, UpdateAlertParams } from "@common/types"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { AlertList } from "components/Alert/AlertList"
import { ALERT_PAGE_LIMIT } from "~/constants"
import { getAlerts, updateAlert } from "api/alerts"

const Alerts = () => {
  const [fetching, setFetching] = useState<boolean>(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [totalCount, setTotalCount] = useState<number>()
  const [page, setPage] = useState(1)
  const [updating, setUpdating] = useState<boolean>(false)
  const [params, setParams] = useState<GetAlertParams>({
    riskScores: [],
    status: [],
    alertTypes: [],
    offset: 0,
    limit: ALERT_PAGE_LIMIT,
    order: "DESC",
  })
  const [toggleRefetch, setToggleRefetch] = useState<boolean>(false)
  const toast = useToast()

  useEffect(() => {
    setFetching(true)
    const fetchAlerts = async () => {
      const res = await getAlerts(params)
      setAlerts(res[0])
      setTotalCount(res[1])
      setFetching(false)
    }
    fetchAlerts()
  }, [params, toggleRefetch])

  useEffect(() => {
    setPage(1)
  }, [params.riskScores, params.status, params.alertTypes])

  useEffect(() => {
    const offset = (page - 1) * ALERT_PAGE_LIMIT
    setParams({ ...params, offset })
  }, [page])

  const handleUpdateAlert = async (alertId: string, updateAlertParams: UpdateAlertParams) => {
    setUpdating(true)
    const resp: Alert = await updateAlert(alertId, updateAlertParams)
    if (resp) {
      toast({
        title: `Updating alert successful`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      })
      setToggleRefetch(!toggleRefetch)
    } else {
      toast({
        title: `Updating Alert failed...`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      })
    }
    setUpdating(false)
  }

  return (
    <SidebarLayoutShell
      title="Alerts"
      currentTab={SideNavLinkDestination.Alerts}
    >
      <VStack h="full" overflowY="hidden" w="full" alignItems="flex-start">
        <Heading px="8" pt="8" fontWeight="medium" size="xl">
          Alerts
        </Heading>
        <AlertList alerts={alerts} handleUpdateAlert={handleUpdateAlert} updating={updating} params={params} setParams={setParams} fetching={fetching} pagination totalCount={totalCount} page={page} setPage={setPage} />
      </VStack>
    </SidebarLayoutShell>
  )
}

export default Alerts
