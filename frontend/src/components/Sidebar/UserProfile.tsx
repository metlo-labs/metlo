import React from "react"
import { Flex, HStack, Text } from "@chakra-ui/react"

import MetloAvatar from "components/utils/MetloAvatar"

interface UserProfileProps {
  name?: string
  imageUrl?: string
  email?: string
}

const UserProfile: React.FC<UserProfileProps> = React.memo(
  ({ name, imageUrl, email }) => {
    return (
      <HStack spacing="4" px="2">
        {email ? (
          <MetloAvatar email={email} name={name} imageUrl={imageUrl} />
        ) : null}
        <Flex alignItems="flex-start" direction="column">
          <Text fontSize="md">{name}</Text>
          <Text fontSize="sm" lineHeight="shorter">
            {email}
          </Text>
        </Flex>
      </HStack>
    )
  },
)

export default UserProfile
