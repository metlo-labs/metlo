import React, { useEffect, useState } from "react"
import { Alert } from "@common/types"
import {
  Box,
  Badge,
  Grid,
  GridItem,
  VStack,
  Text,
  Code,
  HStack,
  Textarea,
  Button,
  useToast,
} from "@chakra-ui/react"
import { getDateTimeString, makeToast } from "utils"
import { METHOD_TO_COLOR } from "~/constants"
import { RestMethod, Status } from "@common/enums"
import { resolveAlert } from "api/alerts"

interface AlertDetailProps {
  alert: Alert
  method: RestMethod
  path: string
  alertList: Alert[]
  setAlertList: React.Dispatch<React.SetStateAction<Alert[]>>
}

const AlertDetail: React.FC<AlertDetailProps> = React.memo(
  ({ alert, method, path, alertList, setAlertList }) => {
    const [currAlert, setCurrAlert] = useState<Alert>(alert)
    const [resolving, setResolving] = useState<boolean>(false)
    const [resolutionMessage, setResolutionMessage] = useState<string>(
      alert?.resolutionMessage,
    )
    const toast = useToast()

    useEffect(() => {
      setResolutionMessage(currAlert.resolutionMessage)
    }, [currAlert])

    useEffect(() => {
      setCurrAlert(alert)
    }, [alert])

    const handleResolveClick = async () => {
      setResolving(true)
      try {
        const resp: Alert = await resolveAlert(
          currAlert.uuid,
          resolutionMessage,
        )
        toast(
          makeToast({
            title: "Successfully resolved alert!",
            status: "success",
            duration: 5000,
          }),
        )
        const tempAlertList = [...alertList]
        for (let i = 0; i < tempAlertList.length; i++) {
          if (tempAlertList[i].uuid === resp.uuid) {
            tempAlertList[i] = resp
          }
        }
        setCurrAlert(resp)
        setAlertList([...tempAlertList])
      } catch (err) {
        toast(
          makeToast(
            {
              title: "Resolving Alert Failed",
              status: "error",
              duration: 5000,
              description: err.response.data,
            },
            err?.response?.status,
          ),
        )
      } finally {
        setResolving(false)
      }
    }

    return (
      <Box h="full" overflowY="auto" p="4">
        <Grid templateColumns="1fr 1fr" gap="4">
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Type</Text>
              <Code p="1" rounded="md" fontSize="sm">
                {currAlert.type}
              </Code>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Time</Text>
              <Code p="1" rounded="md" fontSize="sm">
                {getDateTimeString(currAlert.createdAt)}
              </Code>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Endpoint</Text>
              <HStack>
                <Badge
                  fontSize="sm"
                  px="2"
                  py="1"
                  colorScheme={METHOD_TO_COLOR[method] || "gray"}
                >
                  {method.toUpperCase()}
                </Badge>
                <Code p="1" rounded="md" fontSize="sm">
                  {path}
                </Code>
              </HStack>
            </VStack>
          </GridItem>
        </Grid>
        <VStack w="full" pt="4" spacing="4">
          <VStack w="full" alignItems="flex-start">
            <Text fontWeight="semibold">Description</Text>
            <Code p="3" rounded="md" w="full" fontSize="sm">
              {currAlert.description}
            </Code>
          </VStack>
          <VStack w="full" alignItems="flex-start">
            <Text fontWeight="semibold">Resolution Reason</Text>
            <Textarea
              disabled={currAlert.status === Status.RESOLVED}
              _disabled={{
                opacity: 0.7,
                cursor: "not-allowed",
              }}
              value={resolutionMessage || ""}
              placeholder={
                currAlert.status !== Status.RESOLVED &&
                "Provide reason for resolving..."
              }
              onChange={e => setResolutionMessage(e.target.value)}
            />
          </VStack>
          {currAlert?.status === Status.RESOLVED ? (
            <Badge alignSelf="end" colorScheme="green" fontSize="lg">
              Resolved
            </Badge>
          ) : (
            <Button
              alignSelf="end"
              isLoading={resolving}
              variant="create"
              onClick={handleResolveClick}
            >
              Resolve
            </Button>
          )}
        </VStack>
      </Box>
    )
  },
)

export default AlertDetail
