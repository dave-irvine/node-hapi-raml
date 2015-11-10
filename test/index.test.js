/*eslint-env mocha */
/*eslint-disable no-unused-expressions*/
'use strict';

require('babel-polyfill');

import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import mockFS from 'mock-fs';
import fs from 'fs';
import path from 'path';

chai.use(sinonChai);
chai.use(chaiAsPromised);

import HapiRaml from '../src';

describe('hapi-raml', () => {
    let hapiRaml;

    describe('constructor()', () => {
        it('should throw if not passed a hapi-server', () => {
            expect(() => {
                hapiRaml = new HapiRaml();
            }).to.throw(/Missing `\w+` dependency/);
        });

        it('should throw if not passed a controllers map', () => {
            expect(() => {
                let fakeServer = () => {};

                hapiRaml = new HapiRaml(fakeServer);
            }).to.throw(/Missing `\w+` dependency/);
        });

        it('should throw if not passed a path to a raml file', () => {
            expect(() => {
                let fakeServer = {
                        route: () => {}
                    },
                    fakeControllersMap = {};

                hapiRaml = new HapiRaml(fakeServer, fakeControllersMap);
            }).to.throw('Missing path to RAML file');
        });

        it('should not throw if passed all required properties', () => {
            expect(() => {
                let fakeServer = {
                        route: () => {}
                    },
                    fakeControllersMap = {},
                    ramlPath = './test.raml';

                mockFS({
                    'test.raml': 'test'
                });

                hapiRaml = new HapiRaml(fakeServer, fakeControllersMap, ramlPath);

                mockFS.restore();
            }).to.not.throw();
        });
    });

    describe('hookup()', () => {
        let fakeServer,
            fakeControllersMap,
            ramlPath;

        beforeEach(() => {
            fakeServer = () => {};
            fakeServer.route = () => {};
            fakeControllersMap = {};
            ramlPath = './test.raml';

            let testRAML = fs.readFileSync(path.resolve(__dirname, './test.raml'));

            mockFS({
                'test.raml': testRAML
            });

            hapiRaml = new HapiRaml(fakeServer, fakeControllersMap, ramlPath);
        });

        afterEach(() => {
            mockFS.restore();
        });

        it('should return a Promise', () => {
            expect(hapiRaml.hookup()).to.be.a('Promise');
        });

        it('should reject if the RAML file is not parseable', () => {
            mockFS.restore();

            mockFS({
                'test.raml': 'unparseable'
            });

            return expect(hapiRaml.hookup()).to.be.rejectedWith(/Parsing error/);
        });

        it('should reject if any controllers listed in the RAML are not found', () => {
            return expect(hapiRaml.hookup()).to.be.rejectedWith(/Tried to find Controller '\w+' but it did not exist/);
        });

        it('should reject if any functions listed in the RAML are not found on the Controller', () => {
            fakeControllersMap = {
                'TestController': {}
            };

            hapiRaml = new HapiRaml(fakeServer, fakeControllersMap, ramlPath);

            return expect(hapiRaml.hookup()).to.be.rejectedWith(/Tried to find '\w+' on Controller '\w+' but it did not exist/);
        });

        it('should reject if any functions listed in the RAML are not functions on the Controller', () => {
            fakeControllersMap = {
                'TestController': {
                    'list': () => {},
                    'action': () => {}
                }
            };

            hapiRaml = new HapiRaml(fakeServer, fakeControllersMap, ramlPath);

            return expect(hapiRaml.hookup()).to.be.rejectedWith(/Tried to find 'fetch()' on Controller '\w+' but it did not exist/);
        });

        it('should call server.route() for any functions listed in the RAML that are present on the Controller', () => {
            let routeStub = sinon.stub(fakeServer, 'route', () => {

            });

            fakeControllersMap = {
                'TestController': {
                    'list': () => {},
                    'fetch': () => {},
                    'action': () => {}
                }
            };

            hapiRaml = new HapiRaml(fakeServer, fakeControllersMap, ramlPath);

            return hapiRaml.hookup()
            .then(() => {
                return expect(routeStub).to.have.been.called;
            });
        });

        describe('auth', () => {
            let routeStub,
                routeMap;

            beforeEach(() => {
                routeStub = sinon.stub(fakeServer, 'route', () => {});

                mockFS({
                    'test.raml': ''
                });

                fakeControllersMap = {
                    'TestController': {
                        'list': () => {},
                        'fetch': () => {},
                        'action': () => {}
                    }
                };

                hapiRaml = new HapiRaml(fakeServer, fakeControllersMap, ramlPath);

                sinon.stub(hapiRaml.raml, 'getRouteMap', () => {
                    return new Promise((resolve, reject) => {
                        resolve(routeMap);
                    });
                });
            });

            it('should call server.route() with an auth config when a route has an associated authStrategy', () => {
                routeMap = [
                    {
                        'className': 'TestController',
                        'classFunction': 'list',
                        'uri': '/',
                        'method': 'GET',
                        'authStrategy': ['jwt']
                    }
                ];

                return hapiRaml.hookup()
                .then(() => {
                    let expectedArgs = sinon.match({
                        config: sinon.match({
                            auth: sinon.match.truthy
                        })
                    });

                    return expect(routeStub).to.have.been.calledWith(expectedArgs);
                });
            });

            it('should set the auth config mode to be required when the authStrategy does not contain `null`', () => {
                routeMap = [
                    {
                        'className': 'TestController',
                        'classFunction': 'list',
                        'uri': '/',
                        'method': 'GET',
                        'authStrategy': ['jwt']
                    }
                ];

                return hapiRaml.hookup()
                    .then(() => {
                        let expectedArgs = sinon.match({
                            config: sinon.match({
                                auth: sinon.match({
                                    mode: 'required'
                                })
                            })
                        });

                        return expect(routeStub).to.have.been.calledWith(expectedArgs);
                    });
            });

            it('should set the auth config mode to be optional when the authStrategy contains null', () => {
                routeMap = [
                    {
                        'className': 'TestController',
                        'classFunction': 'list',
                        'uri': '/',
                        'method': 'GET',
                        'authStrategy': [null, 'jwt']
                    }
                ];

                return hapiRaml.hookup()
                .then(() => {
                    let expectedArgs = sinon.match({
                        config: sinon.match({
                            auth: sinon.match({
                                mode: 'optional'
                            })
                        })
                    });

                    return expect(routeStub).to.have.been.calledWith(expectedArgs);
                });
            });

            it('should set the auth config strategies to match all the authStrategy elements', () => {
                routeMap = [
                    {
                        'className': 'TestController',
                        'classFunction': 'list',
                        'uri': '/',
                        'method': 'GET',
                        'authStrategy': ['jwt', 'oauth']
                    }
                ];

                return hapiRaml.hookup()
                .then(() => {
                    let expectedArgs = sinon.match({
                        config: sinon.match({
                            auth: sinon.match({
                                strategies: ['jwt', 'oauth']
                            })
                        })
                    });

                    return expect(routeStub).to.have.been.calledWith(expectedArgs);
                });
            });

            it('should not include `null` in the auth config strategies', () => {
                routeMap = [
                    {
                        'className': 'TestController',
                        'classFunction': 'list',
                        'uri': '/',
                        'method': 'GET',
                        'authStrategy': [null, 'jwt']
                    }
                ];

                return hapiRaml.hookup()
                .then(() => {
                    let expectedArgs = sinon.match({
                        config: sinon.match({
                            auth: sinon.match({
                                strategies: ['jwt']
                            })
                        })
                    });

                    return expect(routeStub).to.have.been.calledWith(expectedArgs);
                });
            });

            it('should set the auth config to be false if null is the only authStrategy', () => {
                routeMap = [
                    {
                        'className': 'TestController',
                        'classFunction': 'list',
                        'uri': '/',
                        'method': 'GET',
                        'authStrategy': [null]
                    }
                ];

                return hapiRaml.hookup()
                .then(() => {
                    let expectedArgs = sinon.match({
                        config: sinon.match({
                            auth: false
                        })
                    });

                    return expect(routeStub).to.have.been.calledWith(expectedArgs);
                });
            });
        });
    });
});
