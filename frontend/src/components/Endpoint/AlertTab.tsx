import { useEffect, useState } from "react"
import { useToast, Box } from "@chakra-ui/react"
import { Alert, GetAlertParams, UpdateAlertParams } from "@common/types"
import { getAlerts, updateAlert } from "api/alerts"
import { AlertList } from "components/Alert/AlertList"
import { Status } from "@common/enums"

interface AlertTabProps {
  apiEndpointUuid: string
}

export const AlertTab: React.FC<AlertTabProps> = ({ apiEndpointUuid }) => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [fetching, setFetching] = useState<boolean>(true)
  const [updating, setUpdating] = useState<boolean>(false)
  const [params, setParams] = useState<GetAlertParams>({
    apiEndpointUuid: apiEndpointUuid,
    riskScores: [],
    status: [Status.OPEN],
    alertTypes: [],
    order: "DESC",
  })
  const [toggleRefetch, setToggleRefetch] = useState<boolean>(false)
  const toast = useToast()

  useEffect(() => {
    setFetching(true)
    const fetchAlerts = async () => {
      const res = await getAlerts(params)
      setAlerts(res[0])
      setFetching(false)
    }
    fetchAlerts()
  }, [params, toggleRefetch])

  const handleUpdateAlert = async (
    alertId: string,
    updateAlertParams: UpdateAlertParams,
  ) => {
    setUpdating(true)
    const resp: Alert = await updateAlert(alertId, updateAlertParams)
    if (resp) {
      toast({
        title: `Updating alert successful`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      })
      setToggleRefetch(!toggleRefetch)
    } else {
      toast({
        title: `Updating Alert failed...`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
    }
    setUpdating(false)
  }

  return (
    <Box pt="4" pr="2" h="full">
      <AlertList
        alerts={alerts}
        handleUpdateAlert={handleUpdateAlert}
        updating={updating}
        params={params}
        setParams={setParams}
        fetching={fetching}
      />
    </Box>
  )
}
