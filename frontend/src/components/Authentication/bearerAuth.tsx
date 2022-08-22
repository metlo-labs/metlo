import { Box, HStack, Input, VStack } from "@chakra-ui/react";
import { AuthType } from "@common/testing/enums";
import {
  AuthBearerParams,
  Authorization,
  Request,
} from "@common/testing/types";
import { useEffect, useState } from "react";

interface basicAuthInterface {
  evaluate: (v: () => Authorization) => void;
}
const BearerAuth: React.FC<basicAuthInterface> = ({ evaluate }) => {
  const [bearerToken, setBearerToken] = useState("");

  useEffect(() => {
    evaluate(() => {
      return {
        type: AuthType.BEARER,
        params: { bearer_token: bearerToken } as AuthBearerParams,
      };
    });
  }, [bearerToken, evaluate]);

  return (
    <VStack w="full">
      <HStack w="full">
        <Box w="full">Bearer Token</Box>
        <Box w="full">
          <Input
            value={bearerToken}
            onChange={(v) => setBearerToken(v.target.value)}
            placeholder={"BearerToken"}
          />
        </Box>
      </HStack>
    </VStack>
  );
};
export default BearerAuth;
