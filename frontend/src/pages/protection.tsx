import superjson from "superjson"
import { GetServerSideProps } from "next"
import ProtectionContent from "enterprise/pages/protection"

const Protection = ({ attacksResponse, hosts }) => (
  <ProtectionContent attacksResponse={attacksResponse} hosts={hosts} />
)

export const getServerSideProps: GetServerSideProps = async context => {
  const attacksResponse = {
    validLicense: false,
  }
  return {
    props: {
      attacksResponse: superjson.stringify(attacksResponse),
      hosts: superjson.stringify([]),
    },
  }
}

export default Protection
