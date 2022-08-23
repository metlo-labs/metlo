import React from "react";
import {
  Box,
  Heading,
  HStack,
  Select,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { RequestBody } from "@common/testing/types";
import { RequestBodyType } from "@common/testing/enums";
import Editor from "@monaco-editor/react";

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
    const theme = useColorModeValue("light", "vs-dark");
    let editor = null;
    if (body.type == RequestBodyType.NONE) {
      editor = (
        <Heading w="full" py="10" textAlign="center" size="sm" color="gray.500">
          This request does not have a body...
        </Heading>
      );
    } else if (body.type == RequestBodyType.JSON) {
      editor = (
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          value={body.data as string}
          onChange={(val) => updateBody((e) => ({ ...e, data: val }))}
          options={{
            minimap: {
              enabled: false,
            },
            automaticLayout: true,
            theme,
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
