'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _utilsRAML = require('./utils/RAML');

var _utilsRAML2 = _interopRequireDefault(_utilsRAML);

var _ramlParser = require('raml-parser');

var _ramlParser2 = _interopRequireDefault(_ramlParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var HapiRaml = (function () {
    function HapiRaml(server, controllersMap, ramlPath) {
        _classCallCheck(this, HapiRaml);

        if (server === undefined || typeof server !== 'function') {
            throw new Error('Missing `server` dependency.');
        } else {
            this.server = server;
        }
        if (controllersMap === undefined || typeof controllersMap !== 'object') {
            throw new Error('Missing `controllersMap` dependency.');
        } else {
            this.controllersMap = controllersMap;
        }

        this.raml = new _utilsRAML2['default'](_fs2['default'], _ramlParser2['default'], ramlPath);
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

                    _lodash2['default'].each(routeMap, function (route) {
                        if (controllersMap[route.className] !== undefined) {
                            var _ret = (function () {
                                var controller = controllersMap[route.className];

                                if (controller[route.classFunction] !== undefined && typeof controller[route.classFunction] === 'function') {
                                    (function () {
                                        var controllerFunction = controller[route.classFunction];

                                        server.route({
                                            method: route.method,
                                            path: route.uri,
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

                            if (typeof _ret === 'object') return _ret.v;
                        } else {
                            rejected = true;
                            reject('Tried to find Controller \'' + route.className + '\' but it did not exist.');
                            return false;
                        }
                    });

                    if (!rejected) {
                        resolve();
                    }
                })['catch'](function (err) {
                    reject(err);
                });
            });
        }
    }]);

    return HapiRaml;
})();

exports['default'] = HapiRaml;
module.exports = exports['default'];