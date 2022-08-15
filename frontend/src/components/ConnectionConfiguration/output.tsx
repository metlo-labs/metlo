import React from "react";
import { Textarea, Text } from "@chakra-ui/react";

interface OutputLogInterface {
  log: Array<any>;
  formatter: (prev: any, curr: any, idx: number) => string;
}
const OutputLog: React.FC<OutputLogInterface> = ({ log, formatter }) => {
  return (
    <Textarea
      height={"full"}
      resize={"none"}
      value={log.reduce(formatter, "")}
      readOnly
      size="sm"
      fontFamily={"mono"}
      lineHeight={6}
      rounded={8}
      mt={4}
    />
  );
};

export default OutputLog;
