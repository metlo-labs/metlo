import React, { useState } from "react"
import { ApiEndpointDetailed, Usage } from "@common/types"
import {
  Box,
  Badge,
  Grid,
  GridItem,
  Stack,
  HStack,
  Checkbox,
  Switch,
  useToast,
} from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { DataAttribute, DataHeading } from "components/utils/Card"
import EndpointUsageChart from "./UsageChart"
import { RISK_TO_COLOR } from "~/constants"
import EndpointPIIChart from "./PIIChart"
import { getDateTimeString, makeToast } from "utils"
import { DataTag, Status } from "@common/enums"
import {
  updateFullTraceCaptureEnabled,
  updateEndpointAuthenticated,
} from "api/endpoints"

const SpecComponent = dynamic(() => import("./SpecComponent"), { ssr: false })

interface EndpointOverviewProps {
  endpoint: ApiEndpointDetailed
  usage: Usage[]
}

const EndpointOverview: React.FC<EndpointOverviewProps> = React.memo(
  ({ endpoint, usage }) => {
    const piiFields = endpoint.dataFields.filter(
      field => field.dataTag === DataTag.PII,
    )
    const [authenticated, setAuthenticated] = useState(
      endpoint.isAuthenticatedUserSet,
    )
    const [fullTraceCaptureEnabled, setFullTraceCaptureEnabled] = useState(
      endpoint.fullTraceCaptureEnabled,
    )
    const toast = useToast()

    const handleAuthenticatedCheck = (
      checked: boolean,
      authenticated: boolean,
    ) => {
      if (!checked) {
        authenticated = null
      }
      updateEndpointAuthenticated(endpoint.uuid, authenticated)
      setAuthenticated(authenticated)
    }

    const handleEnableFullTraceCapture = async (enabled: boolean) => {
      try {
        await updateFullTraceCaptureEnabled(endpoint.uuid, enabled)
        setFullTraceCaptureEnabled(enabled)
      } catch (err) {
        toast(
          makeToast(
            {
              title: "Updating Full Trace Capture failed",
              status: "error",
              description: err.response?.data,
              duration: 3000,
            },
            err.response?.status,
          ),
        )
      }
    }

    return (
      <Stack
        direction={{ base: "column", lg: "row" }}
        overflowY="auto"
        spacing="0"
        h="full"
      >
        <Box
          w={{ base: "full", lg: "50%" }}
          overflowY={{ base: "unset", lg: "scroll" }}
          h={{ base: "unset", lg: "full" }}
        >
          <Grid templateColumns="repeat(2, 1fr)" gap={4} p="4">
            <GridItem>
              <DataHeading>Host</DataHeading>
              <DataAttribute>{endpoint.host}</DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>Risk Score</DataHeading>
              <Badge
                py="1"
                px="2"
                fontSize="sm"
                colorScheme={RISK_TO_COLOR[endpoint.riskScore]}
                pointerEvents="none"
              >
                {endpoint.riskScore}
              </Badge>
            </GridItem>
            <GridItem>
              <DataHeading>PII Fields</DataHeading>
              <DataAttribute>{piiFields.length}</DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>Open Alerts</DataHeading>
              <DataAttribute>
                {endpoint.alerts.filter(e => e.status === Status.OPEN).length}
              </DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>First Detected</DataHeading>
              <DataAttribute>
                {getDateTimeString(endpoint.firstDetected) || "N/A"}
              </DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>Last Active</DataHeading>
              <DataAttribute>
                {getDateTimeString(endpoint.lastActive) || "N/A"}
              </DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>Authenticated</DataHeading>
              <HStack>
                <Checkbox
                  isChecked={authenticated}
                  onChange={e =>
                    handleAuthenticatedCheck(e.target.checked, true)
                  }
                >
                  Yes
                </Checkbox>
                <Checkbox
                  isChecked={authenticated !== null && !authenticated}
                  onChange={e =>
                    handleAuthenticatedCheck(e.target.checked, false)
                  }
                >
                  No
                </Checkbox>
              </HStack>
            </GridItem>
            <GridItem>
              <DataHeading>Enable Full Trace Capture</DataHeading>
              <Switch
                size="md"
                isChecked={fullTraceCaptureEnabled}
                onChange={e => handleEnableFullTraceCapture(e.target.checked)}
              />
            </GridItem>
            {usage.length > 0 && (
              <GridItem w="100%" colSpan={2}>
                <DataHeading>Usage</DataHeading>
                <Box maxW="lg">
                  <EndpointUsageChart usage={usage} />
                </Box>
              </GridItem>
            )}
            {piiFields.length > 0 ? (
              <GridItem w="100%" colSpan={2}>
                <DataHeading>PII Data</DataHeading>
                <Box maxW="xs">
                  <EndpointPIIChart piiFields={piiFields} />
                </Box>
              </GridItem>
            ) : null}
          </Grid>
        </Box>
        <SpecComponent endpoint={endpoint} />
      </Stack>
    )
  },
)

export default EndpointOverview
