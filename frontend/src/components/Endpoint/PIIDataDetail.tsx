import React, { useEffect, useState } from "react";
import { Box, Grid, GridItem, Text, VStack, Code, Badge, HStack, Checkbox, useToast } from "@chakra-ui/react";
import { PIIField } from "@common/types"
import { RISK_TO_COLOR, DATA_CLASS_TO_RISK_SCORE } from "~/constants";
import { getDateTimeString } from "utils";
import { updatePIIField } from "api/piiFields";

interface PIIDataDetailProps {
  piiField: PIIField;
  piiFieldList: PIIField[];
  setPiiFieldList: React.Dispatch<React.SetStateAction<PIIField[]>>;
}

const PIIDataDetail: React.FC<PIIDataDetailProps> = React.memo(({ piiField, piiFieldList, setPiiFieldList }) => {
  const [currPiiField, setCurrPiiField] = useState<PIIField>(piiField);
  const [updating, setUpdating] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    setCurrPiiField(piiField);
  }, [piiField]);

  const handleUpdateClick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdating(true);
    const resp: PIIField = await updatePIIField(currPiiField.uuid, { isRisk: !e.target.checked });
    if (resp) {
      toast({
        title: "Successfully Updated PII Field!",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
      const tempFieldList = [...piiFieldList];
      for (let i = 0; i < tempFieldList.length; i++) {
        if (tempFieldList[i].uuid === resp.uuid) {
          tempFieldList[i] = resp;
        }
      }
      setCurrPiiField(resp);
      setPiiFieldList([...tempFieldList]);
    } else {
      toast({
        title: "Updating PII Field Failed...",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
    }
    setUpdating(false);
  }

  return (
    <Box h="full" overflowY="auto" p="4">
      <Grid templateColumns="1fr 1fr" gap="4">
        <GridItem>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Data Type</Text>
            <Code p="1" rounded="md" fontSize="sm">
              {currPiiField.dataClass}
            </Code>
          </VStack>
        </GridItem>
        <GridItem>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Data Path</Text>
            <Code p="1" rounded="md" fontSize="sm">
              {currPiiField.dataPath}
            </Code>
          </VStack>
        </GridItem>
        <GridItem>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Risk Score</Text>
            <Badge
              p="1"
              fontSize="sm"
              colorScheme={RISK_TO_COLOR[DATA_CLASS_TO_RISK_SCORE[currPiiField.dataClass]]}
              pointerEvents="none"
            >
              {DATA_CLASS_TO_RISK_SCORE[currPiiField.dataClass]}
            </Badge>
          </VStack>
        </GridItem>
        <GridItem>
          <VStack alignItems="flex-start">
            <Text fontWeight="semibold">Date Identified</Text>
            <Code p="1" rounded="md" fontSize="sm">
              {getDateTimeString(currPiiField.createdAt)}
            </Code>
          </VStack>
        </GridItem>
      </Grid>
      <VStack w="full" pt="4" spacing="4">
        <VStack w="full" alignItems="flex-start">
          <Text fontWeight="semibold">Example Matches</Text>
          <Code p="1" w="full" rounded="md" fontSize="sm">
            {currPiiField.matches.join("\n")}
          </Code>
        </VStack>
        <HStack w="full" spacing="5">
          <Checkbox isChecked={!currPiiField.isRisk} onChange={handleUpdateClick} size="lg" colorScheme="green">
            Fake
          </Checkbox>
        </HStack>
      </VStack>
    </Box>
  )
});

export default PIIDataDetail;
