import React from "react"
import Image from "next/image"

import { useColorModeValue, BoxProps, Box } from "@chakra-ui/react"

export const Logo = React.memo((props: BoxProps) => {
  const imageSrc = useColorModeValue(
    "/metlo_logo_horiz.svg",
    "/metlo_logo_horiz_negative.svg",
  )
  return (
    <Box {...props}>
      <Image height="36" width="127" src={imageSrc} />
    </Box>
  )
})

export const SmLogo = React.memo((props: BoxProps) => {
  return (
    <Box {...props}>
      <Image height="30" width="30" src="/metlo_logo.svg" />
    </Box>
  )
})
