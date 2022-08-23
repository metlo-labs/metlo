import { extendTheme } from "@chakra-ui/react";
import { mode, StyleFunctionProps } from "@chakra-ui/theme-tools";

const fonts = { mono: `'Menlo', monospace` };

const breakpoints = {
  sm: "40em",
  md: "52em",
  lg: "64em",
  xl: "80em",
};

const theme = extendTheme({
  semanticTokens: {
    colors: {
      text: {
        default: "#16161D",
        _dark: "#ade3b8",
      },
      heroGradientStart: {
        default: "#7928CA",
        _dark: "#e3a7f9",
      },
      heroGradientEnd: {
        default: "#FF0080",
        _dark: "#fbec8f",
      },
      secondaryBG: {
        default: "rgb(248, 248, 249)",
        _dark: "rgb(19, 22, 26)",
      },
      cellBG: {
        default: "white",
        _dark: "rgb(39, 40, 43)",
      },
      headerColor: {
        default: "rgb(179, 181, 185)",
        _dark: "rgb(91, 94, 109)",
      },
    },
    radii: {
      button: "12px",
    },
  },
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: mode("rgb(252, 252, 252)", "black")(props),
      },
    }),
  },
  colors: {
    black: "rgb(17, 19, 23)",
    primary: "rgb(101, 138, 216)",
  },
  fonts,
  breakpoints,
});

export default theme;
