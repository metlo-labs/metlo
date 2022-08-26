import { useColorMode, IconButton } from "@chakra-ui/react"
import { SunIcon, MoonIcon } from "@chakra-ui/icons"

export const DarkModeSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === "dark"
  return (
    <IconButton
      position="fixed"
      bottom={4}
      right={4}
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      aria-label="Toggle Theme"
      colorScheme="blue"
      onClick={toggleColorMode}
    />
  )
}
