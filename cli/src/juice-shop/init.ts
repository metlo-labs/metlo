import axios from "axios"
import chalk from "chalk"
import ora from "ora"

const spinner = ora()

const userLogin = async (url: string, email: string) => {
  const data = {
    email,
    password: "password",
  }
  return await axios.post(`${url}/rest/user/login`, data)
}

const userWhoAmI = async (url: string, authToken: string) => {
  await axios.get(`${url}/rest/user/whoami`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
}

const applicationConfiguration = async (url: string) => {
  await axios.get(`${url}/rest/admin/application-configuration`)
}

const putReviews = async (url: string) => {
  const data = {
    author: "user1@juice.shop",
    message: "some review",
  }
  await axios.put(`${url}/rest/products/1/reviews`, data)
}

const getReviews = async (url: string) => {
  await axios.get(`${url}/rest/products/1/reviews`)
}

const createUser = async (url: string, num: number, userEmail?: string) => {
  const data = {
    email: userEmail || `test-user${num}@juice.shop`,
    password: "password",
    repeatPassword: "password",
  }
  await axios.post(`${url}/api/Users`, data)
  return data.email
}

const changePassword = async (url: string, authToken: string) => {
  const query = {
    new: "password",
    repeat: "password",
  }
  await axios.get(`${url}/rest/user/change-password`, {
    params: { ...query },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
}

const saveLoginIp = async (url: string, authToken: string) => {
  await axios.get(`${url}/rest/saveLoginIp`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
}

const getQuantitys = async (url: string) => {
  await axios.get(`${url}/api/Quantitys`)
}

const postCard = async (url: string, authToken: string) => {
  const data = {
    cardNum: 4111111111111111,
    expMonth: "11",
    expYear: "2093",
    fullName: "Test Credit Card",
  }
  return await axios.post(`${url}/api/Cards`, data, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
}

const getCards = async (url: string, authToken: string) => {
  await axios.get(`${url}/api/Cards`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
}

const getCard = async (url: string, authToken: string, cardId: number) => {
  await axios.get(`${url}/api/Cards/${cardId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
}

export const initUsers = async (url: string) => {
  await createUser(url, -1, "user1@juice.shop")
  await createUser(url, -1, "user2@juice.shop")
}

export const initJuiceShop = async ({ host }) => {
  if (!host) {
    console.log(
      chalk.bold.red("Please provide host url for juice shop server."),
    )
    return
  }
  let url = null
  try {
    const urlObj = new URL(host)
    url = urlObj.href
  } catch (err) {
    console.log(chalk.bold.red(`Host is not a proper url: ${host}`))
    return
  }

  spinner.start(chalk.dim("Initializing Users..."))
  try {
    await initUsers(url)
  } catch (err) {
    spinner.fail(
      chalk.bold.red(`Encountered error while initializing users: ${err}`),
    )
    return
  }
  spinner.succeed(chalk.green("Initialized users."))

  spinner.start(chalk.dim("Populating initial data..."))
  for (let i = 0; i < 50; i++) {
    try {
      const userEmail = await createUser(url, i)
      const authData = (await userLogin(url, userEmail))?.data
      const jwt = authData?.authentication?.token
      const createdCard = (await postCard(url, jwt))?.data
      const cardId = createdCard?.data?.id
      const promises = [
        userWhoAmI(url, jwt),
        applicationConfiguration(url),
        putReviews(url),
        getReviews(url),
        getQuantitys(url),
        getCards(url, jwt),
        getCard(url, jwt, cardId),
        changePassword(url, jwt),
        saveLoginIp(url, jwt),
      ]
      await Promise.allSettled(promises)
    } catch (err) {
      spinner.fail(
        chalk.bold.red(
          `Encountered error while populating initial data: ${err}`,
        ),
      )
      return
    }
  }
  spinner.succeed(chalk.green("Finished populating initial data."))
}
