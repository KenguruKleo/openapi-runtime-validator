# openapi-runtime-validator
Runtime validation API responses using OpenAPI schema

#### Impressed by [openapi-validator](https://www.npmjs.com/package/openapi-validator) (uses to validate Responses in NodeJS or in the unit tests)
#### Use [openapi-response-validator](https://www.npmjs.com/package/openapi-response-validator) to validate Response
#### Use [openapi-schema-validator](https://www.npmjs.com/package/openapi-schema-validator) to check schema before use it

## Problem



## Solution

## How to use

To validate responses we have to initialize responseValidator first:

```typescript
import {createResponseValidator, ValidationResult} from "openapi-runtime-validator";
import openApiSchema from "./schema.json";

const responseValidator = createResponseValidator({
  openApiSchema,
  preparePathname, //optional function to process request url
  onValidate //optional callback
});
```

Then we can use it directly with the `fetch`:

```typescript
fetch("https://swapi.dev/api/people/").then(async response => {
  const method = "GET";

  const {validationError} = await responseValidator(response.clone(), method);
  if (validationError?.message) {
    const errorMessage = validationError?.message || "";
    console.error(errorMessage);
  }

  return response;
});
```

# Examples

## Convert YAML to JSON

We can use next command to convert `yaml` to `json`.
We need package https://www.npmjs.com/package/js-yaml

```shell
npx js-yaml ./examples/openapi.yaml > ./examples/openapi.json
```

Or we can run inside `examples` folder next script `node convertYamlToJSON.js`

## Direct validate `fetch` response

Just keep in mind fetch Response does not have information about request method `GET, POST, etc.`
but we need it to get expected result schema, so we must include request method to the validation.

[examples/direct-fetch.ts](examples/src/direct-fetch.ts)

[Try it on Sandbox](https://codesandbox.io/s/typescript-playground-export-forked-m6wtv?file=/src/index.ts)

## Use interceptor

If we use some library to manage our API requests we should follow the instruction how to create interceptor.

In case we use direct window.fetch - we can replace it wit our implementation e.g.:

```typescript
const fetchWithInterceptor = (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  let method = "GET";

  if (typeof input === "string" && init?.method) {
    method = init.method;
  } else if (typeof input !== "string" && input?.method) {
    method = input.method;
  }

  return fetch(input, init).then(async response => {
    if (method) {
      await responseValidator(response.clone(), method);
    }
    return response;
  });
};
```

responseValidator example implementation:

```typescript
const preparePathname = (path: string): string => {
  // exclude internal Proxy paths
  return path
    .replace("/api/", "/");
};

const onValidate = ({response, validationError, method, path}: ValidationResult) => {
  if (validationError?.message) {
    const errorMessage = validationError?.message || "";
    const fullErrorMessage = `[BE] response error in schema
      METHOD: ${method},
      URL: ${response.url}
      STATUS: ${response.status}
      operationId: ${validationError?.operationId}
      
      VALIDATION ERROR: ${errorMessage}
    `;

    const msg = `[BE] schema validation error: <${validationError.code}> ${method}: ${
      validationError?.operationId || path
    }`;

    // captureSentryException(new Error(msg), fullErrorMessage);
    
    // throw new Error(msg);
    
    // console.error(fullErrorMessage);
  }

  switch (path) {
    case "/some/path": {
      if (response.status === 204) {
        // redirect somewere, etc.;
      }
      break;
    }
    default:
      break;
  }
};

const responseValidator = createResponseValidator({
  openApiSchema,
  preparePathname,
  onValidate
});
```



