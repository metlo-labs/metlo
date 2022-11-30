import { GetServerSideProps } from "next"
import superjson from "superjson"
import { getInstanceSettings, getSummary } from "api/home"
import { Summary, InstanceSettings } from "@common/types"
import Error from "next/error"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import HomePage from "components/Home"
import { HomeOnboardingView } from "components/Onboarding/HomeOnboardingView"
import { HomeUpdateEmailView } from "components/Home/HomeUpdateEmailView"

const Index = ({ summary, instanceSettings }) => {
  const parsedSummary = superjson.parse<Summary>(summary)
  const parsedInstanceSettings =
    superjson.parse<InstanceSettings>(instanceSettings)
  if (!parsedSummary) {
    return <Error statusCode={500} />
  }
  if (!parsedInstanceSettings) {
    return <Error statusCode={500} />
  }

  if (
    !parsedInstanceSettings.skippedUpdateEmail &&
    !parsedInstanceSettings.updateEmail
  ) {
    return <HomeUpdateEmailView />
  }

  let page = (
    <ContentContainer maxContentW="100rem" px="8" py="8">
      <HomePage summary={parsedSummary} />
    </ContentContainer>
  )
  if (parsedSummary.numConnections === 0 && parsedSummary.hostCount === 0) {
    page = (
      <ContentContainer maxContentW="100rem" height="100vh">
        <HomeOnboardingView />
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
  const instanceSettings = await getInstanceSettings()
  return {
    props: {
      summary: superjson.stringify(summary),
      instanceSettings: superjson.stringify(instanceSettings),
    },
  }
}

export default Index
