import React, { useState } from "react"
import {
  Badge,
  Box,
  Button,
  HStack,
  Stack,
  useToast,
  Wrap,
  WrapItem,
} from "@chakra-ui/react"
import { Select } from "chakra-react-select"
import { updateResourcePermissions } from "api/endpoints"
import { makeToast } from "utils"
import { formatMetloAPIErr, MetloAPIErr } from "api/utils"
import { HiPencil } from "icons/hi/HiPencil"
import { FiPlus } from "icons/fi/FiPlus"

interface ResourcePermissionsProps {
  endpointId: string
  currentResourcePermissions: string[]
  allResourcePermissions: string[]
}

export const ResourcePermissions: React.FC<ResourcePermissionsProps> =
  React.memo(
    ({ endpointId, currentResourcePermissions, allResourcePermissions }) => {
      const [resourcePermissionsState, setResourcePermissions] = useState<
        string[]
      >(currentResourcePermissions)
      const [editedResourcePermissions, setEditedResourcePermissions] =
        useState<string[]>(resourcePermissionsState)

      const [updating, setUpdating] = useState<boolean>(false)
      const [editing, setEditing] = useState<boolean>(false)
      const toast = useToast()

      const updateResourcePermissionsHandler = async () => {
        setUpdating(false)
        try {
          await updateResourcePermissions(endpointId, editedResourcePermissions)
          setResourcePermissions(editedResourcePermissions)
          setEditing(false)
          toast(
            makeToast({
              title: "Updated Resource Permissions",
              status: "success",
            }),
          )
        } catch (err) {
          toast(
            makeToast({
              title: "Updating Resource Permissions failed...",
              status: "error",
              description: formatMetloAPIErr(err.response.data as MetloAPIErr),
            }),
          )
        } finally {
          setUpdating(false)
        }
      }

      if (editing) {
        return (
          <Stack direction="row" w="full">
            <Box w="2xs">
              <Select
                className="chakra-react-select"
                defaultValue={
                  editedResourcePermissions &&
                  editedResourcePermissions.map(e => ({
                    label: e,
                    value: e,
                  }))
                }
                isMulti={true}
                size="sm"
                options={allResourcePermissions.map(e => ({
                  label: e,
                  value: e,
                }))}
                onChange={e =>
                  setEditedResourcePermissions(e.map(e => e.value))
                }
                instanceId="resource-permissions-select"
              />
            </Box>
            <HStack alignSelf="flex-start">
              <Button
                variant="create"
                rounded="md"
                size="sm"
                onClick={updateResourcePermissionsHandler}
                isLoading={updating}
              >
                Save
              </Button>
              <Button
                rounded="md"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setEditedResourcePermissions(resourcePermissionsState)
                }}
              >
                Cancel
              </Button>
            </HStack>
          </Stack>
        )
      }
      return (
        <Wrap>
          {resourcePermissionsState.map((e, i) => (
            <WrapItem key={i}>
              <Badge
                p={1}
                borderWidth="1px"
                textTransform="none"
                rounded="sm"
                colorScheme="gray"
              >
                {e}
              </Badge>
            </WrapItem>
          ))}
          <WrapItem alignSelf="center">
            <Button
              variant="link"
              leftIcon={
                resourcePermissionsState.length > 0 ? <HiPencil /> : <FiPlus />
              }
              onClick={() => setEditing(true)}
              color="gray.500"
              size="sm"
            >
              {resourcePermissionsState.length > 0
                ? "Edit"
                : "Add Resource Permissions"}
            </Button>
          </WrapItem>
        </Wrap>
      )
    },
  )
