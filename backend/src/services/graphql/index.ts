import { ArgumentNode, Kind, parse, VariableDefinitionNode } from "graphql"
import { parsedJson } from "utils"


const getArgumentType = (variableDefinitions: readonly VariableDefinitionNode[], argument: ArgumentNode) => {
  if (argument.value.kind === Kind.VARIABLE) {
    variableDefinitions.forEach(e => {
      if (e.variable?.name?.value === argument.name?.value) {
        let type = e.type
        while (type.kind !== Kind.NAMED_TYPE) {
          type = type.type
        }
        console.log(type.name?.value)
        return type.name?.value ?? "unknown"
      }
    })
  }
  return "unknown"
}

const findGraphqlFields = (resolverName: string, responseBody: object) => {}

export const getGraphQlPaths = () => {
  return ["/graphql"]
}

export const isGraphQlEndpoint = (path: string) => {
  if (getGraphQlPaths().includes(path)) {
    return true
  }
}

export const getGraphQlData = (requestBody: string, responseBody: string) => {
  const res = {}
  /*let res = {
    operationType: null,
    operationName: null,
    arguments: null,
    fields: null,
  }*/
  const parsedRequestBody = typeof requestBody === "object" ? requestBody : parsedJson(requestBody)
  if (!parsedRequestBody) {
    return res
  }
  /*if (typeof parsedRequestBody.operationName === "string") {
    res.operationName = parsedRequestBody.operationName
  }*/
  const parsedQuery = parse(parsedRequestBody.query)
  if (parsedQuery.definitions) {
    const parsedResponseBody = typeof responseBody === "object" ? responseBody : parsedJson(responseBody)
    for (const definition of parsedQuery.definitions) {
      if (definition.kind === Kind.OPERATION_DEFINITION) {
        const operationType = definition.operation
        const selections = definition.selectionSet?.selections ?? []
        const variableDefinitions = definition.variableDefinitions ?? []
        for (const selection of selections) {
          if (selection.kind === Kind.FIELD) {
            const key = operationType + selection.name.value
            const selectionArguments = selection.arguments ?? []
            res[key] = {
              operationType: operationType,
              resolverName: selection.name.value,
              arguments: {},
              fields: {},
            }
            for (const argument of selectionArguments) {
              const currSelection = res[key]
              const argName = argument.name.value
              const argType = getArgumentType(variableDefinitions, argument)
              currSelection.arguments[argName] = argType
            }
            /*if (parsedResponseBody && parsedResponseBody.data) {
              for (const key in parsedResponseBody.data) {
                DataFieldService.findBodyDataFields(
                  DataSection.RESPONSE_BODY,
                  parsedRequestBody.data[key],
                  apiEndpoint
                )
              }
            }*/
          }
        }
      }
    }
  }
  console.log(res)
}