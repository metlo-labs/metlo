import React from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  StackProps,
  VStack,
} from "@chakra-ui/react";
import { IoMdTrash } from "@react-icons/all-files/io/IoMdTrash";
import "codemirror/lib/codemirror.css";
import dynamic from "next/dynamic";
const CodeMirror = dynamic(
  () => {
    import("codemirror/mode/javascript/javascript");
    return import("react-codemirror");
  },
  { ssr: false }
);

interface TestScriptEditorProps extends StackProps {
  testScript: string;
  updateTestScript: (t: (e: string) => string) => void;
}

const TestScriptEditor: React.FC<TestScriptEditorProps> = React.memo(
  ({ testScript, updateTestScript, ...props }) => {
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
            <Button size="sm" variant="ghost">
              <IoMdTrash />
            </Button>
          </HStack>
        </HStack>
        <Box flexGrow="1" w="full">
          <CodeMirror
            value={testScript}
            onChange={(val) => updateTestScript((e) => val)}
            options={{
              mode: {
                name: "javascript",
              },
            }}
          />
        </Box>
      </VStack>
    );
  }
);

export default TestScriptEditor;
