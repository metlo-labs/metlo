import {
  Box,
  Button,
  Heading,
  HStack,
  useToast,
  VStack,
} from "@chakra-ui/react"
import Editor, { useMonaco } from "@monaco-editor/react"
import { updateTestingConfig } from "api/testing-config"
import { formatMetloAPIErr, MetloAPIErr } from "api/utils"
import React, { useRef, useState } from "react"
import { makeToast } from "utils"

interface TestingConfigProps {
  configString: string
}

const LANGUAGE = "hcl"

export const TestingConfig: React.FC<TestingConfigProps> = React.memo(
  ({ configString }) => {
    const [configStringVal, setConfigString] = useState<string>(configString)
    const [updating, setUpdating] = useState<boolean>(false)
    const modelRef = useRef(null)
    const monacoRef = useRef(null)
    const toast = useToast()
    const monaco = useMonaco()

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
        const data = err.response.data as {
          message: string
          startColumn?: number
          startLine?: number
          endColumn?: number
          endLine?: number
        }
        toast(
          makeToast({
            title: "Updating Testing Config failed",
            status: "error",
            description: formatMetloAPIErr(err.response.data as MetloAPIErr),
          }),
        )
        if (data.startLine) {
          const currentEditor =
            modelRef.current ??
            monaco.editor
              .getModels()
              .find(model => model._languageId == LANGUAGE)
          monaco.editor.setModelMarkers(currentEditor, "owner", [
            {
              startLineNumber: data.startLine,
              startColumn: data.startColumn,
              endLineNumber: data.endLine,
              endColumn: data.endColumn,
              message: data.message,
              severity: monacoRef.current.MarkerSeverity.Error,
            },
          ])
        }
      } finally {
        setUpdating(false)
      }
    }

    return (
      <VStack w="full" h="full">
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
        <Box rounded="md" h="full" w="full" borderWidth="1px">
          <Editor
            onMount={(_, monaco) => {
              monacoRef.current = monaco
              modelRef.current = monaco.editor
                .getModels()
                .find(model => model._languageId == LANGUAGE)
            }}
            width="100%"
            defaultLanguage={LANGUAGE}
            value={configStringVal}
            onChange={val => {
              monacoRef.current.editor.setModelMarkers(
                modelRef.current ??
                  monaco.editor
                    .getModels()
                    .find(model => model._languageId == LANGUAGE),
                "owner",
                [],
              )
              setConfigString(val)
            }}
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </Box>
      </VStack>
    )
  },
)
