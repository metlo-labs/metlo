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
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

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
          <Editor
            value={testScript}
            onValueChange={(val) => updateTestScript((e) => val)}
            highlight={(code) => highlight(code, languages.js)}
            padding={10}
            style={{
              backgroundColor: "white",
              height: "100%",
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
            }}
          />
        </Box>
      </VStack>
    );
  }
);

export default TestScriptEditor;
