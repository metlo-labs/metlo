import { useState } from "react"
import { useToast, Box } from "@chakra-ui/react"
import { Alert, GetAlertParams, UpdateAlertParams } from "@common/types"
import { getAlerts, updateAlert } from "api/alerts"
import { AlertList } from "components/Alert/AlertList"
import { SpecExtension } from "@common/enums"

interface AlertTabProps {
  initAlertParams: GetAlertParams
  initAlerts: Alert[]
  providedSpecString: string
  providedSpecExtension: SpecExtension
}

export const AlertTab: React.FC<AlertTabProps> = ({
  initAlertParams,
  initAlerts,
  providedSpecString,
  providedSpecExtension,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>(initAlerts)
  const [fetching, setFetching] = useState<boolean>(false)
  const [updating, setUpdating] = useState<boolean>(false)
  const [params, setParamsInner] = useState<GetAlertParams>(initAlertParams)
  const toast = useToast()

  const fetchAlerts = (fetchParams: GetAlertParams) => {
    setFetching(true)
    getAlerts(fetchParams)
      .then(res => {
        setAlerts(res[0])
      })
      .catch(e =>
        toast({
          title: "Fetching Alerts failed...",
          status: "error",
        }),
      )
      .finally(() => setFetching(false))
  }

  const setParams = (t: (e: GetAlertParams) => GetAlertParams) => {
    let newParams = t(params)
    setParamsInner(newParams)
    fetchAlerts(newParams)
  }

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
      })
      fetchAlerts(params)
    } else {
      toast({
        title: "Updating Alert failed...",
        status: "error",
      })
    }
    setUpdating(false)
  }

  return (
    <Box py="4" px="8" h="full">
      <AlertList
        alerts={alerts}
        handleUpdateAlert={handleUpdateAlert}
        updating={updating}
        params={params}
        setParams={setParams}
        fetching={fetching}
        providedSpecString={providedSpecString}
        providedSpecExtension={providedSpecExtension}
      />
    </Box>
  )
}
