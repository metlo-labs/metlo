import superjson from "superjson"
import { GetServerSideProps } from "next"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import { getAttacks } from "api/attacks"
import { ProtectionEmptyView } from "components/Protection/ProtectionEmptyView"

const Protection = ({ validLicense, attacks }) => {
  const parsedAttacks = superjson.parse<any>(attacks)
  let page = (
    <ContentContainer maxContentW="100rem" px="8" py="8"></ContentContainer>
  )
  if (!validLicense) {
    page = (
      <ContentContainer maxContentW="full" px="0" py="0">
        <ProtectionEmptyView />
      </ContentContainer>
    )
  }
  return (
    <SidebarLayoutShell
      title="Protection"
      currentTab={SideNavLinkDestination.Protection}
    >
      {page}
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { attacks, validLicense } = await getAttacks({})
  return {
    props: {
      validLicense,
      attacks: superjson.stringify(attacks),
    },
  }
}

export default Protection
