import React from "react";
import { ApiEndpointDetailed } from "@common/types";
import {
  Box,
  Badge,
  Grid,
  GridItem,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import Highlight, { defaultProps } from "prism-react-renderer";
import darkTheme from "prism-react-renderer/themes/duotoneDark";
import lightTheme from "prism-react-renderer/themes/github";
import { DataAttribute, DataHeading } from "components/utils/Card";
import EndpointUsageChart from "./UsageChart";
import { RISK_TO_COLOR } from "~/constants";
import EndpointPIIChart from "./PIIChart";
import { getDateTimeString } from "utils";

interface EndpointOverviewProps {
  endpoint: ApiEndpointDetailed;
}

const EndpointOverview: React.FC<EndpointOverviewProps> = React.memo(
  ({ endpoint }) => {
    const theme = useColorModeValue(lightTheme, darkTheme);
    return (
      <Stack direction={{ base: "column", lg: "row" }} spacing="0" h="full">
        <Box
          w={{ base: "full", lg: "50%" }}
          overflowY={{ base: "unset", lg: "scroll" }}
          h={{ base: "unset", lg: "full" }}
        >
          <Grid templateColumns="repeat(2, 1fr)" gap={4} p="4">
            <GridItem>
              <DataHeading>Host</DataHeading>
              <DataAttribute>{endpoint.host}</DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>Risk Score</DataHeading>
              <Badge
                p="1"
                fontSize="sm"
                colorScheme={RISK_TO_COLOR[endpoint.riskScore]}
                pointerEvents="none"
              >
                {endpoint.riskScore}
              </Badge>
            </GridItem>
            <GridItem>
              <DataHeading>PII Fields</DataHeading>
              <DataAttribute>{endpoint.sensitiveDataClasses.length}</DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>Alerts</DataHeading>
              <DataAttribute>{endpoint.alerts.length}</DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>First Detected</DataHeading>
              <DataAttribute>{getDateTimeString(endpoint.firstDetected) || "N/A"}</DataAttribute>
            </GridItem>
            <GridItem>
              <DataHeading>Last Active</DataHeading>
              <DataAttribute>{getDateTimeString(endpoint.lastActive) || "N/A"}</DataAttribute>
            </GridItem>
            <GridItem w="100%" colSpan={2}>
              <DataHeading>Usage</DataHeading>
              <Box maxW="lg">
                <EndpointUsageChart />
              </Box>
            </GridItem>
            {endpoint.sensitiveDataClasses.length > 0 ? (
              <GridItem w="100%" colSpan={2}>
                <DataHeading>PII Data</DataHeading>
                <Box maxW="xs">
                  <EndpointPIIChart piiFields={endpoint.sensitiveDataClasses} />
                </Box>
              </GridItem>
            ) : null}
          </Grid>
        </Box>
        <Box
          w={{ base: "full", lg: "50%" }}
          overflowY={{ base: "unset", lg: "scroll" }}
          h={{ base: "unset", lg: "full" }}
        >
          <Highlight {...defaultProps} theme={theme} code={endpoint?.openapiSpec?.spec || "No spec."} language={endpoint?.openapiSpec?.extension || "yaml"}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={className}
                style={{
                  ...style,
                  fontSize: "14px",
                  padding: "8px",
                  overflowX: "scroll",
                  minHeight: "100%",
                }}
              >
                {tokens.map((line, i) => (
                  <pre
                    style={{
                      textAlign: "left",
                      margin: "1em 0",
                      padding: "0.5em",
                      overflow: "scroll",
                    }}
                    key={i}
                    {...getLineProps({ line, key: i })}
                  >
                    <span
                      style={{
                        display: "table-cell",
                        textAlign: "right",
                        paddingRight: "1em",
                        userSelect: "none",
                        opacity: "0.5",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ display: "table-cell" }}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token, key })} />
                      ))}
                    </span>
                  </pre>
                ))}
              </pre>
            )}
          </Highlight>
        </Box>
      </Stack>
    );
  }
);

export default EndpointOverview;
