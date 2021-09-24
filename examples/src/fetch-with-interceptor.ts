import {createResponseValidator, ValidationResult} from "openapi-runtime-validator";
import openApiSchema from "../schema.json";

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

    // captureSentryException(new Error(msg), fullErrorMessage);

    throw new Error(fullErrorMessage);
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

fetchWithInterceptor("https://jsonplaceholder.typicode.com/users")
  .then(res => res.json())
  .then(data => console.log("data", data))
  .catch(err => console.error(err));