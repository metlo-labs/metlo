import React from "react";
import { Avatar, Box } from "@chakra-ui/react";

interface MetloAvatarProps {
  email: string;
  name?: string;
  imageUrl?: string;
  size?: number;
}

const MetloAvatar: React.FC<MetloAvatarProps> = React.memo(
  ({ email, name, imageUrl, size }) => {
    const avatarSize = size || 12;
    if (imageUrl) {
      return (
        <Box h={avatarSize} w={avatarSize} rounded="full" overflow="hidden">
          <img
            height="100%"
            width="100%"
            src={imageUrl}
            referrerPolicy="no-referrer"
          />
        </Box>
      );
    }
    if (name) {
      return <Avatar h={avatarSize} w={avatarSize} bg="gray.100" name={name} />;
    }
    return <Avatar h={avatarSize} w={avatarSize} bg="gray.100" name={email} />;
  }
);

export default MetloAvatar;
