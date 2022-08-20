import { Box, HStack, Input, VStack } from "@chakra-ui/react";
import { AuthType } from "@common/testing/enums";
import { Authorization, Request } from "@common/testing/types";
import { useEffect, useState } from "react";

interface basicAuthInterface {
  evaluate: (v: () => Authorization) => void;
}
const BasicAuth: React.FC<basicAuthInterface> = ({ evaluate }) => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    evaluate(() => {
      return {
        type: AuthType.BASIC_AUTH,
        params: { username: userName, password: password },
      };
    });
  }, [userName, password]);

  return (
    <VStack w={"full"}>
      <HStack w={"full"}>
        <Box w={"full"}>User Name</Box>
        <Box w={"full"}>
          <Input
            value={userName}
            onChange={(v) => setUserName(v.target.value)}
            placeholder={"User Name"}
          />
        </Box>
      </HStack>
      <HStack w={"full"}>
        <Box w={"full"}>Password</Box>
        <Box w={"full"}>
          <Input
            value={password}
            onChange={(v) => setPassword(v.target.value)}
            placeholder={"Password"}
            type={"password"}
          />
        </Box>
      </HStack>
    </VStack>
  );
};
export default BasicAuth;
