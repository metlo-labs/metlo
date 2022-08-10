import React from "react";
import dynamic from "next/dynamic";
import {
  Badge,
  Box,
  Code,
  ColorMode,
  Grid,
  GridItem,
  HStack,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import { ApiTrace } from "@common/types";
import { getDateTimeString } from "../../utils";
import { METHOD_TO_COLOR } from "../../constants";
import { statusCodeToColor } from "../utils/StatusCode";
const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

interface TraceDetailProps {
  trace: ApiTrace;
}

const JSONContentViewer = (data: string, colorMode: ColorMode) => {
  const bgColor = colorMode === "dark" ? "#4C5564" : "#EDF2F7";
  try {
    return (
      <Box w="full" h="full" rounded="md" bgColor={bgColor}>
        <ReactJson
          theme={colorMode === "dark" ? "summerfruit" : "summerfruit:inverted"}
          src={JSON.parse(data)}
          name={false}
          indentWidth={2}
          enableClipboard={false}
          collapsed={1}
          style={{
            height: "100%",
            padding: "16px",
            overflow: "auto",
            maxHeight: "40vh",
            borderRadius: "0.375rem",
            backgroundColor: bgColor,
          }}
        />
      </Box>
    );
  } catch {
    return (
      <Code h="full" p="2" rounded="md" w="full">
        {data}
      </Code>
    );
  }
};

const TraceDetail: React.FC<TraceDetailProps> = React.memo(({ trace }) => {
  const colorMode = useColorMode();
  return (
    <Box h="full" overflowY="auto" p="4">
      <Grid templateColumns="1fr 1fr" gap="4">
        <GridItem colSpan={2}>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Endpoint</Text>
            <HStack>
              <Badge
                fontSize="sm"
                px="2"
                py="1"
                colorScheme={statusCodeToColor(trace.responseStatus) || "gray"}
              >
                {trace.responseStatus}
              </Badge>
              <Badge
                fontSize="sm"
                px="2"
                py="1"
                colorScheme={METHOD_TO_COLOR[trace.method] || "gray"}
              >
                {trace.method.toUpperCase()}
              </Badge>
              <Code p="1" fontSize="sm">
                {trace.path}
              </Code>
            </HStack>
          </VStack>
        </GridItem>
        <GridItem>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Time</Text>
            <Code p="1" fontSize="sm">
              {getDateTimeString(trace.createdAt)}
            </Code>
          </VStack>
        </GridItem>
        <GridItem>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Host</Text>
            <Code p="1" fontSize="sm">
              {trace.host}
            </Code>
          </VStack>
        </GridItem>
        <GridItem>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Source</Text>
            <Text
              fontFamily="mono"
              fontSize="sm"
            >{`${trace.meta.source}:${trace.meta.sourcePort}`}</Text>
          </VStack>
        </GridItem>
        <GridItem>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Destination</Text>
            <Text
              fontFamily="mono"
              fontSize="sm"
            >{`${trace.meta.destination}:${trace.meta.destinationPort}`}</Text>
          </VStack>
        </GridItem>
        <GridItem h="full" colSpan={2}>
          <VStack h="full" alignItems="flex-start">
            <Text fontWeight="semibold">Request Headers</Text>
            {JSONContentViewer(
              JSON.stringify(trace.requestHeaders || []),
              colorMode.colorMode
            )}
          </VStack>
        </GridItem>
        <GridItem h="full" colSpan={2}>
          <VStack h="full" alignItems="flex-start">
            <Text fontWeight="semibold">Request Parameters</Text>
            {JSONContentViewer(
              JSON.stringify(trace.requestParameters),
              colorMode.colorMode
            )}
          </VStack>
        </GridItem>
        <GridItem h="full" colSpan={2}>
          <VStack h="full" alignItems="flex-start">
            <Text fontWeight="semibold">Request Body</Text>
            {JSONContentViewer(trace.requestBody, colorMode.colorMode)}
          </VStack>
        </GridItem>
        <GridItem h="full" colSpan={2}>
          <VStack h="full" alignItems="flex-start">
            <Text fontWeight="semibold">Response Headers</Text>
            {JSONContentViewer(
              JSON.stringify(trace.responseHeaders),
              colorMode.colorMode
            )}
          </VStack>
        </GridItem>
      </Grid>
      <VStack pt="4" alignItems="flex-start">
        <Text fontWeight="semibold">Response Body</Text>
        {JSONContentViewer(trace.responseBody, colorMode.colorMode)}
      </VStack>
    </Box>
  );
});

export default TraceDetail;
