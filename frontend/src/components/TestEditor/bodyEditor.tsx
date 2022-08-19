import React from "react";
import { RequestBody } from "@common/testing/types";
import {
  Box,
  ColorMode,
  Heading,
  HStack,
  Select,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import { RequestBodyType } from "@common/testing/enums";
// CodeMirror default theme for light mode
import "codemirror/lib/codemirror.css";
// CodeMirror seti theme for dark mode
import "codemirror/theme/seti.css";
import dynamic from "next/dynamic";
const CodeMirror = dynamic(
  () => {
    import("codemirror/mode/javascript/javascript");
    return import("react-codemirror");
  },
  { ssr: false }
);

interface RequestBodyProps {
  body: RequestBody;
  updateBody: (t: (e: RequestBody) => RequestBody) => void;
}

const bodyTypeToDefaultVal = (type: RequestBodyType) => {
  if (type == RequestBodyType.NONE) {
    return null;
  } else if (type == RequestBodyType.JSON) {
    return "";
  } else if (type == RequestBodyType.FORM_DATA) {
    return [];
  }
};

const RequestBodyEditor: React.FC<RequestBodyProps> = React.memo(
  ({ body, updateBody }) => {
    const { colorMode } = useColorMode();
    let editor = null;

    if (body.type == RequestBodyType.NONE) {
      editor = (
        <Heading w="full" py="10" textAlign="center" size="sm" color="gray.500">
          This request does not have a body...
        </Heading>
      );
    } else if (body.type == RequestBodyType.JSON) {
      editor = (
        <CodeMirror
          value={body.data as string}
          onChange={(val) => updateBody((e) => ({ ...e, data: val }))}
          options={{
            mode: {
              name: "javascript",
              json: true,
            },
            lineNumbers: true,
            theme: colorMode === ("dark" as ColorMode) ? "seti" : "codemirror",
          }}
        />
      );
    } else if (body.type == RequestBodyType.FORM_DATA) {
      editor = null;
    }

    return (
      <VStack w="full" alignItems="flex-start" h="full" spacing="0">
        <HStack w="full" py="2" borderBottom="1px" borderColor="gray.200">
          <Heading size="xs" fontWeight="semibold" color="gray.500" px="4">
            Content Type
          </Heading>
          <Select
            size="sm"
            w="64"
            value={body.type}
            onChange={(e) =>
              updateBody((oldBody) => ({
                ...oldBody,
                type: e.target.value as RequestBodyType,
                data: bodyTypeToDefaultVal(e.target.value as RequestBodyType),
              }))
            }
          >
            {Object.values(RequestBodyType).map((e, i) => (
              <option key={i} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </HStack>
        <Box flexGrow="1" w="full" bg="secondaryBG">
          {editor}
        </Box>
      </VStack>
    );
  }
);

export default RequestBodyEditor;
