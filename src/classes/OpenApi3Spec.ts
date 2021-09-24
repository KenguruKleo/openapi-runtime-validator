import {
  defaultBasePath,
  findOpenApiPathMatchingPossiblePathnames,
  getPathnameWithoutBasePath,
} from '../utils/common.utils';
import {
  serversPropertyNotProvidedOrIsEmptyArray,
  getMatchingServerUrlsAndServerBasePaths,
} from '../utils/OpenApi3Spec.utils';
import AbstractOpenApiSpec from './AbstractOpenApiSpec';
import ValidationError from './ValidationError';
import {ISpec} from "../@types";

export default class OpenApi3Spec extends AbstractOpenApiSpec {
  public didUserDefineServers: boolean;

  constructor(spec: ISpec, preparePathname: (path: string) => string) {
    super(spec);
    this.didUserDefineServers = !serversPropertyNotProvidedOrIsEmptyArray(spec);
    this.preparePathname = preparePathname;
    this.ensureDefaultServer();
  }

  /**
   * We can override this function an update path e.g. exclude Proxy prefixes
   * @param path
   */
  preparePathname(path: string) {
    return path;
  }

  /**
   * "If the servers property is not provided, or is an empty array, the default value would be a Server Object with a url value of '/'"
   * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#fixed-fields
   */
  ensureDefaultServer() {
    if (serversPropertyNotProvidedOrIsEmptyArray(this.spec)) {
      this.spec.servers = [{ url: defaultBasePath }];
    }
  }

  /**
   * @returns {[ServerObject]} [ServerObject] {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#server-object}
   */
  servers() {
    return Array.isArray(this.spec.servers) ? this.spec.servers : [this.spec.servers];
  }

  getMatchingServerBasePaths(responsePathname: string) {
    const pathname = this.preparePathname(responsePathname);

    return getMatchingServerUrlsAndServerBasePaths(
      this.servers(),
      pathname,
    ).map(({ matchingBasePath }) => matchingBasePath);
  }

  findOpenApiPathMatchingPathname(responsePathname: string) {
    const pathname = this.preparePathname(responsePathname);
    const matchingServerBasePaths = this.getMatchingServerBasePaths(pathname);
    if (!matchingServerBasePaths.length) {
      throw new ValidationError('SERVER_NOT_FOUND');
    }
    const possiblePathnames = matchingServerBasePaths.map((basePath: any) =>
      getPathnameWithoutBasePath(basePath, pathname),
    );
    const openApiPath = findOpenApiPathMatchingPossiblePathnames(
      possiblePathnames,
      this.paths(),
    );
    if (!openApiPath) {
      throw new ValidationError('PATH_NOT_FOUND');
    }
    return openApiPath;
  }

  /**
   * @returns {ResponseObject} ResponseObject
   * {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#componentsResponses}
   */
  findResponseDefinition(referenceString: string) {
    const nameOfResponseDefinition = referenceString.split(
      '#/components/responses/',
    )[1];
    return (this.spec.components && this.spec.components.responses) ? this.spec.components.responses[nameOfResponseDefinition] : undefined;
  }

  /**
   * @returns {[ComponentsObject]} ComponentsObject
   * {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#componentsObject}
   */
  getComponentDefinitions() {
    return this.spec.components;
  }

  getComponentDefinitionsProperty() {
    return { components: this.getComponentDefinitions() };
  }
}
