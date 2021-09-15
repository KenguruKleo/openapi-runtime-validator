import {makeApiSpec} from "./index";
import {getPathname} from "./utils/common.utils";
import {ValidationResult} from "./classes/@types";

interface ResponseInterceptorParams {
  schemaJSON: any;
  preparePathname?: (path: string) => string;
  onValidate: (result: ValidationResult) => void;
}

export const createResponseValidator = (params: ResponseInterceptorParams) => {
  const defaultPreparePathname = (path: string): string => path;

  const {schemaJSON, onValidate} = params;
  const preparePathname = params.preparePathname??defaultPreparePathname;
  const openApiSpec = makeApiSpec(schemaJSON, preparePathname??defaultPreparePathname);

  return async (response: Response, method: string): Promise<ValidationResult> => {
    const status = response.status;
    const path = preparePathname(getPathname(response));

    let responseData;
    try {
      responseData = await response.json();
    } catch (_) {}

    const validationError = openApiSpec.validateResponse(Object.assign(response, {method: method}), responseData);

    const result = {
      response,
      validationError,
      status,
      method,
      path
    };

    onValidate && onValidate(result);

    return result;
  };
}
