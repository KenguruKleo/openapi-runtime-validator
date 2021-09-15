import {makeApiSpec} from "./index";
import {getPathname} from "./utils/common.utils";
import {ValidationResult} from "./classes/@types";

interface ResponseInterceptorParams {
  schemaJSON: any;
  preparePathname: (path: string) => string;
  onValidate: (result: ValidationResult) => void;
}

export const createResponseInterceptor = ({schemaJSON, preparePathname, onValidate}: ResponseInterceptorParams) => {
  const openApiSpec = makeApiSpec(schemaJSON, preparePathname);

  return async (response: Response, method: string): Promise<void> => {
    const status = response.status;
    const path = preparePathname(getPathname(response));

    let cloneResponse;
    try {
      cloneResponse = await response.json();
    } catch (_) {}

    const validationError = openApiSpec.validateResponse(Object.assign(response, {method: method}), cloneResponse);

    const result = {
      response,
      validationError,
      status,
      method,
      path
    };
    onValidate(result);
  };
}
