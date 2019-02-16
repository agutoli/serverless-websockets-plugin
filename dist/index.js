"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require('@serverless/utils'),
    is = _require.is,
    map = _require.map,
    all = _require.all,
    filter = _require.filter,
    keys = _require.keys,
    isEmpty = _require.isEmpty,
    flatten = _require.flatten;

var chalk = require('chalk');

var ServerlessWebsocketsPlugin =
/*#__PURE__*/
function () {
  function ServerlessWebsocketsPlugin(serverless, options) {
    _classCallCheck(this, ServerlessWebsocketsPlugin);

    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');
    this.authorizers = {}; // to be filled later...

    this.functions = []; // to be filled later...

    this.hooks = {
      'after:deploy:deploy': this.deployWebsockets.bind(this),
      // todo change
      'after:remove:remove': this.removeWebsockets.bind(this),
      'after:info:info': this.displayWebsockets.bind(this)
    };
  }

  _createClass(ServerlessWebsocketsPlugin, [{
    key: "getWebsocketApiName",
    value: function getWebsocketApiName() {
      if (this.serverless.service.provider.websocketApiName && is(String, this.serverless.service.provider.websocketApiName)) {
        return `${this.serverless.service.provider.websocketApiName}`;
      }

      return `${this.serverless.service.service}-${this.provider.getStage()}-websockets-api`;
    }
  }, {
    key: "getWebsocketApiRouteSelectionExpression",
    value: function getWebsocketApiRouteSelectionExpression() {
      if (this.serverless.service.provider.websocketApiRouteSelectionExpression && is(String, this.serverless.service.provider.websocketApiRouteSelectionExpression)) {
        return `${this.serverless.service.provider.websocketApiRouteSelectionExpression}`;
      }

      return `$request.body.action`;
    }
  }, {
    key: "getWebsocketUrl",
    value: function getWebsocketUrl() {
      return `wss://${this.apiId}.execute-api.${this.region}.amazonaws.com/${this.stage}/`;
    }
  }, {
    key: "init",
    value: function init() {
      this.apiName = this.getWebsocketApiName();
      this.routeSelectionExpression = this.getWebsocketApiRouteSelectionExpression();
      this.stage = this.provider.getStage();
      this.region = this.provider.getRegion();
    }
  }, {
    key: "deployWebsockets",
    value: function () {
      var _deployWebsockets = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.init();
                _context.next = 3;
                return this.prepareFunctions();

              case 3:
                if (!(!is(Object, this.serverless.service.functions) || keys(this.serverless.service.functions).length === 0 || isEmpty(this.functions))) {
                  _context.next = 5;
                  break;
                }

                return _context.abrupt("return");

              case 5:
                this.serverless.cli.log(`Deploying Websockets API named "${this.apiName}"...`);
                _context.next = 8;
                return this.createApi();

              case 8:
                _context.next = 10;
                return this.clearRoutes();

              case 10:
                _context.next = 12;
                return this.clearAuthorizers();

              case 12:
                _context.next = 14;
                return this.clearIntegrations();

              case 14:
                _context.next = 16;
                return this.createAuthorizers();

              case 16:
                _context.next = 18;
                return this.createRoutes();

              case 18:
                _context.next = 20;
                return this.createDeployment();

              case 20:
                this.serverless.cli.log(`Websockets API named "${this.apiName}" with ID "${this.apiId}" has been deployed.`);
                this.serverless.cli.log(`  Websocket URL: ${this.getWebsocketUrl()}`);

              case 22:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function deployWebsockets() {
        return _deployWebsockets.apply(this, arguments);
      }

      return deployWebsockets;
    }()
  }, {
    key: "prepareFunctions",
    value: function () {
      var _prepareFunctions = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        var res, outputs;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.provider.request('CloudFormation', 'describeStacks', {
                  StackName: this.provider.naming.getStackName()
                });

              case 2:
                res = _context2.sent;
                outputs = res.Stacks[0].Outputs;
                keys(this.serverless.service.functions || {}).map(function (name) {
                  var func = _this.serverless.service.functions[name];

                  if (func.events && func.events.find(function (event) {
                    return event.websocket;
                  })) {
                    // find the arn of this function in the list of outputs...
                    var outputKey = _this.provider.naming.getLambdaVersionOutputLogicalId(name);

                    var arn = outputs.find(function (output) {
                      return output.OutputKey === outputKey;
                    }).OutputValue; // get list of route keys configured for this function

                    var routes = map(function (e) {
                      if (e.websocket.authorizer && e.websocket.authorizer.name && !_this.authorizers[e.websocket.authorizer.name]) {
                        var authorizerOutputKey = _this.provider.naming.getLambdaVersionOutputLogicalId(e.websocket.authorizer.name);

                        var authorizer = {
                          arn: e.websocket.authorizer.arn,
                          identitySource: e.websocket.authorizer.identitySource,
                          name: e.websocket.authorizer.name
                        };

                        if (!authorizer.arn) {
                          authorizer.arn = outputs.find(function (output) {
                            return output.OutputKey === authorizerOutputKey;
                          }).OutputValue;
                        }

                        if (typeof authorizer.identitySource == 'string') {
                          authorizer.identitySource = map(function (identitySource) {
                            return identitySource.trim();
                          }, authorizer.identitySource.split(','));
                        }

                        _this.authorizers[e.websocket.authorizer.name] = authorizer;
                      }

                      return e.websocket;
                    }, filter(function (e) {
                      return e.websocket && e.websocket.routeKey;
                    }, func.events));
                    var fn = {
                      arn: arn,
                      routes
                    };

                    _this.functions.push(fn);
                  }
                });

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function prepareFunctions() {
        return _prepareFunctions.apply(this, arguments);
      }

      return prepareFunctions;
    }()
  }, {
    key: "getApi",
    value: function () {
      var _getApi = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3() {
        var _this2 = this;

        var apis, websocketApi;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.provider.request('ApiGatewayV2', 'getApis', {});

              case 2:
                apis = _context3.sent;
                // todo what if existing api is not valid websocket api? or non existent?
                websocketApi = apis.Items.find(function (api) {
                  return api.Name === _this2.apiName;
                });
                this.apiId = websocketApi ? websocketApi.ApiId : null;
                return _context3.abrupt("return", this.apiId);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function getApi() {
        return _getApi.apply(this, arguments);
      }

      return getApi;
    }()
  }, {
    key: "createApi",
    value: function () {
      var _createApi = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee4() {
        var params, res;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.getApi();

              case 2:
                if (this.apiId) {
                  _context4.next = 8;
                  break;
                }

                params = {
                  Name: this.apiName,
                  ProtocolType: 'WEBSOCKET',
                  RouteSelectionExpression: this.routeSelectionExpression
                };
                _context4.next = 6;
                return this.provider.request('ApiGatewayV2', 'createApi', params);

              case 6:
                res = _context4.sent;
                this.apiId = res.ApiId;

              case 8:
                return _context4.abrupt("return", this.apiId);

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function createApi() {
        return _createApi.apply(this, arguments);
      }

      return createApi;
    }()
  }, {
    key: "createIntegration",
    value: function () {
      var _createIntegration = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee5(arn) {
        var params, res;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                params = {
                  ApiId: this.apiId,
                  IntegrationMethod: 'POST',
                  IntegrationType: 'AWS_PROXY',
                  IntegrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${arn}/invocations` // integration creation overwrites existing identical integration
                  // so we don't need to check for existance

                };
                _context5.next = 3;
                return this.provider.request('ApiGatewayV2', 'createIntegration', params);

              case 3:
                res = _context5.sent;
                return _context5.abrupt("return", res.IntegrationId);

              case 5:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function createIntegration(_x) {
        return _createIntegration.apply(this, arguments);
      }

      return createIntegration;
    }()
  }, {
    key: "addPermission",
    value: function () {
      var _addPermission = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee6(arn) {
        var functionName, accountId, region, params;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                functionName = arn.split(':')[6];
                accountId = arn.split(':')[4];
                region = arn.split(':')[3];
                params = {
                  Action: 'lambda:InvokeFunction',
                  FunctionName: arn,
                  Principal: 'apigateway.amazonaws.com',
                  SourceArn: `arn:aws:execute-api:${region}:${accountId}:${this.apiId}/*/*`,
                  StatementId: `${functionName}-websocket`
                };
                return _context6.abrupt("return", this.provider.request('Lambda', 'addPermission', params).catch(function (e) {
                  if (e.providerError.code !== 'ResourceConflictException') {
                    throw e;
                  }
                }));

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function addPermission(_x2) {
        return _addPermission.apply(this, arguments);
      }

      return addPermission;
    }()
  }, {
    key: "createRouteResponse",
    value: function () {
      var _createRouteResponse = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee7(routeId, routeResponseKey) {
        var params;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                params = {
                  ApiId: this.apiId,
                  RouteId: routeId,
                  RouteResponseKey: routeResponseKey
                };
                _context7.next = 3;
                return this.provider.request('ApiGatewayV2', 'createRouteResponse', params);

              case 3:
                return _context7.abrupt("return", _context7.sent);

              case 4:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function createRouteResponse(_x3, _x4) {
        return _createRouteResponse.apply(this, arguments);
      }

      return createRouteResponse;
    }()
  }, {
    key: "createRoute",
    value: function () {
      var _createRoute = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee8(integrationId, route) {
        var params, res;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                params = {
                  ApiId: this.apiId,
                  RouteKey: route.routeKey,
                  Target: `integrations/${integrationId}`
                };

                if (route.authorizer && route.authorizer.name) {
                  params.AuthorizationType = 'CUSTOM';
                  params.AuthorizerId = this.authorizers[route.authorizer.name].authorizerId;
                }

                if (route.routeResponseSelectionExpression) {
                  params.RouteResponseSelectionExpression = route.routeResponseSelectionExpression;
                }

                _context8.next = 5;
                return this.provider.request('ApiGatewayV2', 'createRoute', params).catch(function (e) {
                  if (e.providerError.code !== 'ConflictException') {
                    throw e;
                  }
                });

              case 5:
                res = _context8.sent;

                if (!route.routeResponseSelectionExpression) {
                  _context8.next = 9;
                  break;
                }

                _context8.next = 9;
                return this.createRouteResponse(res.RouteId, '$default');

              case 9:
                return _context8.abrupt("return", res);

              case 10:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function createRoute(_x5, _x6) {
        return _createRoute.apply(this, arguments);
      }

      return createRoute;
    }()
  }, {
    key: "clearAuthorizers",
    value: function () {
      var _clearAuthorizers = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee9() {
        var _this3 = this;

        var res;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.provider.request('ApiGatewayV2', 'getAuthorizers', {
                  ApiId: this.apiId
                });

              case 2:
                res = _context9.sent;
                return _context9.abrupt("return", all(map(function (authorizer) {
                  return _this3.provider.request('ApiGatewayV2', 'deleteAuthorizer', {
                    ApiId: _this3.apiId,
                    AuthorizerId: authorizer.AuthorizerId
                  });
                }, res.Items)));

              case 4:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function clearAuthorizers() {
        return _clearAuthorizers.apply(this, arguments);
      }

      return clearAuthorizers;
    }()
  }, {
    key: "createAuthorizer",
    value: function () {
      var _createAuthorizer = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee10(authorizer) {
        var params, res;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                params = {
                  ApiId: this.apiId,
                  AuthorizerType: 'REQUEST',
                  AuthorizerUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${authorizer.arn}/invocations`,
                  IdentitySource: authorizer.identitySource,
                  Name: authorizer.name
                };
                _context10.next = 3;
                return this.provider.request('ApiGatewayV2', 'createAuthorizer', params);

              case 3:
                res = _context10.sent;
                authorizer.authorizerId = res.AuthorizerId;

              case 5:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function createAuthorizer(_x7) {
        return _createAuthorizer.apply(this, arguments);
      }

      return createAuthorizer;
    }()
  }, {
    key: "createAuthorizers",
    value: function () {
      var _createAuthorizers = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee12() {
        var _this4 = this;

        var authorizerPromises;
        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                authorizerPromises = map(
                /*#__PURE__*/
                function () {
                  var _ref = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee11(authorizerName) {
                    var authorizer;
                    return regeneratorRuntime.wrap(function _callee11$(_context11) {
                      while (1) {
                        switch (_context11.prev = _context11.next) {
                          case 0:
                            authorizer = _this4.authorizers[authorizerName];
                            _context11.next = 3;
                            return _this4.addPermission(authorizer.arn);

                          case 3:
                            return _context11.abrupt("return", _this4.createAuthorizer(authorizer));

                          case 4:
                          case "end":
                            return _context11.stop();
                        }
                      }
                    }, _callee11, this);
                  }));

                  return function (_x8) {
                    return _ref.apply(this, arguments);
                  };
                }(), keys(this.authorizers));
                _context12.next = 3;
                return all(authorizerPromises);

              case 3:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function createAuthorizers() {
        return _createAuthorizers.apply(this, arguments);
      }

      return createAuthorizers;
    }()
  }, {
    key: "clearRoutes",
    value: function () {
      var _clearRoutes = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee13() {
        var _this5 = this;

        var res;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                _context13.next = 2;
                return this.provider.request('ApiGatewayV2', 'getRoutes', {
                  ApiId: this.apiId
                });

              case 2:
                res = _context13.sent;
                return _context13.abrupt("return", all(map(function (route) {
                  return _this5.provider.request('ApiGatewayV2', 'deleteRoute', {
                    ApiId: _this5.apiId,
                    RouteId: route.RouteId
                  });
                }, res.Items)));

              case 4:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function clearRoutes() {
        return _clearRoutes.apply(this, arguments);
      }

      return clearRoutes;
    }()
  }, {
    key: "clearIntegrations",
    value: function () {
      var _clearIntegrations = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee14() {
        var _this6 = this;

        var res;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                _context14.next = 2;
                return this.provider.request('ApiGatewayV2', 'getIntegrations', {
                  ApiId: this.apiId
                });

              case 2:
                res = _context14.sent;
                return _context14.abrupt("return", all(map(function (integration) {
                  return _this6.provider.request('ApiGatewayV2', 'deleteIntegration', {
                    ApiId: _this6.apiId,
                    IntegrationId: integration.IntegrationId
                  });
                }, res.Items)));

              case 4:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function clearIntegrations() {
        return _clearIntegrations.apply(this, arguments);
      }

      return clearIntegrations;
    }()
  }, {
    key: "createRoutes",
    value: function () {
      var _createRoutes = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee16() {
        var _this7 = this;

        var integrationsPromises;
        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                integrationsPromises = map(
                /*#__PURE__*/
                function () {
                  var _ref2 = _asyncToGenerator(
                  /*#__PURE__*/
                  regeneratorRuntime.mark(function _callee15(fn) {
                    var integrationId, routesPromises;
                    return regeneratorRuntime.wrap(function _callee15$(_context15) {
                      while (1) {
                        switch (_context15.prev = _context15.next) {
                          case 0:
                            _context15.next = 2;
                            return _this7.createIntegration(fn.arn);

                          case 2:
                            integrationId = _context15.sent;
                            _context15.next = 5;
                            return _this7.addPermission(fn.arn);

                          case 5:
                            routesPromises = map(function (route) {
                              return _this7.createRoute(integrationId, route);
                            }, fn.routes);
                            return _context15.abrupt("return", all(routesPromises));

                          case 7:
                          case "end":
                            return _context15.stop();
                        }
                      }
                    }, _callee15, this);
                  }));

                  return function (_x9) {
                    return _ref2.apply(this, arguments);
                  };
                }(), this.functions);
                return _context16.abrupt("return", all(integrationsPromises));

              case 2:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function createRoutes() {
        return _createRoutes.apply(this, arguments);
      }

      return createRoutes;
    }()
  }, {
    key: "createDeployment",
    value: function () {
      var _createDeployment = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee17() {
        var _this8 = this;

        var _ref3, DeploymentId, params;

        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                _context17.next = 2;
                return this.provider.request('ApiGatewayV2', 'createDeployment', {
                  ApiId: this.apiId
                });

              case 2:
                _ref3 = _context17.sent;
                DeploymentId = _ref3.DeploymentId;
                params = {
                  ApiId: this.apiId,
                  StageName: this.stage,
                  DeploymentId
                };
                return _context17.abrupt("return", this.provider.request('ApiGatewayV2', 'updateStage', params).catch(function (e) {
                  if (e.providerError.code === 'NotFoundException') {
                    return _this8.provider.request('ApiGatewayV2', 'createStage', params);
                  }
                }));

              case 6:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function createDeployment() {
        return _createDeployment.apply(this, arguments);
      }

      return createDeployment;
    }()
  }, {
    key: "removeWebsockets",
    value: function () {
      var _removeWebsockets = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee18() {
        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                this.init();
                _context18.next = 3;
                return this.getApi();

              case 3:
                if (this.apiId) {
                  _context18.next = 5;
                  break;
                }

                return _context18.abrupt("return");

              case 5:
                this.serverless.cli.log(`Removing Websockets API named "${this.apiName}" with ID "${this.apiId}"`);
                return _context18.abrupt("return", this.provider.request('ApiGatewayV2', 'deleteApi', {
                  ApiId: this.apiId
                }));

              case 7:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function removeWebsockets() {
        return _removeWebsockets.apply(this, arguments);
      }

      return removeWebsockets;
    }()
  }, {
    key: "displayWebsockets",
    value: function () {
      var _displayWebsockets = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee19() {
        var _this9 = this;

        var baseUrl, routes;
        return regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                this.init();
                _context19.next = 3;
                return this.prepareFunctions();

              case 3:
                if (!isEmpty(this.functions)) {
                  _context19.next = 5;
                  break;
                }

                return _context19.abrupt("return");

              case 5:
                _context19.next = 7;
                return this.getApi();

              case 7:
                baseUrl = this.getWebsocketUrl();
                routes = flatten(map(function (fn) {
                  return fn.routes.routeKey;
                }, this.functions));
                this.serverless.cli.consoleLog(chalk.yellow('WebSockets:'));
                this.serverless.cli.consoleLog(`  ${chalk.yellow('Base URL:')} ${baseUrl}`);
                this.serverless.cli.consoleLog(chalk.yellow('  Routes:'));
                map(function (route) {
                  return _this9.serverless.cli.consoleLog(`    - ${baseUrl}${route}`);
                }, routes);

              case 13:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function displayWebsockets() {
        return _displayWebsockets.apply(this, arguments);
      }

      return displayWebsockets;
    }()
  }]);

  return ServerlessWebsocketsPlugin;
}();

module.exports = ServerlessWebsocketsPlugin;
//# sourceMappingURL=index.js.map