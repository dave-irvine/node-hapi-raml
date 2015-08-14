'use strict';

import path from 'path';
import pluralize from 'pluralize';
import string from 'string';
import _ from 'lodash';

export default class RAML {
    constructor(fs, parser, ramlPath) {
        if (fs === undefined) {
            throw new Error('Missing `fs` dependency.');
        } else {
            this.fs = fs;
        }

        if (parser === undefined) {
            throw new Error('Missing `parser` dependency.');
        } else {
            this.parser = parser;
        }

        if (ramlPath === undefined) {
            throw new Error('Missing path to RAML file');
        } else {
            this.resolvedRamlPath = path.resolve(process.cwd(), ramlPath);

            if (!fs.existsSync(this.resolvedRamlPath)) {
                throw new Error('path to RAML file does not exist');
            }
        }
    }

    loadRAMLFile() {
        return new Promise((resolve, reject) => {
            this.parser.loadFile(this.resolvedRamlPath)
            .then((parsedData) => {
                if (parsedData && !parsedData.baseUri) {
                    reject(new Error('Missing `baseUri` property'));
                }

                resolve(parsedData);
            })
            .catch((parseErr) => {
                reject(new Error('Parsing error: ' + parseErr));
            });
        });
    }

    getRouteMap() {
        function camelize(str) {
            return string(str).camelize().s;
        }

        function singularize(str) {
            return pluralize.singular(str);
        }

        function uppercase(str) {
            return str.toUpperCase();
        }

        function resourcesParser(resources, parentResource, ast) {
            let routeMap = [],
                defaultAuthStrategies;

            if (parentResource && parentResource.baseUri) {
                ast = parentResource;
                parentResource = undefined;
            }

            if (ast === undefined) {
                throw new Error('Resource is not parseable, ast was not passed');
            } else {
                if (ast.securedBy !== undefined) {
                    defaultAuthStrategies = ast.securedBy;
                }
            }

            resources.forEach((resource) => {
                let baseClassName,
                    className,
                    classFunction,
                    strippedRelativeUri;

                if (resource.relativeUri === undefined) {
                    throw new Error('Resource is not parseable, no relativeUri');
                }

                resource.hapi = {};
                classFunction = '';
                strippedRelativeUri = resource.relativeUri.substring(1);

                if (parentResource !== undefined) {
                    className = parentResource.relativeUri.substring(1);
                    if (className.indexOf('/') > 0) {
                        className = className.substring(0, className.indexOf('/'));
                    }

                    resource.hapi.resourceUri = `${parentResource.hapi.resourceUri}${resource.relativeUri}`;
                } else {
                    className = strippedRelativeUri;
                    if (className.indexOf('/') > 0) {
                        className = className.substring(0, className.indexOf('/'));
                    }

                    resource.hapi.resourceUri = resource.relativeUri;
                }

                baseClassName = className;
                className = singularize(className);
                className = camelize(`-${className}-controller`);

                switch (resource.type) {
                    case 'collection':
                        if (strippedRelativeUri === baseClassName) {
                            classFunction = 'list';
                        } else {
                            classFunction = strippedRelativeUri.substring(strippedRelativeUri.lastIndexOf('/') + 1);
                        }
                        break;
                    case 'collection-item':
                    default:
                        switch (strippedRelativeUri) {
                            case '{id}':
                                classFunction = 'fetch';
                                break;
                            default:
                                classFunction = strippedRelativeUri.substring(strippedRelativeUri.lastIndexOf('/') + 1);
                        }
                }

                resource.hapi.className = className;
                resource.hapi.classFunction = classFunction;

                if (resource.methods === undefined) {
                    throw new Error('Resource is not parseable, no methods');
                }

                resource.methods.forEach((method) => {
                    resource.hapi.method = uppercase(method.method);

                    if (method.securedBy !== undefined) {
                        resource.hapi.authStrategy = method.securedBy;
                    } else {
                        if (defaultAuthStrategies !== undefined) {
                            resource.hapi.authStrategy = defaultAuthStrategies;
                        } else {
                            resource.hapi.authStrategy = ['null'];
                        }
                    }

                    let route = {
                        'className': resource.hapi.className,
                        'classFunction': resource.hapi.classFunction,
                        'uri': resource.hapi.resourceUri,
                        'method': resource.hapi.method,
                        'authStrategy': resource.hapi.authStrategy
                    };

                    routeMap.push(route);
                });

                if (resource.resources) {
                    let mappedRoutes = resourcesParser(resource.resources, resource, ast);
                    routeMap = _.flatten([routeMap, mappedRoutes]);
                }
            });

            return routeMap;
        }

        return new Promise((resolve, reject) => {
            this.loadRAMLFile()
            .then((ast) => {
                try {
                    var parsedResources = resourcesParser(ast.resources, ast);
                    resolve(parsedResources);
                } catch (e) {
                    reject(e);
                }
            })
            .catch((e) => {
                reject(e);
            });
        });
    }
}
