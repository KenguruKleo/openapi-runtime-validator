# openapi-runtime-validator
Runtime validation API responses using OpenAPI schema

#### Impressed by [Openapi-validator](https://www.npmjs.com/package/openapi-validator) (uses to validate Responses in NodeJS or in the unit tests)

## Problem

When we render Typescript type from OpenAPI schema we've got perfect static types validation.
But it does not help us handle inappropriate responses in runtime.

[Openapi-validator](https://www.npmjs.com/package/openapi-validator) does what we need.
But it works only on NodeJS

## Solution

We took [Openapi-validator](https://www.npmjs.com/package/openapi-validator) and excluded all NodeJS dependencies methods.
So now it can work in the browser and use `fetch`

## How to use

To validate responses we have to initialize responseValidator first:

```typescript
import {createResponseValidator, ValidationResult} from "openapi-runtime-validator";
import openApiSchema from "./schema.json";

const responseValidator = createResponseValidator({
  /** object with Open API Schema */
  openApiSchema
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

# responseValidator params

```typescript
import {createResponseValidator, ValidationResult} from "openapi-runtime-validator";
import openApiSchema from "./schema.json";

const responseValidator = createResponseValidator({
  /** object with Open API Schema */
  openApiSchema,
  /**
   * (optional) function to process request url
   * e.g. we can exclude paths to proxy
   * */
  preparePathname,
  /**
   * (optional) skip the validation if the function returns true
   * ATTENTION: @path calculated as a result of `preparePathname`
   * */
  skipValidation,
  /** (optional) callback */
  onValidate,
  /** (optional), by default we use `.json()` to get data from response */
  getResponseData
});
```

#### skipValidation
`skipValidation(): boolean`

We can skip validation for some reasons, e.g. load images or some API without OpenAPI Schema:
```
// we will skip validation if path started from `/image-url/`
const skipValidation = (path: string): boolean => {
    return return path.match(new RegExp("^/image-url/")) !== null;
}
```

Default value: false

#### getResponseData
`getResponseData(response: Response): any`

Should return object what will validate by Schema.

It can be `response.text()` or direct read the body.

By default, we use `response.json()`.

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

[Try it on CodeSandbox](https://codesandbox.io/s/typescript-playground-export-forked-m6wtv?file=/src/index.ts)

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
      CODE: ${validationError.code},
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

[examples/fetch-with-interceptor.ts](examples/src/fetch-with-interceptor.ts)

[Try it on CodeSandbox](https://codesandbox.io/s/romantic-brattain-sgj8k?file=/src/index.ts)

### TODO:

- Add unit tests
- Cleanup code (simplify and rid of inheritance)
- try to use information from the Schema to run appropriate function to get data from the Response: .json(), .text(), etc.

### Changelog:
- 1.1.0 `getResponseData` delegate function
- 1.2.0 `skipValidation` functionality

