import { Box, HStack, Input, Select, VStack } from "@chakra-ui/react";
import { APIKeyAuthAddTo, AuthType } from "@common/testing/enums";
import { AuthAPIKeyParams, Authorization } from "@common/testing/types";
import { useEffect, useState } from "react";

interface apiAuthInterface {
  evaluate: (v: () => Authorization) => void;
}
const APIAuth: React.FC<apiAuthInterface> = ({ evaluate }) => {
  const [key, setKey] = useState("");
  const [param, setParam] = useState("");
  const [location, setLocation] = useState<APIKeyAuthAddTo>(
    APIKeyAuthAddTo.HEADERS
  );

  useEffect(() => {
    evaluate(() => {
      return {
        type: AuthType.API_KEY,
        params: {
          key: key,
          value: param,
          add_to: location,
        } as AuthAPIKeyParams,
      };
    });
  }, [location, key, param, evaluate]);

  return (
    <VStack>
      <HStack w="full">
        <Box w="full">Key</Box>
        <Box w="full">
          <Input
            value={key}
            onChange={(v) => setKey(v.target.value)}
            placeholder={"Key"}
          />
        </Box>
      </HStack>
      <HStack w="full">
        <Box w="full">Value</Box>
        <Box w="full">
          <Input
            value={param}
            onChange={(v) => setParam(v.target.value)}
            placeholder={"Value"}
          />
        </Box>
      </HStack>
      <HStack w="full">
        <Box w="full">Add To</Box>
        <Box w="full">
          <Select
            value={location}
            onChange={(v) => setLocation(v.target.value as APIKeyAuthAddTo)}
          >
            <option value={APIKeyAuthAddTo.HEADERS}>Headers</option>
            <option value={APIKeyAuthAddTo.QUERY_PARAMS}>Query Params</option>
          </Select>
        </Box>
      </HStack>
    </VStack>
  );
};
export default APIAuth;
