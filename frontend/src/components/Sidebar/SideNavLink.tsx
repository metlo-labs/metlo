import {
  Box,
  HStack,
  Icon,
  Link,
  LinkProps,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import {
  sideNavDestinationToHref,
  sideNavDestinationToIcon,
  sideNavDestinationToLabel,
  SideNavLinkDestination,
} from "./NavLinkUtils";

interface SideNavLinkProps extends LinkProps {
  destination: SideNavLinkDestination;
  isActive?: boolean;
}

const SideNavLink: React.FC<SideNavLinkProps> = React.memo(
  ({ isActive, destination, ...rest }) => {
    const iconColor = isActive
      ? "rgb(101, 138, 216)"
      : useColorModeValue("rgb(163, 165, 170)", "rgb(98, 100, 116)");
    return (
      <Link
        display="block"
        py={3}
        px={4}
        borderRadius="lg"
        transition="all 0.15s"
        fontWeight="medium"
        lineHeight="1.5rem"
        aria-current={isActive ? "page" : undefined}
        _hover={{
          bg: useColorModeValue("rgb(240, 240, 242)", "rgb(25, 28, 35)"),
        }}
        _activeLink={{
          color: useColorModeValue("black", "white"),
        }}
        {...rest}
        href={sideNavDestinationToHref(destination)}
      >
        <Box display={{ xl: "unset", base: "none" }}>
          <HStack spacing={4} alignItems="center">
            <Icon
              as={sideNavDestinationToIcon(destination)}
              boxSize="20px"
              color={iconColor}
            />
            <Text>{sideNavDestinationToLabel(destination)}</Text>
          </HStack>
        </Box>
        <Box display={{ xl: "none", base: "unset" }}>
          <Tooltip
            hasArrow
            placement="left"
            label={sideNavDestinationToLabel(destination)}
          >
            <span>
              <Icon
                as={sideNavDestinationToIcon(destination)}
                boxSize="20px"
                color={iconColor}
              />
            </span>
          </Tooltip>
        </Box>
      </Link>
    );
  }
);

export default SideNavLink;
