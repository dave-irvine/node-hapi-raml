'use strict';

import fs from 'fs';
import RAML from './utils/RAML';
import ramlParser from 'raml-parser';
import _ from 'lodash';

export default class HapiRaml {
    constructor(server, controllersMap, ramlPath) {
        if (server === undefined
        || server.route === undefined
        || typeof server.route !== 'function') {
            throw new Error('Missing `server` dependency.');
        } else {
            this.server = server;
        }
        if (controllersMap === undefined
        || typeof controllersMap !== 'object') {
            throw new Error('Missing `controllersMap` dependency.');
        } else {
            this.controllersMap = controllersMap;
        }

        this.raml = new RAML(fs, ramlParser, ramlPath);
    }

    hookup() {
        return new Promise((resolve, reject) => {
            let controllersMap = this.controllersMap,
                server = this.server;

            this.raml.getRouteMap()
            .then(function (routeMap) {
                let rejected = false;

                _.each(routeMap, (route) => {
                    if (controllersMap[route.className] !== undefined) {
                        let controller = controllersMap[route.className];

                        if (controller[route.classFunction] !== undefined
                        && typeof controller[route.classFunction] === 'function') {
                            let controllerFunction = controller[route.classFunction];
                            let routeOptions = {};

                            if (route.authStrategy !== undefined) {
                                let authOptions = {
                                    mode: 'required',
                                    strategies: []
                                };

                                _.each(route.authStrategy, (authStrategy) => {
                                    if (authStrategy !== null) {
                                        authOptions.strategies.push(authStrategy);
                                    } else {
                                        authOptions.mode = 'optional';
                                    }
                                });

                                if (authOptions.strategies.length > 0) {
                                    routeOptions.auth = authOptions;
                                }
                            }

                            server.route({
                                method: route.method,
                                path: route.uri,
                                config: routeOptions,
                                handler: (request, reply) => {
                                    controllerFunction.apply(controller, [request, reply]);
                                }
                            });
                        } else {
                            rejected = true;
                            reject(`Tried to find '${route.classFunction}' on Controller '${route.className}' but it did not exist.`);
                            return false;
                        }
                    } else {
                        rejected = true;
                        reject(`Tried to find Controller '${route.className}' but it did not exist.`);
                        return false;
                    }
                });

                if (!rejected) {
                    resolve();
                }
            })
            .catch((err) => {
                reject(err);
            });
        });
    }
}
