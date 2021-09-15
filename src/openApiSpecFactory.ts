import OpenAPISchemaValidator from "openapi-schema-validator";

import {stringify} from "./utils/common.utils";
import OpenApi3Spec from "./classes/OpenApi3Spec";

export default function makeApiSpec(spec: any, preparePathname: (path: string) => string) {
  validateSpec(spec);

  return new OpenApi3Spec(spec, preparePathname);
}

function validateSpec(spec: any) {
  try {
    const validator = new OpenAPISchemaValidator({
      version: getOpenApiVersion(spec)
    });
    const {errors} = validator.validate(spec);

    if (errors.length > 0) {
      throw new Error(stringify(errors));
    }
  } catch (error) {
    // @ts-ignore
    throw new Error(`Invalid OpenAPI spec: ${error?.message}`);
  }
}

function getOpenApiVersion(openApiSpec: any) {
  return (
    openApiSpec.swagger || // '2.0'
    openApiSpec.openapi // '3.X.X'
  );
}
