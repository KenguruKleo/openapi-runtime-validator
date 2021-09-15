import {Path} from "path-parser";

// @ts-ignore
export const stringify = obj => JSON.stringify( obj, null, 2 );;

export const getPathname = (response: Response): string => {
  // excludes the query because path = pathname + query
  return new URL(response.url).pathname;
};

// converts all {foo} to :foo
const convertOpenApiPathToColonForm = (openApiPath: string): string => {
  return openApiPath.replace(/{/g, ":").replace(/}/g, "");
};

const doesColonPathMatchPathname = (pathInColonForm: string, pathname: string): boolean => {
  const pathParamsInPathname = new Path(pathInColonForm).test(pathname); // => one of: null, {}, {exampleParam: 'foo'}

  return Boolean(pathParamsInPathname);
};
const doesOpenApiPathMatchPathname = (openApiPath: string, pathname: string): boolean => {
  const pathInColonForm = convertOpenApiPathToColonForm(openApiPath);

  return doesColonPathMatchPathname(pathInColonForm, pathname);
};

export const findOpenApiPathMatchingPossiblePathnames = (possiblePathnames: string[], OAPaths: string[]):  string | undefined => {
  let openApiPath;

  for (const pathname of possiblePathnames) {
    for (const OAPath of OAPaths) {
      if (OAPath === pathname) {
        return OAPath;
      }

      if (doesOpenApiPathMatchPathname(OAPath, pathname)) {
        openApiPath = OAPath;
      }
    }
  }

  return openApiPath;
};

export const defaultBasePath = "/";

export const getPathnameWithoutBasePath = (basePath: string, pathname: string): string =>
  basePath === defaultBasePath ? pathname : pathname.replace(basePath, "");
