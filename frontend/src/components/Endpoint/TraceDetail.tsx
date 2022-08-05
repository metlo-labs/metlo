import React from "react";
import { Box } from "@chakra-ui/react";
import { ApiTrace } from "@common/types";

interface TraceDetailProps {
  trace: ApiTrace;
}

const TraceDetail: React.FC<TraceDetailProps> = React.memo(({ trace }) => {
  return <Box></Box>;
});

export default TraceDetail;
