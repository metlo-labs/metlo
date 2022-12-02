import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import {
  Box,
  Button,
  Code,
  Heading,
  HStack,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react"
import { FaRegCopy } from "icons/fa/FaRegCopy"
import { API_KEY_TYPE, ConnectionType } from "@common/enums"
import AwsDocs from "components/ConnectionDocs/docs/aws"
import GcpDocs from "components/ConnectionDocs/docs/gcp"
import PythonDocs from "components/ConnectionDocs/docs/python"
import NodeDocs from "components/ConnectionDocs/docs/node"
import JavaDocs from "components/ConnectionDocs/docs/java"
import KubernetesDocs from "components/ConnectionDocs/docs/kubernetes"
import GoDocs from "components/ConnectionDocs/docs/go"
import { addKey, getOnboardingKeys } from "api/keys"
import { makeToast } from "utils"

interface ConnectionSetupProps {
  type: ConnectionType
}

export const ConnectionSetup: React.FC<ConnectionSetupProps> = React.memo(
  ({ type }) => {
    const router = useRouter()
    const host = "http://<YOUR_METLO_HOST>:8081"
    const [apiKey, setApiKey] = useState<string>("<YOUR_METLO_API_KEY>")
    const [createdKey, setCreatedKey] = useState<boolean>(null)
    const [creatingKey, setCreatingKey] = useState<boolean>(false)
    const [numOnboardingKeys, setNumOnboardingKeys] = useState(0)
    const toast = useToast()

    useEffect(() => {
      const fetchOnboardingKey = async () => {
        const resp = await getOnboardingKeys()
        if (resp?.[0]?.identifier) {
          setApiKey(`${resp[0].identifier}...`)
          setCreatedKey(false)
          setNumOnboardingKeys(resp.length)
        } else {
          const resp = await addKey(
            "Metlo-Onboarding-Key",
            API_KEY_TYPE.ONBOARDING,
          )
          setApiKey(resp.apiKey)
          setCreatedKey(true)
        }
      }
      fetchOnboardingKey()
    }, [])

    const handleNewApiKeyClick = async () => {
      setCreatingKey(true)
      try {
        const resp = await addKey(
          `Metlo-Onboarding-Key-${numOnboardingKeys + 1}`,
          API_KEY_TYPE.ONBOARDING,
        )
        setApiKey(resp.apiKey)
        setCreatedKey(true)
      } catch (err) {
        toast(
          makeToast(
            {
              title: "Failed to generated new api key...",
              status: "error",
            },
            err?.response?.status,
          ),
        )
      } finally {
        setCreatingKey(false)
      }
    }

    const handleCopyButton = () => {
      navigator.clipboard.writeText(apiKey)
      toast({
        title: "API Key copied",
        status: "info",
        duration: 2000,
        position: "top",
      })
    }

    let body = null
    switch (type) {
      case ConnectionType.AWS:
        body = <AwsDocs host={host} apiKey={apiKey} />
        break
      case ConnectionType.GCP:
        body = <GcpDocs host={host} apiKey={apiKey} />
        break
      case ConnectionType.PYTHON:
        body = <PythonDocs host={host} apiKey={apiKey} />
        break
      case ConnectionType.NODE:
        body = <NodeDocs host={host} apiKey={apiKey} />
        break
      case ConnectionType.JAVA:
        body = <JavaDocs host={host} apiKey={apiKey} />
        break
      case ConnectionType.KUBERNETES:
        body = <KubernetesDocs />
        break
      case ConnectionType.GOLANG:
        body = <GoDocs host={host} apiKey={apiKey} />
        break
      default:
        body = <AwsDocs host={host} apiKey={apiKey} />
    }

    return (
      <VStack h="full" w="full" alignItems="flex-start" spacing="20px">
        <Heading size="lg" fontWeight="medium">
          Setup your first connection
        </Heading>
        {createdKey ? (
          <Text>
            We have automatically generated you an API Key for this onboarding
            process. Please note it down as you will only be able to see it
            once. You can view and edit your API Keys in the{" "}
            <strong>Settings</strong> page.
          </Text>
        ) : (
          <Text>
            Please use the API Key that was previously generated during the
            onboarding process or generate a new API Key.
          </Text>
        )}
        <HStack w="full">
          <Code
            display="flex"
            justifyContent="center"
            h="55px"
            rounded="md"
            w="full"
            p="2"
          >
            <HStack w="full" justifyContent="space-between">
              <Text>{apiKey}</Text>
              {createdKey ? (
                <Button
                  leftIcon={<FaRegCopy />}
                  colorScheme="blue"
                  onClick={handleCopyButton}
                >
                  COPY
                </Button>
              ) : null}
            </HStack>
          </Code>
          {createdKey === false ? (
            <Button
              h="55px"
              colorScheme="blue"
              onClick={handleNewApiKeyClick}
              isLoading={creatingKey}
            >
              New API Key
            </Button>
          ) : null}
        </HStack>
        {body}
        <Box pt="40px" alignSelf="flex-end">
          <Button
            onClick={() => router.push({ pathname: "/", query: { step: 3 } })}
            colorScheme="blue"
          >
            Listen for Requests →
          </Button>
        </Box>
      </VStack>
    )
  },
)
