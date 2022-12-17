import fs from "node:fs";
import yaml from "yaml"
import axios, { AxiosRequestConfig } from "axios";
import { faker } from "@faker-js/faker"

/**
 * Example testing yaml template
 * 
 * 
id: Basic fuzzing

info:
  name: Name
  author: AHP
  tags: fuzz,adminer,login

requests:
  method: POST
  baseUrl: https://www.example.com
  endpoints:
    - /
    - /yoyo/1234
    - /user/%param

auth:
  type: Bearer
  location: Header
  value: metlo.xyz

test_type: auth

success:
  status:
    - 200

 */


export async function testAPI({ file }) {
    console.log(file)
    const yaml_file = yaml.parse(fs.readFileSync(file).toString())
    console.log(yaml_file)
    // TODO : Pass auth details
    for (const config of constructRequest(yaml_file.requests.method, yaml_file.requests.baseUrl, yaml_file.requests.endpoints)) {
        await axios(config).then((res) => {
            // TODO : take success from yaml
            if (res.status == 200)
                console.log(`Success for ${config.url}`)
            else
                console.log(`Fail for ${config.url}`)
        }).catch((err) => {
            console.log(`Failure for ${config.url}`)
        })
    }
}

function constructRequest(method: string, baseURL: string, endpoints: string[],) {
    const configs = []
    for (let endpoint of endpoints) {
        let headers = {}
        configs.push({
            url: endpoint.replace("%param", faker.internet.userName()),
            method,
            baseURL,
            headers: {}
        } as AxiosRequestConfig)
    }
    return configs
}