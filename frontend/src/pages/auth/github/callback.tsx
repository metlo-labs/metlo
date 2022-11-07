import axios from "axios"
import { GetServerSideProps } from "next"
import { getAPIBaseURL } from "~/constants"

const GithubCallbackPage = ({}) => {
  return <>On gh callback page</>
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  console.log(query)
  let resp = await axios.get(
    `${getAPIBaseURL()}/auth/github/callback?code=${query.code}`,
    { withCredentials: true },
  )
  console.log(resp)
  console.log(query)
  return {
    redirect: {
      permanent: false,
      destination: "/",
    },
  }
}

export default GithubCallbackPage
