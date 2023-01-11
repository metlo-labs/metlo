import {
  Box,
  HStack,
  Flex,
  Icon,
  BoxProps,
  Text,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react"
import NextLink from "next/link"
import React from "react"
import {
  sideNavDestinationToHref,
  sideNavDestinationToIcon,
  sideNavDestinationToLabel,
  SideNavLinkDestination,
} from "./NavLinkUtils"

interface SideNavLinkProps extends BoxProps {
  destination: SideNavLinkDestination
  onClose?: () => void
  isActive?: boolean
  isComingSoon?: boolean
}

const SideNavLink: React.FC<SideNavLinkProps> = React.memo(
  ({ isActive, destination, onClose, isComingSoon, ...rest }) => {
    const colorModeValue = useColorModeValue(
      "rgb(163, 165, 170)",
      "rgb(98, 100, 116)",
    )
    const iconColor = isActive ? "primary" : colorModeValue
    return (
      <Box w="full" pointerEvents={isComingSoon ? "none" : "unset"}>
        <NextLink
          href={sideNavDestinationToHref(destination)}
          onClick={onClose}
        >
          <Box
            w="full"
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
          >
            <Box w="full">
              <HStack justifyContent="space-between" alignItems="center">
                <HStack spacing={4} alignItems="center">
                  <Icon
                    as={sideNavDestinationToIcon(destination)}
                    boxSize="20px"
                    color={iconColor}
                  />
                  <Text>{sideNavDestinationToLabel(destination)}</Text>
                </HStack>
                {isComingSoon ? (
                  <Text
                    fontSize="xs"
                    bg="primary"
                    textColor="white"
                    px="2"
                    rounded="full"
                    fontWeight="semibold"
                  >
                    Coming Soon
                  </Text>
                ) : null}
              </HStack>
            </Box>
          </Box>
        </NextLink>
      </Box>
    )
  },
)

export default SideNavLink
