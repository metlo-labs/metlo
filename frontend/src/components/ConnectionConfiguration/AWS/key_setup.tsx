import { Box, Button, Flex, Grid, GridItem, Input } from "@chakra-ui/react";
import { useState } from "react";

interface KeySetupInterface {
  complete: (params: Record<string, any>) => void;
  name: string;
  setName: (name: string) => void;
}

const KeySetup: React.FC<KeySetupInterface> = ({ complete, name, setName }) => {
  const [accessId, setAccessId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");

  return (
    <Grid
      templateColumns="repeat(3, 1fr)"
      templateRows="repeat(4,1fr)"
      gap={4}
      py={4}
      pr={4}
    >
      <GridItem colSpan={1}>
        <Box>Name</Box>
      </GridItem>
      <GridItem colSpan={2}>
        <Box>
          <Input onChange={(e) => setName(e.target.value)} value={name} />
        </Box>
      </GridItem>
      <GridItem colSpan={1}>
        <Box>Access ID</Box>
      </GridItem>
      <GridItem colSpan={2}>
        <Box>
          <Input
            onChange={(e) => setAccessId(e.target.value)}
            value={accessId}
          />
        </Box>
      </GridItem>
      <GridItem colSpan={1}>
        <Box>Secret Access Key</Box>
      </GridItem>
      <GridItem colSpan={2}>
        <Box>
          <Input
            onChange={(e) => setSecretAccessKey(e.target.value)}
            value={secretAccessKey}
          />
        </Box>
      </GridItem>
      <GridItem w={"full"} colSpan={3}>
        <Flex justifyContent={"flex-end"} my={4}>
          <Button
            onClick={() =>
              complete({
                access_id: accessId,
                secret_access_key: secretAccessKey,
              })
            }
            disabled={!(accessId && secretAccessKey)}
          >
            Next Step
          </Button>
        </Flex>
      </GridItem>
    </Grid>
  );
};
export default KeySetup;
