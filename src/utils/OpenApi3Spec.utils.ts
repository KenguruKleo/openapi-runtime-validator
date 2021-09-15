// @ts-ignore
import generateCombinations from "combos";

import {defaultBasePath} from "./common.utils";

type ServerVariables = Record<string, any>;

type Server = {
  url: string;
  variables: ServerVariables;
}

const unique = (array: Array<any>) => Array.from(new Set(array).values());

export const serversPropertyNotProvidedOrIsEmptyArray = (spec: { servers: string | any[]; }) =>
  !Object.prototype.hasOwnProperty.call(spec, "servers") || !spec.servers.length;

const getBasePath = (url: string) => {
  const basePathStartIndex = url.replace("//", "  ").indexOf("/");

  return basePathStartIndex !== -1 ? url.slice(basePathStartIndex) : defaultBasePath;
};

const getPossibleValuesOfServerVariable = ({default: defaultValue, enum: enumMembers}: {
  default: any;
  enum: Array<any>
}) =>
  enumMembers ? unique([defaultValue].concat(enumMembers)) : [defaultValue];

const mapServerVariablesToPossibleValues = (serverVariables: ServerVariables) =>
  Object.entries(serverVariables).reduce(
    (currentMap, [variableName, detailsOfPossibleValues]) => ({
      ...currentMap,
      [variableName]: getPossibleValuesOfServerVariable(detailsOfPossibleValues as any)
    }),
    {}
  );

const convertTemplateExpressionToConcreteExpression = (templateExpression: string, mapOfVariablesToValues: Record<string, any>) =>
  Object.entries(mapOfVariablesToValues).reduce(
    (currentExpression, [variable, value]) => currentExpression.replace(`{${variable}}`, value),
    templateExpression
  );

const getPossibleConcreteBasePaths = (basePath: string, serverVariables: ServerVariables) => {
  const mapOfServerVariablesToPossibleValues = mapServerVariablesToPossibleValues(serverVariables);
  const combinationsOfBasePathVariableValues = generateCombinations(mapOfServerVariablesToPossibleValues);
  const possibleBasePaths = combinationsOfBasePathVariableValues.map((mapOfVariablesToValues: any) =>
    convertTemplateExpressionToConcreteExpression(basePath, mapOfVariablesToValues)
  );

  return possibleBasePaths;
};

const getPossibleBasePaths = (url: string, serverVariables: ServerVariables) => {
  const basePath = getBasePath(url);

  return serverVariables ? getPossibleConcreteBasePaths(basePath, serverVariables) : [basePath];
};

export const getMatchingServerUrlsAndServerBasePaths = (servers: Server[], pathname: string) => {
  const matchesPathname = (basePath: string) => pathname.startsWith(basePath);

  return servers
    .map(({url: templatedUrl, variables}) => ({
      templatedUrl,
      possibleBasePaths: getPossibleBasePaths(templatedUrl, variables)
    }))
    .filter(({possibleBasePaths}) => possibleBasePaths.some(matchesPathname))
    .map(({templatedUrl, possibleBasePaths}) => {
      const matchingBasePath = possibleBasePaths.find(matchesPathname);

      return {
        concreteUrl: templatedUrl.replace(getBasePath(templatedUrl), matchingBasePath),
        matchingBasePath
      };
    });
};
