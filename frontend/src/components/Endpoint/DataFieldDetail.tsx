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
import { DataClass, DataField } from "@common/types"
import { RISK_TO_COLOR, TAG_TO_COLOR } from "~/constants"
import {
  getDateTimeString,
  getMaxRiskScoreFromList,
  getRiskScores,
  makeToast,
} from "utils"
import { deleteDataField, updateDataFieldClasses } from "api/dataFields"
import { RiskScore } from "@common/enums"
import { DataFieldTagList } from "./DataFieldTags"
import { statusCodeToColor } from "components/utils/StatusCode"

interface DataFieldDetailProps {
  dataField: DataField
  dataFieldList: DataField[]
  dataClasses: DataClass[]
  setdataFieldList: React.Dispatch<React.SetStateAction<DataField[]>>
  setDataField: (value: React.SetStateAction<DataField>) => void
}

const DataFieldDetail: React.FC<DataFieldDetailProps> = React.memo(
  ({
    dataField,
    dataFieldList,
    dataClasses,
    setdataFieldList,
    setDataField,
  }) => {
    const toast = useToast()
    const [currDataField, setCurrDataField] = useState<DataField>(dataField)
    const [updating, setUpdating] = useState<boolean>(false)
    const [riskScore, setRiskScore] = useState<RiskScore>()

    useEffect(() => {
      setCurrDataField(dataField)
    }, [dataField])

    useEffect(
      (...rest) => {
        setRiskScore(
          getMaxRiskScoreFromList(
            getRiskScores(currDataField.dataClasses, dataClasses),
          ),
        )
      },
      [currDataField, dataClasses],
    )

    const handleDeleteDataField = async () => {
      setUpdating(true)
      try {
        const res = await deleteDataField(currDataField.uuid)
        toast(
          makeToast({
            title: `Removed Data Field ${currDataField.dataPath}`,
            status: "success",
            duration: 3000,
          }),
        )
        setdataFieldList(dataFieldList.filter(e => e.uuid !== res.uuid))
        setDataField(undefined)
      } catch (err) {
        toast(
          makeToast(
            {
              title: "Data Field Deletion failed",
              status: "error",
              description: err.response?.data,
              duration: 5000,
            },
            err.response?.status,
          ),
        )
      } finally {
        setUpdating(false)
      }
    }

    const handleUpdateTags = async (newTags: string[]) => {
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
          toast(
            makeToast(
              {
                title: "Data Class Update failed",
                status: "error",
                description: e.response?.data,
              },
              e.response?.status,
            ),
          )
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
          {currDataField.statusCode ? (
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Status Code</Text>
                <Badge
                  fontSize="sm"
                  px="2"
                  py="1"
                  colorScheme={
                    statusCodeToColor(currDataField.statusCode) || "gray"
                  }
                  data-tag="allowRowEvents"
                >
                  {currDataField.statusCode}
                </Badge>
              </VStack>
            </GridItem>
          ) : null}
          {currDataField.contentType ? (
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Content Type</Text>
                <Code p="1" rounded="md" fontSize="sm">
                  {currDataField.contentType}
                </Code>
              </VStack>
            </GridItem>
          ) : null}
          {currDataField.isNullable !== null ? (
            <GridItem>
              <VStack alignItems="flex-start">
                <Text fontWeight="semibold">Nullable</Text>
                <Code p="1" rounded="md" fontSize="sm">
                  {currDataField.isNullable.toString()}
                </Code>
              </VStack>
            </GridItem>
          ) : null}
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
            dataClasses={dataClasses}
          />
        </VStack>
        <Box mt="10" pt="4" borderTopWidth={1} w="full" textAlign="end">
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
