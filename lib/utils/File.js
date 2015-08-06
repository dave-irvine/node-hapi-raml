'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var File = (function () {
    function File(fs, modelsPath, collectionsPath) {
        _classCallCheck(this, File);

        this.resolvedModelsPath = undefined;
        this.resolvedCollectionsPath = undefined;

        if (fs === undefined) {
            throw new Error('Missing `fs` dependency.');
        } else {
            this._fs = fs;
        }

        if (modelsPath === undefined) {
            throw new Error('Missing path to Models');
        } else {
            this.resolvedModelsPath = _path2['default'].resolve(process.cwd(), modelsPath);

            if (!fs.existsSync(this.resolvedModelsPath)) {
                throw new Error('path to Models does not exist');
            }
        }

        if (collectionsPath === undefined) {
            throw new Error('Missing path to Collections');
        } else {
            this.resolvedCollectionsPath = _path2['default'].resolve(process.cwd(), collectionsPath);

            if (!fs.existsSync(this.resolvedCollectionsPath)) {
                throw new Error('path to Collections does not exist');
            }
        }
    }

    _createClass(File, [{
        key: 'fetchModelFiles',
        value: function fetchModelFiles() {
            var _this = this;

            return new _Promise(function (resolve, reject) {
                _this._fs.readdir(_this.resolvedModelsPath, function (err, files) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(files);
                    }
                });
            });
        }
    }, {
        key: 'loadModelFiles',
        value: function loadModelFiles(modelFiles) {
            var _this2 = this;

            return new _Promise(function (resolve, reject) {
                var rejected = false,
                    modelMap = {};
                _lodash2['default'].each(modelFiles, function (modelFile) {
                    var modelPath = _this2.resolvedModelsPath + '/' + modelFile;
                    try {
                        var loadedModel = require(modelPath);
                        if (loadedModel.name === undefined) {
                            reject('Unable to load model from file ' + modelPath + ', is it a valid node.js module?');
                            rejected = true;
                            return false;
                        } else {
                            modelMap[loadedModel.name] = loadedModel;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                });

                if (!rejected) {
                    resolve(modelMap);
                }
            });
        }
    }, {
        key: 'fetchCollectionFiles',
        value: function fetchCollectionFiles() {
            var _this3 = this;

            return new _Promise(function (resolve, reject) {
                _this3._fs.readdir(_this3.resolvedCollectionsPath, function (err, files) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(files);
                    }
                });
            });
        }
    }]);

    return File;
})();

exports['default'] = File;
;
module.exports = exports['default'];
//# sourceMappingURL=File.js.map