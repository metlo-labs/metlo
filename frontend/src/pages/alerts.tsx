import {
  Heading,
  VStack,
  HStack,
  Select,
  useToast,
  Box,
  Text,
} from "@chakra-ui/react"
import superjson from "superjson"
import React, { useState } from "react"
import { Alert, GetAlertParams, UpdateAlertParams } from "@common/types"
import { PageWrapper } from "components/PageWrapper"
import { AlertList } from "components/Alert/AlertList"
import { ALERT_PAGE_LIMIT } from "~/constants"
import { getAlerts, updateAlert } from "api/alerts"
import { AlertType, RiskScore, Status } from "@common/enums"
import { GetServerSideProps } from "next"
import { getHosts } from "api/endpoints"
import { makeToast } from "utils"

enum Order {
  DESC = "DESC",
  ASC = "ASC",
}

const Alerts = ({ initParams, initAlerts, initTotalCount, initHosts }) => {
  const parsedInitParams = superjson.parse<GetAlertParams>(initParams)
  const parsedInitAlerts = superjson.parse<Alert[]>(initAlerts)
  const parsedHosts = superjson.parse<string[]>(initHosts ?? [])

  const [updating, setUpdating] = useState<boolean>(false)
  const [fetching, setFetching] = useState<boolean>(false)
  const [alerts, setAlerts] = useState<Alert[]>(parsedInitAlerts)
  const [totalCount, setTotalCount] = useState<number>(initTotalCount)
  const [params, setParamsInner] = useState<GetAlertParams>(parsedInitParams)

  const toast = useToast()

  const fetchAlerts = (fetchParams: GetAlertParams) => {
    setFetching(true)
    getAlerts(fetchParams)
      .then(res => {
        setAlerts(res[0])
        setTotalCount(res[1])
      })
      .catch(e =>
        toast(
          makeToast({
            title: "Fetching Alerts failed",
            status: "error",
          }),
        ),
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
    try {
      const resp: Alert = await updateAlert(alertId, updateAlertParams)
      toast(
        makeToast({
          title: `Updating alert successful`,
          status: "success",
        }),
      )
      fetchAlerts(params)
    } catch (err) {
      toast(
        makeToast(
          {
            title: "Updating Alert failed",
            status: "error",
            description: err.response?.data,
          },
          err.response?.status,
        ),
      )
    } finally {
      setUpdating(false)
    }
  }

  return (
    <PageWrapper title="Alerts">
      <VStack
        mx="auto"
        maxW="100rem"
        px="8"
        pt="8"
        h="full"
        w="full"
        alignItems="flex-start"
      >
        <HStack
          w="full"
          justifyContent="space-between"
          alignItems="flex-end"
          mb="4"
        >
          <Heading fontWeight="medium" size="lg">
            Alerts
          </Heading>
          <HStack>
            <Text>Sort By</Text>
            <Select
              defaultValue={Order.DESC}
              w="fit-content"
              onChange={e =>
                setParams(oldParams => ({
                  ...oldParams,
                  order: e.target.value as Order,
                }))
              }
            >
              <option value={Order.DESC}>Highest Risk</option>
              <option value={Order.ASC}>Lowest Risk</option>
            </Select>
          </HStack>
        </HStack>
        <Box w="full" h="full" overflowY="hidden">
          <AlertList
            alerts={alerts}
            handleUpdateAlert={handleUpdateAlert}
            updating={updating}
            params={params}
            setParams={setParams}
            fetching={fetching}
            pagination
            totalCount={totalCount}
            hosts={parsedHosts}
            page={params.offset / ALERT_PAGE_LIMIT + 1}
          />
        </Box>
      </VStack>
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const initParams: GetAlertParams = {
    riskScores: ((context.query.riskScores as string) || "")
      .split(",")
      .filter(e => Object.values(RiskScore).includes(e as RiskScore))
      .map(e => e as RiskScore),
    status: ((context.query.status as string) || "Open")
      .split(",")
      .filter(e => Object.values(Status).includes(e as Status))
      .map(e => e as Status),
    alertTypes: ((context.query.alertTypes as string) || "")
      .split(",")
      .filter(e => Object.values(AlertType).includes(e as AlertType))
      .map(e => e as AlertType),
    hosts: ((context.query.hosts as string) || null)?.split(",") ?? [],
    offset: 0,
    limit: ALERT_PAGE_LIMIT,
    order: "DESC",
  }
  const hostsPromise = getHosts()
  const alertsPromise = getAlerts(initParams)
  const [hosts, alerts] = await Promise.all([hostsPromise, alertsPromise])
  const initAlerts = alerts[0]
  const totalCount = alerts[1]
  const initHosts = hosts
  return {
    props: {
      initParams: superjson.stringify(initParams),
      initAlerts: superjson.stringify(initAlerts),
      initTotalCount: totalCount,
      initHosts: superjson.stringify(initHosts),
    },
  }
}

export default Alerts
