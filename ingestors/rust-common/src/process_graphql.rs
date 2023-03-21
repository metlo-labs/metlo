use crate::{
    process_trace::{insert_data_type, process_json_val},
    sensitive_data::detect_sensitive_data,
    trace::{
        GraphQlData, GraphQlRes, KeyVal, Operation, OperationItem, ProcessTraceResInner, Variable,
    },
};
use graphql_parser::{
    parse_query,
    query::{
        Definition, OperationDefinition, Selection, SelectionSet, TypeCondition, VariableDefinition,
    },
    schema,
};
use libinjection::{sqli, xss};
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};

fn process_graphql_argument<'a>(
    path: String,
    argument_value: &'a schema::Value<&'a str>,
    data_types: &mut HashMap<String, HashSet<String>>,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
    variables_map: &Map<String, Value>,
    total_runs: &mut i32,
) {
    *total_runs += 1;
    if *total_runs > 500 {
        return;
    }
    match &argument_value {
        schema::Value::Variable(v) => {
            if let Some(val) = variables_map.get(&v.to_string()) {
                let mut tmp_path = path.clone();
                process_json_val(
                    &mut tmp_path,
                    data_types,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    total_runs,
                    val,
                    None,
                )
            }
        }
        schema::Value::Boolean(_) => {
            insert_data_type(data_types, path.as_str(), "boolean".to_owned())
        }
        schema::Value::Float(_) => insert_data_type(data_types, path.as_str(), "number".to_owned()),
        schema::Value::Int(_) => insert_data_type(data_types, path.as_str(), "number".to_owned()),
        schema::Value::Null => insert_data_type(data_types, path.as_str(), "null".to_owned()),
        schema::Value::String(s) => {
            insert_data_type(data_types, path.as_str(), "string".to_owned());
            let text = s.as_str();
            if xss(text).unwrap_or(false) {
                xss_detected.insert(path.clone(), s.clone());
            }
            let is_sqli = sqli(text).unwrap_or((false, "".to_owned()));
            if is_sqli.0 {
                sqli_detected.insert(path.clone(), (s.to_owned(), is_sqli.1));
            }
            let sensitive_data = detect_sensitive_data(text);
            if !sensitive_data.is_empty() {
                let old_sensitive_data = sensitive_data_detected.get_mut(&path);
                match old_sensitive_data {
                    None => {
                        sensitive_data_detected.insert(path.clone(), sensitive_data);
                    }
                    Some(old) => old.extend(sensitive_data),
                }
            }
        }
        schema::Value::Enum(e) => {
            let s = &e.to_owned().to_owned();
            insert_data_type(data_types, path.as_str(), "string".to_owned());
            let text = s.as_str();
            if xss(text).unwrap_or(false) {
                xss_detected.insert(path.clone(), s.clone());
            }
            let is_sqli = sqli(text).unwrap_or((false, "".to_owned()));
            if is_sqli.0 {
                sqli_detected.insert(path.clone(), (s.to_owned(), is_sqli.1));
            }
            let sensitive_data = detect_sensitive_data(text);
            if !sensitive_data.is_empty() {
                let old_sensitive_data = sensitive_data_detected.get_mut(&path);
                match old_sensitive_data {
                    None => {
                        sensitive_data_detected.insert(path.clone(), sensitive_data);
                    }
                    Some(old) => old.extend(sensitive_data),
                }
            }
        }
        schema::Value::List(ls) => {
            let limit = std::cmp::min(ls.len(), 15);
            for e in &ls[..limit] {
                process_graphql_argument(
                    path.clone() + ".[]",
                    e,
                    data_types,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    variables_map,
                    total_runs,
                )
            }
        }
        schema::Value::Object(o) => {
            for (k, v) in o.iter() {
                process_graphql_argument(
                    path.clone() + "." + k,
                    v,
                    data_types,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    variables_map,
                    total_runs,
                )
            }
        }
    }
}

fn process_graphql_operation_item<'a>(
    path: &str,
    selections: &'a [Selection<&'a str>],
    items: &mut Vec<OperationItem>,
    variables_map: &Map<String, Value>,
    data_types: &mut HashMap<String, HashSet<String>>,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
    fragments_map: &HashMap<String, &'a SelectionSet<&'a str>>,
    regular_path: String,
    alias_path: String,
    response_alias_map: &mut HashMap<String, String>,
    total_runs: &mut i32,
) {
    let path_len = path.len();
    for field in selections.iter() {
        match field {
            Selection::Field(f) => {
                let alias = f.alias.map(|a| a.to_owned());
                let curr_regular = regular_path.clone() + "." + f.name;
                let curr_alias = alias_path.clone() + "." + f.alias.unwrap_or(f.name);
                let name = f.name.to_owned();
                let curr_path = match path_len > 0 {
                    true => path.to_owned() + "." + f.name,
                    false => f.name.to_owned(),
                };
                let mut arguments: Vec<String> = vec![];
                for arg in f.arguments.iter() {
                    arguments.push(arg.0.to_owned());

                    process_graphql_argument(
                        curr_path.clone() + ".__args." + arg.0,
                        &arg.1,
                        data_types,
                        xss_detected,
                        sqli_detected,
                        sensitive_data_detected,
                        variables_map,
                        total_runs,
                    )
                }
                response_alias_map.insert(curr_alias.clone(), curr_regular.clone());
                let mut operation_items: Vec<OperationItem> = vec![];
                process_graphql_operation_item(
                    &curr_path,
                    &f.selection_set.items,
                    &mut operation_items,
                    variables_map,
                    data_types,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    fragments_map,
                    curr_regular,
                    curr_alias,
                    response_alias_map,
                    total_runs,
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
                        data_types,
                        xss_detected,
                        sqli_detected,
                        sensitive_data_detected,
                        fragments_map,
                        regular_path.clone(),
                        alias_path.clone(),
                        response_alias_map,
                        total_runs,
                    )
                }
            }
            Selection::InlineFragment(i) => {
                let (curr_path, curr_regular_path) = match &i.type_condition {
                    Some(TypeCondition::On(t)) => (
                        format!("{}.__on_{}", path, t),
                        format!("{}.__on_{}", regular_path, t),
                    ),
                    None => (path.to_owned(), regular_path.clone()),
                };
                process_graphql_operation_item(
                    &curr_path,
                    &i.selection_set.items,
                    items,
                    variables_map,
                    data_types,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    fragments_map,
                    curr_regular_path,
                    alias_path.clone(),
                    response_alias_map,
                    total_runs,
                );
            }
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
    data_types: &mut HashMap<String, HashSet<String>>,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
    response_alias_map: &mut HashMap<String, String>,
    total_runs: &mut i32,
    data_section: String,
) -> Operation {
    let variables: Vec<Variable> = match variable_definitions {
        Some(v) => v
            .iter()
            .map(|f| Variable {
                name: f.name.to_owned(),
                var_type: f.var_type.to_string(),
            })
            .collect(),
        None => vec![],
    };
    let mut items: Vec<OperationItem> = vec![];
    process_graphql_operation_item(
        &(data_section + "." + operation_type.as_str()),
        &selection_set.items,
        &mut items,
        variables_map,
        data_types,
        xss_detected,
        sqli_detected,
        sensitive_data_detected,
        fragments_map,
        "resBody.".to_owned() + operation_type.as_str(),
        "resBody.data".to_owned(),
        response_alias_map,
        total_runs,
    );

    Operation {
        operation_name,
        operation_type,
        items,
        variables,
    }
}

fn process_graphql_val<'a>(
    definition: &'a OperationDefinition<&'a str>,
    variables_map: &Map<String, Value>,
    fragments_map: &HashMap<String, &'a SelectionSet<&'a str>>,
    data_types: &mut HashMap<String, HashSet<String>>,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
    response_alias_map: &mut HashMap<String, String>,
    total_runs: &mut i32,
    data_section: String,
) -> Operation {
    match definition {
        OperationDefinition::SelectionSet(s) => process_graphql_operation(
            None,
            "query".to_owned(),
            None,
            s,
            variables_map,
            fragments_map,
            data_types,
            xss_detected,
            sqli_detected,
            sensitive_data_detected,
            response_alias_map,
            total_runs,
            data_section,
        ),
        OperationDefinition::Query(q) => process_graphql_operation(
            q.name.map(|n| n.to_owned()),
            "query".to_owned(),
            Some(&q.variable_definitions),
            &q.selection_set,
            variables_map,
            fragments_map,
            data_types,
            xss_detected,
            sqli_detected,
            sensitive_data_detected,
            response_alias_map,
            total_runs,
            data_section,
        ),
        OperationDefinition::Mutation(m) => process_graphql_operation(
            m.name.map(|n| n.to_owned()),
            "mutation".to_owned(),
            Some(&m.variable_definitions),
            &m.selection_set,
            variables_map,
            fragments_map,
            data_types,
            xss_detected,
            sqli_detected,
            sensitive_data_detected,
            response_alias_map,
            total_runs,
            data_section,
        ),
        OperationDefinition::Subscription(sub) => process_graphql_operation(
            sub.name.map(|n| n.to_owned()),
            "subscription".to_owned(),
            Some(&sub.variable_definitions),
            &sub.selection_set,
            variables_map,
            fragments_map,
            data_types,
            xss_detected,
            sqli_detected,
            sensitive_data_detected,
            response_alias_map,
            total_runs,
            data_section,
        ),
    }
}

fn process_graphql_res(
    query: &str,
    operation_name: Option<String>,
    variables_map: &Map<String, Value>,
    data_section: String,
) -> Option<GraphQlRes> {
    let mut operations: Vec<Operation> = vec![];
    let mut fragments_map: HashMap<String, &SelectionSet<&str>> = HashMap::new();
    let mut operations_def: Vec<&OperationDefinition<&str>> = vec![];
    let mut data_types: HashMap<String, HashSet<String>> = HashMap::new();
    let mut xss_detected: HashMap<String, String> = HashMap::new();
    let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
    let mut sensitive_data_detected: HashMap<String, HashSet<String>> = HashMap::new();
    let mut response_alias_map: HashMap<String, String> = HashMap::new();
    let mut total_runs = 0;

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
                    &mut data_types,
                    &mut xss_detected,
                    &mut sqli_detected,
                    &mut sensitive_data_detected,
                    &mut response_alias_map,
                    &mut total_runs,
                    data_section.clone(),
                ));
            }
        }
        Err(e) => {
            log::debug!("Failed to parse graphql query: {}", e);
            return None;
        }
    }

    Some(GraphQlRes {
        graph_ql_data: vec![GraphQlData {
            operation_name,
            operations,
        }],
        proc_trace_res: ProcessTraceResInner {
            block: !(xss_detected.is_empty() && sqli_detected.is_empty()),
            xss_detected: (!xss_detected.is_empty()).then_some(xss_detected),
            sqli_detected: (!sqli_detected.is_empty()).then_some(sqli_detected),
            sensitive_data_detected: (!sensitive_data_detected.is_empty())
                .then_some(sensitive_data_detected),
            data_types: (!data_types.is_empty()).then_some(data_types),
            validation_errors: None,
        },
        response_alias_map,
    })
}

fn process_graphql_obj(m: &Map<String, Value>) -> Option<GraphQlRes> {
    let query = m.get("query");
    let default_map = Map::new();
    let variables_map: &Map<String, Value> = match m.get("variables") {
        Some(v) => v.as_object().unwrap(),
        None => &default_map,
    };
    let operation_name = match m.get("operationName") {
        Some(Value::String(s)) => Some(s.to_owned()),
        _ => None,
    };
    if let Some(Value::String(q)) = query {
        process_graphql_res(q, operation_name, variables_map, "reqBody".to_owned())
    } else {
        None
    }
}

pub fn process_graphql_body(body: &str) -> Option<GraphQlRes> {
    match serde_json::from_str(body) {
        Ok(Value::Object(m)) => process_graphql_obj(&m),
        Ok(Value::Array(a)) => {
            let mut block = false;
            let mut xss_detected: HashMap<String, String> = HashMap::new();
            let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
            let mut sensitive_data_detected: HashMap<String, HashSet<String>> = HashMap::new();
            let mut data_types: HashMap<String, HashSet<String>> = HashMap::new();
            let mut response_alias_map: HashMap<String, String> = HashMap::new();
            let mut graphql_data: Vec<GraphQlData> = vec![];
            for item in a.iter() {
                if let Value::Object(m) = item {
                    let res = process_graphql_obj(m);
                    if let Some(r) = res {
                        block |= r.proc_trace_res.block;
                        graphql_data.extend(r.graph_ql_data);
                        if let Some(e_xss) = r.proc_trace_res.xss_detected {
                            xss_detected.extend(e_xss);
                        }
                        if let Some(e_sqli) = r.proc_trace_res.sqli_detected {
                            sqli_detected.extend(e_sqli);
                        }
                        if let Some(e_sensitive_data) = r.proc_trace_res.sensitive_data_detected {
                            sensitive_data_detected.extend(e_sensitive_data);
                        }
                        if let Some(e_data_types) = r.proc_trace_res.data_types {
                            data_types.extend(e_data_types);
                        }
                        response_alias_map.extend(r.response_alias_map);
                    }
                }
            }

            Some(GraphQlRes {
                graph_ql_data: graphql_data,
                proc_trace_res: ProcessTraceResInner {
                    block,
                    xss_detected: (!xss_detected.is_empty()).then_some(xss_detected),
                    sqli_detected: (!sqli_detected.is_empty()).then_some(sqli_detected),
                    sensitive_data_detected: (!sensitive_data_detected.is_empty())
                        .then_some(sensitive_data_detected),
                    data_types: (!data_types.is_empty()).then_some(data_types),
                    validation_errors: None,
                },
                response_alias_map,
            })
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
    process_graphql_res(query, operation_name, &variables_map, "reqQuery".to_owned())
}
