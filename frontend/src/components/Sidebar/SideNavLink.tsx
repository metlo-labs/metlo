import {
  Box,
  HStack,
  Icon,
  Link,
  LinkProps,
  Text,
  Tooltip,
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
        color="blackAlpha.600"
        _hover={{
          bg: "blackAlpha.50",
          color: "blackAlpha.900",
        }}
        _activeLink={{
          bg: "blackAlpha.100",
          color: "blackAlpha.900",
        }}
        {...rest}
        href={sideNavDestinationToHref(destination)}
      >
        <Box display={{ xl: "unset", base: "none" }}>
          <HStack spacing={4} alignItems="center">
            <Icon
              as={sideNavDestinationToIcon(destination)}
              boxSize="20px"
              color="inherit"
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
                color="inherit"
              />
            </span>
          </Tooltip>
        </Box>
      </Link>
    );
  }
);

export default SideNavLink;
