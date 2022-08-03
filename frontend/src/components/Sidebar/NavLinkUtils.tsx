import { TiFlowSwitch } from "@react-icons/all-files/ti/TiFlowSwitch";
import { FaHome } from "@react-icons/all-files/fa/FaHome";
import { FaCog } from "@react-icons/all-files/fa/FaCog";
import { FaShareAlt } from "@react-icons/all-files/fa/FaShareAlt";
import { FaBell } from "@react-icons/all-files/fa/FaBell";
import { HiChartBar } from "@react-icons/all-files/hi/HiChartBar";
import { IconType } from "@react-icons/all-files/lib";

export enum SideNavLinkDestination {
  Home,
  Endpoints,
  Tests,
  Issues,
  Settings,
  Connections,
}

export const sideNavDestinationToLabel: (
  dest: SideNavLinkDestination
) => string = (dest) => {
  switch (dest) {
    case SideNavLinkDestination.Home:
      return "Home";
    case SideNavLinkDestination.Endpoints:
      return "Endpoints";
    case SideNavLinkDestination.Tests:
      return "Tests";
    case SideNavLinkDestination.Issues:
      return "Issues";
    case SideNavLinkDestination.Settings:
      return "Settings";
    case SideNavLinkDestination.Connections:
      return "Connections";
    default:
      throw Error(`No value mapped for ${dest}`);
  }
};

export const sideNavDestinationToIcon: (
  dest: SideNavLinkDestination
) => IconType = (dest) => {
  switch (dest) {
    case SideNavLinkDestination.Home:
      return FaHome;
    case SideNavLinkDestination.Endpoints:
      return TiFlowSwitch;
    case SideNavLinkDestination.Tests:
      return HiChartBar;
    case SideNavLinkDestination.Issues:
      return FaBell;
    case SideNavLinkDestination.Settings:
      return FaCog;
    case SideNavLinkDestination.Connections:
      return FaShareAlt;
    default:
      throw Error(`No value mapped for ${dest}`);
  }
};

export const sideNavDestinationToHref: (
  dest: SideNavLinkDestination
) => string = (dest) => {
  switch (dest) {
    case SideNavLinkDestination.Home:
      return "/";
    case SideNavLinkDestination.Endpoints:
      return "/endpoints";
    case SideNavLinkDestination.Tests:
      return "/tests";
    case SideNavLinkDestination.Issues:
      return "/issues";
    case SideNavLinkDestination.Settings:
      return "/settings";
    case SideNavLinkDestination.Connections:
      return "/connections";
    default:
      throw Error(`No value mapped for ${dest}`);
  }
};
