'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _RAML = require('./utils/RAML');

var _RAML2 = _interopRequireDefault(_RAML);

var _ramlParser = require('raml-parser');

var _ramlParser2 = _interopRequireDefault(_ramlParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var HapiRaml = (function () {
    function HapiRaml(server, controllersMap, ramlPath) {
        _classCallCheck(this, HapiRaml);

        if (server === undefined || server.route === undefined || typeof server.route !== 'function') {
            throw new Error('Missing `server` dependency.');
        } else {
            this.server = server;
        }
        if (controllersMap === undefined || (typeof controllersMap === 'undefined' ? 'undefined' : _typeof(controllersMap)) !== 'object') {
            throw new Error('Missing `controllersMap` dependency.');
        } else {
            this.controllersMap = controllersMap;
        }

        this.raml = new _RAML2.default(_fs2.default, _ramlParser2.default, ramlPath);
    }

    _createClass(HapiRaml, [{
        key: 'hookup',
        value: function hookup() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                var controllersMap = _this.controllersMap,
                    server = _this.server;

                _this.raml.getRouteMap().then(function (routeMap) {
                    var rejected = false;

                    _lodash2.default.each(routeMap, function (route) {
                        if (controllersMap[route.className] !== undefined) {
                            var _ret = (function () {
                                var controller = controllersMap[route.className];

                                if (controller[route.classFunction] !== undefined && typeof controller[route.classFunction] === 'function') {
                                    (function () {
                                        var controllerFunction = controller[route.classFunction];
                                        var routeOptions = {};

                                        if (route.authStrategy !== undefined) {
                                            (function () {
                                                var authOptions = {
                                                    mode: 'required',
                                                    strategies: []
                                                };

                                                _lodash2.default.each(route.authStrategy, function (authStrategy) {
                                                    if (authStrategy !== null) {
                                                        authOptions.strategies.push(authStrategy);
                                                    } else {
                                                        authOptions.mode = 'optional';
                                                    }
                                                });

                                                if (authOptions.strategies.length > 0) {
                                                    routeOptions.auth = authOptions;
                                                } else {
                                                    routeOptions.auth = false;
                                                }
                                            })();
                                        }

                                        server.route({
                                            method: route.method,
                                            path: route.uri,
                                            config: routeOptions,
                                            handler: function handler(request, reply) {
                                                controllerFunction.apply(controller, [request, reply]);
                                            }
                                        });
                                    })();
                                } else {
                                    rejected = true;
                                    reject('Tried to find \'' + route.classFunction + '\' on Controller \'' + route.className + '\' but it did not exist.');
                                    return {
                                        v: false
                                    };
                                }
                            })();

                            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                        } else {
                            rejected = true;
                            reject('Tried to find Controller \'' + route.className + '\' but it did not exist.');
                            return false;
                        }
                    });

                    if (!rejected) {
                        resolve();
                    }
                }).catch(function (err) {
                    reject(err);
                });
            });
        }
    }]);

    return HapiRaml;
})();

exports.default = HapiRaml;