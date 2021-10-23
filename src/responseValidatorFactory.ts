import {makeApiSpec, ResponseValidatorParams} from "./index";
import {getPathname} from "./utils/common.utils";
import {ValidationResult} from "./@types";

const getResponseDataDefault = async (response: Response): Promise<any> => {
  let responseData;

  try {
    responseData = await response.json();
  } catch (_) {}

  return responseData;
};

const defaultPreparePathname = (path: string): string => path;

const defaultSkipValidation = (path: string): boolean => false;

export const createResponseValidator = (params: ResponseValidatorParams) => {
  const {openApiSchema, onValidate, getResponseData} = params;

  const preparePathname = params.preparePathname??defaultPreparePathname;
  const skipValidation = params.skipValidation??defaultSkipValidation;

  const openApiSpec = makeApiSpec(openApiSchema, preparePathname??defaultPreparePathname);

  return async (response: Response, method: string): Promise<ValidationResult> => {
    const status = response.status;
    const path = preparePathname(getPathname(response));

    const responseData = await (getResponseData ? getResponseData(response) : getResponseDataDefault(response));

    let validationError = null;

    if (!skipValidation(path)) {
      validationError = openApiSpec.validateResponse(Object.assign(response, {method: method}), responseData);
    }

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
