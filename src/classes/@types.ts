import {OpenAPIV2, OpenAPIV3} from "openapi-types";
import ValidationError from "./ValidationError";

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
