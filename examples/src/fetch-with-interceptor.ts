import {createResponseValidator, ValidationResult} from "openapi-runtime-validator";
import openApiSchema from "../schema.json";

// Optional
const preparePathname = (path: string): string => {
  // exclude internal Proxy paths
  return path
    .replace("/api/", "/");
};

// Optional
// we will skip validation if path started from `/image-url/`
const skipValidation = (path: string): boolean => {
  return path.match(new RegExp("^/image-url/")) !== null;
}

// Callback will be called after each request
// if response does not match OpenAPI schema `validationError` will have error
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

    // captureSentryException(new Error(msg), fullErrorMessage);

    throw new Error(fullErrorMessage);
  }

  switch (path) {
    case "/some/path": {
      if (response.status === 204) {
        // redirect somewhere, etc.;
      }
      break;
    }
    default:
      break;
  }
};

// Create responseValidator
const responseValidator = createResponseValidator({
  openApiSchema,
  preparePathname,
  skipValidation,
  onValidate
});

// Wrap window.fetch with response validator
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

// Example usage
fetchWithInterceptor("https://jsonplaceholder.typicode.com/users")
  .then(res => res.json())
  .then(data => console.log("data", data))
  .catch(err => console.error(err));