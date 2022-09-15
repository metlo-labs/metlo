import { GetServerSideProps } from "next"
import superjson from "superjson"
import { getSummary } from "api/home"
import { Summary } from "@common/types"
import Error from "next/error"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import HomePage from "components/Home"
import { HomeEmptyView } from "components/Home/HomeEmptyView"

const Index = ({ summary }) => {
  const parsedSummary = superjson.parse<Summary>(summary)
  if (!parsedSummary) {
    return <Error statusCode={500} />
  }
  let page = (
    <ContentContainer maxContentW="100rem" px="8" py="8">
      <HomePage summary={parsedSummary} />
    </ContentContainer>
  )
  if (parsedSummary.numConnections === 0) {
    page = (
      <ContentContainer maxContentW="100rem" px="0" py="0">
        <HomeEmptyView />
      </ContentContainer>
    )
  }
  return (
    <SidebarLayoutShell title="Home" currentTab={SideNavLinkDestination.Home}>
      {page}
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const summary = await getSummary()
  return {
    props: {
      summary: superjson.stringify(summary),
    },
  }
}

export default Index
