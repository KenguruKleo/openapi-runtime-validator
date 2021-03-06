import {OpenAPIV2, OpenAPIV3} from "openapi-types";
import ValidationError from "./classes/ValidationError";

export type IResponse = Response & {
  method: string;
};

export type IResponseObject = {
  schema: OpenAPIV2.Schema | OpenAPIV3.SchemaObject;
}
export type IPathOperationItem = {
  operationId?: string;
  responses: {
    [responseCode: string]: IResponseObject
  };
}
export type IPathOperation = {
  [method: string]: IPathOperationItem
}
export type IPathSpec = {
  [path: string]: IPathOperation
}
export type ISpec = {
  servers: string | any[];
  paths: IPathSpec;
  components?: {
    responses?: {
      [responseCode: string]: IResponseObject
    };
  };
}

export type ValidationResult = {
  response: Response,
  validationError: ValidationError | null,
  status: number,
  method: string,
  path: string
};

export type ValidationErrorCode = "INVALID_OBJECT" | "INVALID_BODY" | "STATUS_NOT_FOUND" | "METHOD_NOT_FOUND" | "SERVER_NOT_FOUND" | "PATH_NOT_FOUND";

export interface ResponseValidatorParams {
  /** object with Open API Schema */
  openApiSchema: any;
  /**
   * optional function to process request url
   * e.g. we can exclude paths to proxy
   * */
  preparePathname?: (path: string) => string;
  /**
   * (optional) skip the validation if the function returns true
   * ATTENTION: @path calculated as a result of `preparePathname`
   * */
  skipValidation?: (path: string) => boolean;
  /** optional callback */
  onValidate?: (result: ValidationResult) => void;
  /** by default we use `.json()` to get data from response */
  getResponseData?: (response: Response) => Promise<any>;
}
