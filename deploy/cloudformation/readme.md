# How to deploy to cloudformation

- Create a template on cloudformation designer
- Export said template to any accessible storage (S3/github/gcp)
- Either:
  - Go to cloudformation page and manually feed in data. Or,
  - Create url that manually fills in parts of the data that are to be provided by metlo

So, for example, if our template is stored at https://www.example.com/path/to/file, we could make a url like this :

```
https://{AWS_REGION}.console.aws.amazon.com/cloudformation/home?region={AWS_REGION}#/stacks/create/review
    ?templateURL={PATH_TO_TEMPLATE}
    &stackName={STACK_NAME}
    &param_licenseKey={LICENSE_KEY}
```

or when used as a url: `https://{AWS_REGION}.console.aws.amazon.com/cloudformation/home?region={AWS_REGION}#/stacks/create/review?templateURL={PATH_TO_TEMPLATE}&stackName={STACK_NAME}&param_licenseKey={LICENSE_KEY}`

so it would look something like this: https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/create/review?templateURL=https://www.example.com/path/to/file&stackName=METLO_STACK&param_licenseKey=abcd


**NOTE**: Template URL must be a S3 link. 

Two files have been provided in this subdirectory, one for ingestors, one for managers

## Current URLs:

 - Metlo Manager: https://cf-templates-7639qxxr319s-us-west-1.s3.us-west-1.amazonaws.com/metlo-manager.template
 - Metlo Ingestor: https://cf-templates-7639qxxr319s-us-west-1.s3.us-west-1.amazonaws.com/metlo-ingestor.template

## Current URL designs:
 - Metlo Manager: https://{AWS_REGION}.console.aws.amazon.com/cloudformation/home?region={AWS_REGION}#/stacks/create/review?templateURL={PATH_TO_TEMPLATE}&stackName={STACK_NAME}&param_licenseKey={LICENSE_KEY}
 - Metlo Ingestor: https://{AWS_REGION}.console.aws.amazon.com/cloudformation/home?region={AWS_REGION}#/stacks/create/review?templateURL={PATH_TO_TEMPLATE}&stackName={STACK_NAME}&param_metloAddress={METLO_COLLECTOR_ADDR}&param_metloKey={METLO_KEY}
    - METLO_COLLECTOR_ADDR must come with the correct port, but not the endpoint. It will default to the endpoint `/api/v1/log-request/single`, so either `https://www.example.com` or `https://www.example.com:8081` are acceptable.    