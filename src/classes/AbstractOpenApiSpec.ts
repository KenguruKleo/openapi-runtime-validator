import OpenAPIResponseValidator, {OpenAPIResponseValidatorArgs} from "openapi-response-validator";

import {getPathname} from "../utils/common.utils";

import ValidationError from "./ValidationError";
import {IPathOperation, IPathOperationItem, IPathSpec, IResponse, IResponseObject, ISpec} from "./@types";
import {OpenAPIV2} from "openapi-types";

export default abstract class OpenApiSpec {
  protected spec: ISpec;

  protected abstract findResponseDefinition(referenceString: string): IResponseObject | undefined;

  protected abstract findOpenApiPathMatchingPathname(pathname: string): string;

  protected abstract getComponentDefinitionsProperty(): object;

  protected constructor(spec: ISpec) {
    this.spec = spec;
  }

  /**
   * @see OpenAPI2 {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#path-item-object}
   * @see OpenAPI3 {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#pathItemObject}
   */
  pathsObject(): IPathSpec {
    return this.spec.paths;
  }

  getPathItem(openApiPath: string) {
    return this.pathsObject()[openApiPath];
  }

  paths(): string[] {
    return Object.keys(this.pathsObject());
  }

  /**
   * @returns {ResponseObject} ResponseObject
   * @see OpenAPI2 {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#response-object}
   * @see OpenAPI3 {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#responseObject}
   */
  findExpectedResponse(actualResponse: IResponse): {expectedResponse: OpenAPIResponseValidatorArgs["responses"], expectedOperation: IPathOperationItem} {
    const expectedResponseOperation = this.findExpectedResponseOperation(actualResponse);

    if (!expectedResponseOperation) {
      throw new ValidationError("METHOD_NOT_FOUND", "Method not found", "");
    }

    const {status} = actualResponse;
    let expectedResponse = expectedResponseOperation.responses[status];

    if (expectedResponse) {
      if ((<OpenAPIV2.Schema>expectedResponse.schema)?.$ref) {
        const specV2 = (<OpenAPIV2.Schema>expectedResponse.schema).$ref;
        const found = specV2 ? this.findResponseDefinition(specV2) : undefined;
        if (found) {
          expectedResponse = found;
        }
      }
    }

    if (!expectedResponse) {
      throw new ValidationError("STATUS_NOT_FOUND");
    }

    return {expectedResponse: {[status]: expectedResponse}, expectedOperation: expectedResponseOperation};
  }

  findOpenApiPathMatchingRequest(actualResponse: IResponse) {
    const actualPathname = getPathname(actualResponse);

    return this.findOpenApiPathMatchingPathname(actualPathname);
  }

  /**
   * @returns {PathItemObject} PathItemObject
   * @see OpenAPI2 {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#path-item-object}
   * @see OpenAPI3 {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#pathItemObject}
   */
  findExpectedPathItem(actualResponse: IResponse): IPathOperation {
    const actualPathname = getPathname(actualResponse);
    const openApiPath = this.findOpenApiPathMatchingPathname(actualPathname);

    return this.getPathItem(openApiPath);
  }

  /**
   * @see OpenAPI2 {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#operation-object}
   * @see OpenAPI3 {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject}
   */
  findExpectedResponseOperation(actualRequest: IResponse): IPathOperationItem {
    const pathItemObject = this.findExpectedPathItem(actualRequest);

    return pathItemObject[actualRequest.method.toLowerCase()];
  }

  validateResponse(actualResponse: IResponse, data?: Object) {
    let expectedResponse;
    let expectedOperation;
    try {
      const found = this.findExpectedResponse(actualResponse);
      expectedResponse = found.expectedResponse;
      expectedOperation = found.expectedOperation;
    } catch (error) {
      if (error instanceof ValidationError) {
        return error;
      }
      throw error;
    }
    const resValidator = new OpenAPIResponseValidator({
      responses: expectedResponse,
      ...this.getComponentDefinitionsProperty()
    });

    const [expectedResStatus] = Object.keys(expectedResponse);
    const validationError = resValidator.validateResponse(expectedResStatus, data);

    if (validationError) {
      return new ValidationError(
        "INVALID_BODY",
          // @ts-ignore
          validationError.errors.map(({path, message}) => `${path} ${message}`).join(", "),
        expectedOperation.operationId
      );
    }
    return null;
  }

  /*
   * For consistency and to save maintaining another dependency,
   * we validate objects using our response validator:
   * We put the object inside a mock response, then validate
   * the whole response against a mock expected response.
   * The 2 mock responses are identical except for the body,
   * thus validating the object against its schema.
   */
  validateObject(actualObject: any, schema: any) {
    const mockResStatus = 200;
    const mockExpectedResponse = {[mockResStatus]: {schema}};
    const resValidator = new OpenAPIResponseValidator({
      responses: mockExpectedResponse,
      ...this.getComponentDefinitionsProperty(),
      errorTransformer: ({path, message}) => ({

        message: `${path?.replace("response", "object")} ${message}`
      })
    });
    const validationError = resValidator.validateResponse(mockResStatus, actualObject);

    if (validationError) {
      return new ValidationError("INVALID_OBJECT", validationError.errors.map((error: { message: any; }) => error.message).join(", "));
    }
    return null;
  }
}
