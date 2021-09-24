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

export const createResponseValidator = (params: ResponseValidatorParams) => {
  const defaultPreparePathname = (path: string): string => path;

  const {openApiSchema, onValidate, getResponseData} = params;
  const preparePathname = params.preparePathname??defaultPreparePathname;
  const openApiSpec = makeApiSpec(openApiSchema, preparePathname??defaultPreparePathname);

  return async (response: Response, method: string): Promise<ValidationResult> => {
    const status = response.status;
    const path = preparePathname(getPathname(response));

    const responseData = await (getResponseData ? getResponseData(response) : getResponseDataDefault(response));

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
