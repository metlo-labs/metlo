import { FaFolder } from "@react-icons/all-files/fa/FaFolder";
import { TiFlowSwitch } from "@react-icons/all-files/ti/TiFlowSwitch";
import { FaHome } from "@react-icons/all-files/fa/FaHome";
import { FaCog } from "@react-icons/all-files/fa/FaCog";
import { FaShareAlt } from "@react-icons/all-files/fa/FaShareAlt";
import { FaBookOpen } from "@react-icons/all-files/fa/FaBookOpen";
import { HiChartBar } from "@react-icons/all-files/hi/HiChartBar";
import { FaCheckSquare } from "@react-icons/all-files/fa/FaCheckSquare";
import { IconType } from "@react-icons/all-files/lib";

export enum SideNavLinkDestination {
  Overview,
  Endpoints,
  Tests,
  Issues,
}

export const sideNavDestinationToLabel: (
  dest: SideNavLinkDestination
) => string = (dest) => {
  switch (dest) {
    case SideNavLinkDestination.Overview:
      return "Overview";
    case SideNavLinkDestination.Endpoints:
      return "Endpoints";
    case SideNavLinkDestination.Tests:
      return "Tests";
    case SideNavLinkDestination.Issues:
      return "Issues";
    default:
      throw Error(`No value mapped for ${dest}`);
  }
};

export const sideNavDestinationToIcon: (
  dest: SideNavLinkDestination
) => IconType = (dest) => {
  switch (dest) {
    case SideNavLinkDestination.Overview:
      return FaHome;
    case SideNavLinkDestination.Endpoints:
      return TiFlowSwitch;
    case SideNavLinkDestination.Tests:
      return HiChartBar;
    case SideNavLinkDestination.Issues:
      return FaFolder;
    default:
      throw Error(`No value mapped for ${dest}`);
  }
};

export const sideNavDestinationToHref: (
  dest: SideNavLinkDestination
) => string = (dest) => {
  switch (dest) {
    case SideNavLinkDestination.Overview:
      return "/";
    case SideNavLinkDestination.Endpoints:
      return "/endpoints";
    case SideNavLinkDestination.Tests:
      return "/tests";
    case SideNavLinkDestination.Issues:
      return "/issues";
    default:
      throw Error(`No value mapped for ${dest}`);
  }
};