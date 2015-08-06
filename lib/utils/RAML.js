'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

var _string = require('string');

var _string2 = _interopRequireDefault(_string);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var RAML = (function () {
    function RAML(fs, parser, ramlPath) {
        _classCallCheck(this, RAML);

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
            this.resolvedRamlPath = _path2['default'].resolve(process.cwd(), ramlPath);

            if (!fs.existsSync(this.resolvedRamlPath)) {
                throw new Error('path to RAML file does not exist');
            }
        }
    }

    _createClass(RAML, [{
        key: 'loadRAMLFile',
        value: function loadRAMLFile() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                _this.fs.readFile(_this.resolvedRamlPath, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        _this.parser.load(data).then(function (parsedData) {
                            resolve(parsedData);
                        })['catch'](function (parseErr) {
                            reject(new Error('Parsing error: ' + parseErr));
                        });
                    }
                });
            });
        }
    }, {
        key: 'getRouteMap',
        value: function getRouteMap() {
            var _this2 = this;

            function camelize(str) {
                return (0, _string2['default'])(str).camelize().s;
            }

            function singularize(str) {
                return _pluralize2['default'].singular(str);
            }

            function uppercase(str) {
                return str.toUpperCase();
            }

            function resourcesParser(resources, parentResource) {
                var routeMap = [];

                resources.forEach(function (resource) {
                    var baseClassName = undefined,
                        className = undefined,
                        classFunction = undefined,
                        strippedRelativeUri = undefined;

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

                        resource.hapi.resourceUri = '' + parentResource.hapi.resourceUri + resource.relativeUri;
                    } else {
                        className = strippedRelativeUri;
                        if (className.indexOf('/') > 0) {
                            className = className.substring(0, className.indexOf('/'));
                        }

                        resource.hapi.resourceUri = resource.relativeUri;
                    }

                    baseClassName = className;
                    className = singularize(className);
                    className = camelize('-' + className + '-controller');

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

                    resource.methods.forEach(function (method) {
                        resource.hapi.method = uppercase(method.method);

                        var route = {
                            'className': resource.hapi.className,
                            'classFunction': resource.hapi.classFunction,
                            'uri': resource.hapi.resourceUri,
                            'method': resource.hapi.method
                        };

                        routeMap.push(route);
                    });

                    if (resource.resources) {
                        var mappedRoutes = resourcesParser(resource.resources, resource);
                        routeMap = _lodash2['default'].flatten([routeMap, mappedRoutes]);
                    }
                });

                return routeMap;
            }

            return new Promise(function (resolve, reject) {
                _this2.loadRAMLFile().then(function (ast) {
                    try {
                        var parsedResources = resourcesParser(ast.resources);
                        resolve(parsedResources);
                    } catch (e) {
                        reject(e);
                    }
                })['catch'](function (e) {
                    reject(e);
                });
            });
        }
    }]);

    return RAML;
})();

exports['default'] = RAML;
module.exports = exports['default'];