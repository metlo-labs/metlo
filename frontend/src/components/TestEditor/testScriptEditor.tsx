import React from "react"
import {
  Box,
  Button,
  Heading,
  HStack,
  StackProps,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react"
import { IoMdTrash } from "icons/io/IoMdTrash"
import Editor from "@monaco-editor/react"

interface TestScriptEditorProps extends StackProps {
  testScript: string
  updateTestScript: (t: (e: string) => string) => void
}

const TestScriptEditor: React.FC<TestScriptEditorProps> = React.memo(
  ({ testScript, updateTestScript, ...props }) => {
    const theme = useColorModeValue("light", "vs-dark")
    return (
      <VStack w="full" alignItems="flex-start" h="full" spacing="0" {...props}>
        <HStack
          w="full"
          justifyContent="space-between"
          borderBottom="1px"
          borderColor="gray.200"
        >
          <Heading size="xs" fontWeight="semibold" color="gray.500" px="4">
            Tests
          </Heading>
          <HStack pr="6" color="gray.500">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateTestScript(e => "")}
            >
              <IoMdTrash />
            </Button>
          </HStack>
        </HStack>
        <Box flexGrow="1" w="full" bg="secondaryBG">
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="javascript"
            value={testScript as string}
            onChange={val => updateTestScript(e => val)}
            options={{
              minimap: {
                enabled: false,
              },
              automaticLayout: true,
              theme,
            }}
          />
        </Box>
      </VStack>
    )
  },
)

export default TestScriptEditor
