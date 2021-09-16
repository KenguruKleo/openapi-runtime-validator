import {createResponseValidator, ValidationResult} from "openapi-runtime-validator";
import openApiSchema from "../schema.json";

const responseValidator = createResponseValidator({
  openApiSchema
});

fetch("https://swapi.dev/api/people/").then(async response => {
  const method = "GET";

  const {validationError} = await responseValidator(response.clone(), method);
  if (validationError?.message) {
    const errorMessage = validationError?.message || "";
    console.error(errorMessage);
  }

  return response;
});