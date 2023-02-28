use crate::{
    sensitive_data::detect_sensitive_data,
    trace::{GraphQlRes, KeyVal, Operation, OperationItem},
};
use graphql_parser::{
    parse_query,
    query::{Definition, OperationDefinition, Selection, SelectionSet, VariableDefinition},
    schema,
};
use libinjection::{sqli, xss};
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};

fn process_graphql_argument_variable(
    argument_name: &str,
    v: &Value,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
) {
    match v {
        serde_json::Value::String(e) => {
            let argument_name_string = argument_name.to_owned();
            if xss(e).unwrap_or(false) {
                xss_detected.insert(argument_name_string.clone(), e.to_owned());
            }

            let is_sqli = sqli(e).unwrap_or((false, "".to_owned()));
            if is_sqli.0 {
                sqli_detected.insert(argument_name_string.clone(), (e.to_owned(), is_sqli.1));
            }

            let sensitive_data = detect_sensitive_data(e.as_str());
            if !sensitive_data.is_empty() {
                let old_sensitive_data = sensitive_data_detected.get_mut(argument_name);
                match old_sensitive_data {
                    None => {
                        sensitive_data_detected.insert(argument_name_string, sensitive_data);
                    }
                    Some(old) => {
                        for e in sensitive_data {
                            old.insert(e);
                        }
                    }
                }
            }
        }
        serde_json::Value::Array(ls) => {
            for e in ls {
                process_graphql_argument_variable(
                    argument_name,
                    e,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                )
            }
        }
        serde_json::Value::Object(m) => {
            for (_k, nested_val) in m.iter() {
                process_graphql_argument_variable(
                    argument_name,
                    nested_val,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                );
            }
        }
        _ => (),
    }
}

fn process_graphql_argument<'a>(
    argument_name: &str,
    argument_value: &'a schema::Value<&'a str>,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
    variables_map: &Map<String, Value>,
) {
    match &argument_value {
        schema::Value::Variable(v) => {
            if let Some(val) = variables_map.get(&v.to_string()) {
                process_graphql_argument_variable(
                    argument_name,
                    val,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                )
            }
        }
        schema::Value::String(s) => {
            let text = s.as_str();
            let argument_name_string = argument_name.to_owned();
            if xss(text).unwrap_or(false) {
                xss_detected.insert(argument_name_string.clone(), s.clone());
            }
            let is_sqli = sqli(text).unwrap_or((false, "".to_owned()));
            if is_sqli.0 {
                sqli_detected.insert(argument_name_string.clone(), (s.to_owned(), is_sqli.1));
            }
            let sensitive_data = detect_sensitive_data(text);
            if !sensitive_data.is_empty() {
                let old_sensitive_data = sensitive_data_detected.get_mut(argument_name);
                match old_sensitive_data {
                    None => {
                        sensitive_data_detected.insert(argument_name_string, sensitive_data);
                    }
                    Some(old) => old.extend(sensitive_data),
                }
            }
        }
        schema::Value::Enum(_) => (),
        schema::Value::List(ls) => {
            for e in ls {
                process_graphql_argument(
                    argument_name,
                    e,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    variables_map,
                )
            }
        }
        schema::Value::Object(o) => {
            for (_k, v) in o.iter() {
                process_graphql_argument(
                    argument_name,
                    v,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    variables_map,
                )
            }
        }
        _ => (),
    }
}

fn process_graphql_operation_item<'a>(
    path: &str,
    selections: &'a [Selection<&'a str>],
    items: &mut Vec<OperationItem>,
    variables_map: &Map<String, Value>,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
    fragments_map: &HashMap<String, &'a SelectionSet<&'a str>>,
) {
    let path_len = path.len();
    for field in selections.iter() {
        match field {
            Selection::Field(f) => {
                let alias = f.alias.map(|a| a.to_owned());
                let name = f.name.to_owned();
                let curr_path = match path_len > 0 {
                    true => path.to_owned() + "." + f.name,
                    false => f.name.to_owned(),
                };
                let mut arguments: Vec<String> = vec![];
                for arg in f.arguments.iter() {
                    arguments.push(arg.0.to_owned());

                    process_graphql_argument(
                        (curr_path.clone() + "." + arg.0).as_str(),
                        &arg.1,
                        xss_detected,
                        sqli_detected,
                        sensitive_data_detected,
                        variables_map,
                    )
                }
                let mut operation_items: Vec<OperationItem> = vec![];
                process_graphql_operation_item(
                    &curr_path,
                    &f.selection_set.items,
                    &mut operation_items,
                    variables_map,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    fragments_map,
                );
                items.push(OperationItem {
                    name: Some(name),
                    alias,
                    arguments,
                    items: operation_items,
                })
            }
            Selection::FragmentSpread(f) => {
                if let Some(selection_set) = fragments_map.get(f.fragment_name) {
                    process_graphql_operation_item(
                        path,
                        &selection_set.items,
                        items,
                        variables_map,
                        xss_detected,
                        sqli_detected,
                        sensitive_data_detected,
                        fragments_map,
                    )
                }
            }
            Selection::InlineFragment(i) => process_graphql_operation_item(
                path,
                &i.selection_set.items,
                items,
                variables_map,
                xss_detected,
                sqli_detected,
                sensitive_data_detected,
                fragments_map,
            ),
        }
    }
}

fn process_graphql_operation<'a>(
    operation_name: Option<String>,
    operation_type: String,
    variable_definitions: Option<&'a Vec<VariableDefinition<&'a str>>>,
    selection_set: &'a SelectionSet<&'a str>,
    variables_map: &Map<String, Value>,
    fragments_map: &HashMap<String, &'a SelectionSet<&'a str>>,
) -> Operation {
    let variables: Vec<String> = match variable_definitions {
        Some(v) => v.iter().map(|f| f.name.to_owned()).collect(),
        None => vec![],
    };
    let mut items: Vec<OperationItem> = vec![];
    let mut xss_detected: HashMap<String, String> = HashMap::new();
    let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
    let mut sensitive_data_detected: HashMap<String, HashSet<String>> = HashMap::new();
    process_graphql_operation_item(
        "",
        &selection_set.items,
        &mut items,
        variables_map,
        &mut xss_detected,
        &mut sqli_detected,
        &mut sensitive_data_detected,
        fragments_map,
    );

    Operation {
        operation_name,
        operation_type,
        items,
        variables,
        xss_detected,
        sqli_detected,
        sensitive_data_detected,
    }
}

fn process_graphql_val<'a>(
    definition: &'a OperationDefinition<&'a str>,
    variables_map: &Map<String, Value>,
    fragments_map: &HashMap<String, &'a SelectionSet<&'a str>>,
) -> Operation {
    match definition {
        OperationDefinition::SelectionSet(s) => process_graphql_operation(
            None,
            "query".to_owned(),
            None,
            s,
            variables_map,
            fragments_map,
        ),
        OperationDefinition::Query(q) => process_graphql_operation(
            q.name.map(|n| n.to_owned()),
            "query".to_owned(),
            Some(&q.variable_definitions),
            &q.selection_set,
            variables_map,
            fragments_map,
        ),
        OperationDefinition::Mutation(m) => process_graphql_operation(
            m.name.map(|n| n.to_owned()),
            "mutation".to_owned(),
            Some(&m.variable_definitions),
            &m.selection_set,
            variables_map,
            fragments_map,
        ),
        OperationDefinition::Subscription(sub) => process_graphql_operation(
            sub.name.map(|n| n.to_owned()),
            "subscription".to_owned(),
            Some(&sub.variable_definitions),
            &sub.selection_set,
            variables_map,
            fragments_map,
        ),
    }
}

fn process_graphql_res(
    query: &str,
    operation_name: Option<String>,
    variables_map: &Map<String, Value>,
) -> Option<GraphQlRes> {
    let mut operations: Vec<Operation> = vec![];
    let mut fragments_map: HashMap<String, &SelectionSet<&str>> = HashMap::new();
    let mut operations_def: Vec<&OperationDefinition<&str>> = vec![];

    match parse_query::<&str>(query) {
        Ok(ast) => {
            let ast_definitions = ast.definitions.iter();
            for def in ast_definitions {
                match def {
                    Definition::Operation(op_def) => {
                        operations_def.push(op_def);
                    }
                    Definition::Fragment(fragment_def) => {
                        fragments_map
                            .insert(fragment_def.name.to_owned(), &fragment_def.selection_set);
                    }
                }
            }
            for operation in operations_def {
                operations.push(process_graphql_val(
                    operation,
                    variables_map,
                    &fragments_map,
                ));
            }
        }
        Err(e) => {
            log::debug!("Failed to parse graphql query: {}", e);
            return None;
        }
    }

    Some(GraphQlRes {
        operation_name,
        operations,
    })
}

pub fn process_graphql_body(body: &str) -> Option<GraphQlRes> {
    match serde_json::from_str(body) {
        Ok(Value::Object(m)) => {
            let query = m.get("query");
            let default_map = serde_json::Value::default();
            let variables_map: &Map<String, Value> = m
                .get("variables")
                .unwrap_or(&default_map)
                .as_object()
                .unwrap();
            let operation_name = match m.get("operationName") {
                Some(Value::String(s)) => Some(s.to_owned()),
                _ => None,
            };
            if let Some(Value::String(q)) = query {
                process_graphql_res(q, operation_name, variables_map)
            } else {
                None
            }
        }
        Err(_) => {
            log::debug!("Invalid JSON");
            None
        }
        _ => {
            log::debug!("Invalid graphql payload");
            None
        }
    }
}

pub fn process_graphql_query(query_params: &Vec<KeyVal>) -> Option<GraphQlRes> {
    let mut query = "";
    let mut operation_name = None;
    let variables_map = Map::new();

    for item in query_params {
        if item.name == "query" {
            query = item.value.as_str();
        } else if item.name == "operationName" {
            operation_name = Some(item.value.clone())
        }
    }
    process_graphql_res(query, operation_name, &variables_map)
}
