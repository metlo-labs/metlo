import React, { useEffect, useState } from "react"
import {
  Box,
  Grid,
  GridItem,
  Text,
  VStack,
  Code,
  Badge,
  useToast,
  Button,
} from "@chakra-ui/react"
import { DataField } from "@common/types"
import { RISK_TO_COLOR, TAG_TO_COLOR } from "~/constants"
import {
  getDateTimeString,
  getMaxRiskScoreFromList,
  getRiskScores,
} from "utils"
import { deleteDataField, updateDataFieldClasses } from "api/dataFields"
import { DataClass, RiskScore } from "@common/enums"
import { DataFieldTagList } from "./DataFieldTags"

interface DataFieldDetailProps {
  dataField: DataField
  dataFieldList: DataField[]
  setdataFieldList: React.Dispatch<React.SetStateAction<DataField[]>>
  setDataField: (value: React.SetStateAction<DataField>) => void
}

const DataFieldDetail: React.FC<DataFieldDetailProps> = React.memo(
  ({ dataField, dataFieldList, setdataFieldList, setDataField }) => {
    const [currDataField, setCurrDataField] = useState<DataField>(dataField)
    const [updating, setUpdating] = useState<boolean>(false)
    const [riskScore, setRiskScore] = useState<RiskScore>()
    const toast = useToast()

    useEffect(() => {
      setCurrDataField(dataField)
    }, [dataField])

    useEffect(() => {
      setRiskScore(
        getMaxRiskScoreFromList(getRiskScores(currDataField.dataClasses)),
      )
    }, [currDataField])

    const handleDeleteDataField = async () => {
      setUpdating(true)
      const res = await deleteDataField(currDataField.uuid)
      if (res) {
        toast({
          title: `Removed Data Field ${currDataField.dataPath}`,
          status: "success",
          duration: 3000,
          position: "top",
        })
        setdataFieldList(dataFieldList.filter(e => e.uuid !== res.uuid))
        setDataField(undefined)
      } else {
        toast({
          title: "Data Field Deletion failed...",
          status: "error",
          isClosable: true,
          duration: 5000,
          position: "top",
        })
      }
      setUpdating(false)
    }

    const handleUpdateTags = async (newTags: DataClass[]) => {
      setUpdating(true)
      return updateDataFieldClasses(currDataField.uuid, {
        dataClasses: newTags,
        dataPath: currDataField.dataPath,
        dataSection: currDataField.dataSection,
      })
        .then(resp => {
          setCurrDataField(resp)
          setdataFieldList(
            dataFieldList.map(e => (e.uuid == resp.uuid ? resp : e)),
          )
          return resp
        })
        .catch(e => {
          toast({
            title: "Data Class Update failed...",
            status: "error",
            position: "top",
          })
        })
        .finally(() => setUpdating(false))
    }

    return (
      <Box h="full" overflowY="auto" p="4">
        <Grid templateColumns="1fr 1fr" gap="4">
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Field</Text>
              {currDataField.dataPath ? (
                <Code p="1" rounded="md" fontSize="sm">
                  {currDataField.dataPath}
                </Code>
              ) : (
                <Text>None</Text>
              )}
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Risk Score</Text>
              <Badge
                p="1"
                fontSize="sm"
                colorScheme={RISK_TO_COLOR[riskScore]}
                pointerEvents="none"
              >
                {riskScore}
              </Badge>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Data Type</Text>
              <Code p="1" rounded="md" fontSize="sm">
                {currDataField.dataType || "N/A"}
              </Code>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack alignItems="flex-start">
              <Text fontWeight="semibold">Date Identified</Text>
              <Code p="1" rounded="md" fontSize="sm">
                {getDateTimeString(currDataField.createdAt)}
              </Code>
            </VStack>
          </GridItem>
          {currDataField.dataTag && (
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Tag</Text>
                <Badge
                  py="1"
                  px="2"
                  fontSize="sm"
                  colorScheme={TAG_TO_COLOR[currDataField.dataTag]}
                >
                  {currDataField.dataTag}
                </Badge>
              </VStack>
            </GridItem>
          )}
        </Grid>
        <VStack w="full" pt="4" spacing="4" alignItems="flex-start">
          <Text w="full" fontWeight="semibold">
            Sensitive Data Classes
          </Text>
          <DataFieldTagList
            tags={currDataField.dataClasses}
            updateTags={handleUpdateTags}
            updating={updating}
          />
        </VStack>
        <Box pt="4" textAlign="end">
          <Button
            colorScheme="red"
            isLoading={updating}
            onClick={handleDeleteDataField}
          >
            Delete
          </Button>
        </Box>
      </Box>
    )
  },
)

export default DataFieldDetail
