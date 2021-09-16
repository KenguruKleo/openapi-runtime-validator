# openapi-runtime-validator
Runtime validation API responses using OpenAPI schema

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

### Convert YAML to JSON

We can use next command to convert `yaml` to `json`.
We need package https://www.npmjs.com/package/js-yaml

```shell
npx js-yaml ./examples/openapi.yaml > ./examples/openapi.json
```

Or we can run inside `examples` folder next script `node convertYamlToJSON.js`

### Direct validate `fetch` response

[examples/direct-fetch.ts](examples/src/direct-fetch.ts)




