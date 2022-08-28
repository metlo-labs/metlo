import React, { useEffect, useState } from "react"
import { Heading, useToast, VStack } from "@chakra-ui/react"
import SummaryStats from "./SummaryStats"
import { Alert, UpdateAlertParams } from "@common/types"
import EmptyView from "components/utils/EmptyView"
import { AlertComponent } from "components/Alert/AlertComponent"
import { updateAlert } from "api/alerts"
import { getTopAlerts } from "api/home"

interface HomePageProps {
  numHighRiskAlerts: number
  numAlerts: number
  numEndpoints: number
  numPIIDataDetected: number
  alerts: Alert[]
}

const HomePage: React.FC<HomePageProps> = React.memo(
  ({
    numHighRiskAlerts,
    numAlerts,
    numEndpoints,
    numPIIDataDetected,
    alerts,
  }) => {
    const [alertList, setAlertList] = useState<Alert[]>(alerts)
    const [toggleRefetch, setToggleRefetch] = useState<boolean>(false)
    const [fetching, setFetching] = useState<boolean>(false)
    const [updating, setUpdating] = useState<boolean>(false)
    const toast = useToast()
    useEffect(() => {
      setFetching(true)
      const fetchTopAlerts = async () => {
        const res = await getTopAlerts()
        setAlertList(res)
        setFetching(false)
      }
      fetchTopAlerts()
    }, [toggleRefetch])

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
      <VStack w="full" alignItems="flex-start" spacing="10">
        <SummaryStats
          numHighRiskAlerts={numHighRiskAlerts}
          numAlerts={numAlerts}
          numEndpoints={numEndpoints}
          numPIIDataDetected={numPIIDataDetected}
        />
        <VStack w="full" alignItems="flex-start" spacing="4">
          <Heading fontSize="xl">Top Alerts</Heading>
          {!fetching &&
          <VStack w="full" spacing="4">
            {alertList.length ? (
              alertList.map(alert => (
                <AlertComponent key={alert.uuid} alert={alert} updating={updating} handleUpdateAlert={handleUpdateAlert} />
              ))
            ) : (
              <EmptyView text="No New Alerts!" />
            )}
          </VStack>}
        </VStack>
      </VStack>
    )
  },
)

export default HomePage
