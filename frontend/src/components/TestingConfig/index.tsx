import {
  Box,
  Button,
  Heading,
  HStack,
  useToast,
  VStack,
} from "@chakra-ui/react"
import Editor from "@monaco-editor/react"
import { updateTestingConfig } from "api/testing-config"
import { formatMetloAPIErr, MetloAPIErr } from "api/utils"
import React, { useState } from "react"
import { makeToast } from "utils"

interface TestingConfigProps {
  configString: string
}

export const TestingConfig: React.FC<TestingConfigProps> = React.memo(
  ({ configString }) => {
    const [configStringVal, setConfigString] = useState<string>(configString)
    const [updating, setUpdating] = useState<boolean>(false)
    const toast = useToast()

    const updateTestingConfigHandler = async () => {
      setUpdating(true)
      try {
        let resp = await updateTestingConfig(configStringVal)
        if (resp === 200) {
          toast(
            makeToast({
              title: "Updated Testing Config",
              status: "success",
            }),
          )
        } else {
          throw new Error("")
        }
      } catch (err) {
        toast(
          makeToast({
            title: "Updating Testing Config failed",
            status: "error",
            description: formatMetloAPIErr(err.response.data as MetloAPIErr),
          }),
        )
      } finally {
        setUpdating(false)
      }
    }

    return (
      <VStack w="full">
        <HStack
          w="full"
          justifyContent="space-between"
          mb={4}
          alignItems="start"
        >
          <Heading fontWeight="semibold" size="xl">
            Testing Config
          </Heading>
          <Button
            isLoading={updating}
            variant="create"
            onClick={updateTestingConfigHandler}
          >
            Save
          </Button>
        </HStack>
        <Box rounded="md" h="600px" w="full" borderWidth="1px">
          <Editor
            width="100%"
            defaultLanguage="json"
            value={configStringVal}
            onChange={val => setConfigString(val)}
            options={{
              minimap: {
                enabled: false,
              },
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </Box>
      </VStack>
    )
  },
)
