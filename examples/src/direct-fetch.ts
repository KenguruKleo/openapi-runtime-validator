import {createResponseValidator, ValidationResult} from "openapi-runtime-validator";
import openApiSchema from "../schema.json";

const responseValidator = createResponseValidator({
  openApiSchema
});

fetch("https://jsonplaceholder.typicode.com/users")
  .then(async response => {
    const {validationError} = await responseValidator(response.clone(), "GET");
    if (validationError?.message) {
      const errorMessage = validationError?.message || "";
      console.error(errorMessage);
    }
    return response;
  });