/*eslint-env mocha */
/*eslint-disable no-unused-expressions*/
'use strict';

import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import mock_fs from 'mock-fs';

chai.use(sinonChai);
chai.use(chaiAsPromised);

import RAML from '../../src/utils/RAML';

describe('RAML', () => {
    let newRAML;

    describe('constructor', () => {
        let mockFS,
            mockParser,
            ramlPath;

        beforeEach(() => {
            ramlPath = './test.raml';
            mockFS = mock_fs.fs({
                'test.raml': 'test'
            });
            mockParser = {};
        });

        it('should throw if not passed fs dependency', () => {
            expect(() => {
                newRAML = new RAML();
            }).to.throw(/Missing `\w+` dependency/);
        });

        it('should throw if not passed parser dependency', () => {
            expect(() => {
                newRAML = new RAML(mockFS);
            }).to.throw(/Missing `\w+` dependency/);
        });

        it('should throw if not passed a path to RAML file', () => {
            expect(() => {
                newRAML = new RAML(mockFS, mockParser);
            }).to.throw('Missing path to RAML file');
        });

        it('should throw if the path to the raml file does not exist', () => {
            let mockFSMissingRAML = mock_fs.fs({});

            expect(() => {
                newRAML = new RAML(mockFSMissingRAML, mockParser, ramlPath);
            }).to.throw('path to RAML file does not exist');
        });

        it('should not throw if passed all required properties', () => {
            expect(() => {
                newRAML = new RAML(mockFS, mockParser, ramlPath);
            }).to.not.throw();
        });
    });

    describe('loadRAMLFile()', () => {
        let mockParser;

        beforeEach(() => {
            let ramlPath = './test.raml';

            let mockFS = mock_fs.fs({
                'test.raml': 'test'
            });

            mockParser = {
                load: () => {
                    return new Promise((resolve) => {});
                }
            };

            newRAML = new RAML(mockFS, mockParser, ramlPath);
        });

        it('should return a Promise', () => {
            expect(newRAML.loadRAMLFile()).to.be.a('Promise');
        });

        it('should load the file content and pass it to the parser', () => {
            let loadStub = sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve, reject) => {
                    resolve();
                });
            });

            return newRAML.loadRAMLFile()
            .then(() => {
                return expect(loadStub).to.have.been.called;
            });
        });

        it('should resolve with the parsed raml', () => {
            let expectedAST = 'parsed';
            let loadStub = sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve, reject) => {
                    resolve(expectedAST);
                });
            });

            return expect(newRAML.loadRAMLFile()).to.eventually.deep.equal(expectedAST);
        });

        it('should reject if the raml fails to parse', () => {
            let loadStub = sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve, reject) => {
                    reject();
                });
            });

            return (expect(newRAML.loadRAMLFile())).to.eventually.be.rejected;
        });
    });

    describe('getRouteMap()', () => {
        let mockParser;

        beforeEach(() => {
            let ramlPath = './test.raml';

            let mockFS = mock_fs.fs({
                'test.raml': 'test'
            });

            mockParser = {
                load: () => {
                    return new Promise((resolve) => {
                        resolve({
                            resources: []
                        });
                    });
                }
            };

            newRAML = new RAML(mockFS, mockParser, ramlPath);
        });

        it('should return a Promise', () => {
            expect(newRAML.getRouteMap()).to.be.a('Promise');
        });

        it('should eventually resolve with an Array', () => {
            return expect(newRAML.getRouteMap()).to.eventually.be.an('Array');
        });

        it('should reject if given invalid resources', () => {
            let resources = [{}];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return expect(newRAML.getRouteMap()).to.eventually.be.rejected;
        });

        it('should reject if given resources with no methods', () => {
            let resources = [{
                relativeUri: '/objects'
            }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return expect(newRAML.getRouteMap()).to.eventually.be.rejected;
        });

        it('should reject if given a resource with invalid sub-resources', () => {
            let resources = [{
                relativeUri: '/objects',
                methods: [{
                    method: 'get'
                }],
                resources: [{

                }]
            }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return expect(newRAML.getRouteMap()).to.eventually.be.rejected;
        });

        it('should parse only the resources it is given', () => {
            let resources = [
            {
                relativeUri: '/objects',
                type: 'collection',
                methods: [{
                    method: 'get'
                }]
            }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
            .then((mappedRoutes) => {
                return expect(mappedRoutes).to.be.of.length(resources.length);
            });
        });

        it('should convert URIs of `collection` resources to be Controller classes', () => {
            let expectedClass = 'ObjectController';
            let resources = [
            {
                relativeUri: '/objects',
                type: 'collection',
                methods: [{
                    method: 'get'
                }]
            }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
            .then((mappedRoutes) => {
                let mappedRoute = mappedRoutes[0];

                return expect(mappedRoute.className).to.equal(expectedClass);
            });
        });

        it('should convert URIs of `collection-item` resources to be Controller classes', () => {
            let expectedClass = 'ObjectController';
            let resources = [
                {
                    relativeUri: '/objects',
                    type: 'collection-item',
                    methods: [{
                        method: 'get'
                    }]
                }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
            .then((mappedRoutes) => {
                let mappedRoute = mappedRoutes[0];

                return expect(mappedRoute.className).to.equal(expectedClass);
            });
        });

        it('should convert URIs with no resource type to be Controller classes', () => {
            let expectedClass = 'ObjectController';
            let resources = [
                {
                    relativeUri: '/objects',
                    methods: [{
                        method: 'get'
                    }]
                }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
            .then((mappedRoutes) => {
                let mappedRoute = mappedRoutes[0];

                return expect(mappedRoute.className).to.equal(expectedClass);
            });
        });

        it('should convert URIs of `collection` resources with no subpath in the URI to be `list()` commands', () => {
            let expectedClassFunction = 'list';
            let resources = [
                {
                    relativeUri: '/objects',
                    type: 'collection',
                    methods: [{
                        method: 'get'
                    }]
                }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
            .then((mappedRoutes) => {
                let mappedRoute = mappedRoutes[0];

                return expect(mappedRoute.classFunction).to.equal(expectedClassFunction);
            });
        });

        it('should convert URIs of `collection` resources with a subpath in the URI to be commands matching the subpath', () => {
            let expectedClassFunction = 'create';
            let resources = [
                {
                    relativeUri: '/objects/create',
                    type: 'collection',
                    methods: [{
                        method: 'get'
                    }]
                }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
                .then((mappedRoutes) => {
                    let mappedRoute = mappedRoutes[0];

                    return expect(mappedRoute.classFunction).to.equal(expectedClassFunction);
                });
        });

        it('should convert URIs of `collection-item` resources with a subpath in the URI to be commands matching the subpath', () => {
            let expectedClassFunction = 'create';
            let resources = [
                {
                    relativeUri: '/objects/create',
                    type: 'collection-item',
                    methods: [{
                        method: 'get'
                    }]
                }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
                .then((mappedRoutes) => {
                    let mappedRoute = mappedRoutes[0];

                    return expect(mappedRoute.classFunction).to.equal(expectedClassFunction);
                });
        });

        it('should convert URIs of resources with no type and a subpath in the URI to be commands matching the subpath', () => {
            let expectedClassFunction = 'create';
            let resources = [
                {
                    relativeUri: '/create',
                    methods: [{
                        method: 'get'
                    }]
                }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
                .then((mappedRoutes) => {
                    let mappedRoute = mappedRoutes[0];

                    return expect(mappedRoute.classFunction).to.equal(expectedClassFunction);
                });
        });

        it('should convert URIs of resource type `collection-item` and a subpath of {id} to be `fetch()` commands', () => {
            let expectedClassFunction = 'fetch';
            let resources = [
                {
                    relativeUri: '/{id}',
                    type: 'collection-item',
                    methods: [{
                        method: 'get'
                    }]
                }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
            .then((mappedRoutes) => {
                let mappedRoute = mappedRoutes[0];

                return expect(mappedRoute.classFunction).to.equal(expectedClassFunction);
            });
        });

        it('should parse sub resources of a resource', () => {
            let resources = [
                {
                    relativeUri: '/objects',
                    type: 'collection',
                    methods: [{
                        method: 'get'
                    }],
                    resources: [
                        {
                            relativeUri: '/{id}',
                            methods: [{
                                method: 'get'
                            }]
                        }
                    ]
                }];

            sinon.stub(mockParser, 'load', () => {
                return new Promise((resolve) => {
                    resolve({
                        resources: resources
                    });
                });
            });

            return newRAML.getRouteMap()
            .then((mappedRoutes) => {
                return expect(mappedRoutes).to.be.of.length(2);
            });
        });
    });
});
