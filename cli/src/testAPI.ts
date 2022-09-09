import axios from "axios"
import { getConfig } from "./utils"

import { Test, runTest } from "@akshays/testing"

interface testAPIArgs {
  host: string
  target: string
}

const getTests = async (args: testAPIArgs): Promise<Test[]> => {
  const config = getConfig()
  const testResponse = await axios.get<Test[]>(
    `${config.metloHost}/api/v1/test/list?hostname=${args.host}`,
  )
  return testResponse.data
}

const testAPI = async (args: testAPIArgs) => {
  try {
    const tests = await getTests(args)
    const outputs = await Promise.all(tests.map(runTest))
    console.log(outputs)
  } catch (e) {
    console.error(e.message)
    return
  }
}

export default testAPI
