"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _agentServices = _interopRequireDefault(require("./agent.services.js"));
var _authServices = _interopRequireDefault(require("../Auth/auth.services.js"));
var _constants = require("../../../config/constants.js");
var _responseHelper = require("../../../config/responseHelper.js");
var _common = require("../../../constants/message/common");
var _agent = require("../../../constants/message/agent");
var _mail = _interopRequireDefault(require("../helpers/mail"));
var _randomstring = _interopRequireDefault(require("randomstring"));
var _moment = _interopRequireDefault(require("moment"));
var _fs = _interopRequireDefault(require("fs"));
var _commonFunction = require("../helpers/commonFunction");
var _set_password = require("../EmailTemplates/set_password.js");
var _jwt = require("../helpers/jwt");
var _kyc_approved = require("../EmailTemplates/kyc_approved.js");
var _kyc_rejected = require("../EmailTemplates/kyc_rejected.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
require("dotenv").config();
var agent = exports["default"] = /*#__PURE__*/function () {
  function agent() {
    _classCallCheck(this, agent);
  }
  return _createClass(agent, [{
    key: "init",
    value: function () {
      var _init = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(db) {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              this.services = new _agentServices["default"]();
              this.AuthServices = new _authServices["default"]();
              this.Models = db.models;
              _context.next = 5;
              return this.services.init(db);
            case 5:
              _context.next = 7;
              return this.AuthServices.init(db);
            case 7:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function init(_x) {
        return _init.apply(this, arguments);
      }
      return init;
    }() /* add Agent */
  }, {
    key: "addAgent",
    value: (function () {
      var _addAgent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
        var _this = this;
        var body, user, files, msg, _msg, _msg2, _msg3, checkEmail, newAgent, sendData, uploadedProfile, profileImage, _sendData, uploadedImage, whereData, message, getGlobalSetting, payload, token, to, inviteUserLink, emailTemplate, subject, mailFunction;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              body = req.body, user = req.user, files = req.files;
              /** check email exist or not */
              if (body.first_name) {
                _context3.next = 5;
                break;
              }
              msg = "First name is required";
              return _context3.abrupt("return", this.services.errorFunction(req, res, msg));
            case 5:
              if (body.last_name) {
                _context3.next = 8;
                break;
              }
              _msg = "Last name is required";
              return _context3.abrupt("return", this.services.errorFunction(req, res, _msg));
            case 8:
              if (body.email) {
                _context3.next = 11;
                break;
              }
              _msg2 = "Email address is required";
              return _context3.abrupt("return", this.services.errorFunction(req, res, _msg2));
            case 11:
              body.email = body.email.toLowerCase();
              if (body.address) {
                _context3.next = 15;
                break;
              }
              _msg3 = "Address is required";
              return _context3.abrupt("return", this.services.errorFunction(req, res, _msg3));
            case 15:
              _context3.next = 17;
              return this.services.getAgentByMail(body.email);
            case 17:
              checkEmail = _context3.sent;
              if (!checkEmail) {
                _context3.next = 20;
                break;
              }
              return _context3.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_ALREADY_ADDED, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 20:
              body.is_verified = 0;
              body.role_id = _constants.ROLES.AGENT;
              body.added_by = user.id;
              body.is_complete_profile = 0;
              body.status = _constants.USER_STATUS.PENDING;
              _context3.next = 27;
              return this.services.createAgent(body);
            case 27:
              newAgent = _context3.sent;
              _context3.next = 30;
              return (0, _commonFunction.createCometChatUser)(body.first_name + " " + body.last_name, newAgent.id, _constants.COMETCHATROLES[_constants.ROLES.AGENT - 1], body.email, body.phone_number).then(function (res) {
                return res.json();
              }).then(/*#__PURE__*/function () {
                var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(json) {
                  return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                    while (1) switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.next = 2;
                        return _this.services.updateAgentDetail({
                          cometUserCreated: 1
                        }, newAgent.id);
                      case 2:
                      case "end":
                        return _context2.stop();
                    }
                  }, _callee2);
                }));
                return function (_x4) {
                  return _ref.apply(this, arguments);
                };
              }())["catch"](function (err) {
                return console.error("error in creating Agent:" + err);
              });
            case 30:
              if (!(files && files.profile_picture && files.profile_picture.length > 0)) {
                _context3.next = 41;
                break;
              }
              sendData = {
                files: files.profile_picture,
                id: newAgent.id,
                folder: 'Users'
              };
              _context3.next = 34;
              return (0, _commonFunction.uploadFileForAll)(sendData);
            case 34:
              uploadedProfile = _context3.sent;
              if (!(uploadedProfile.length > 0)) {
                _context3.next = 41;
                break;
              }
              profileImage = {
                user_image: uploadedProfile[0].file_key
              };
              _context3.next = 39;
              return this.services.updateAgentDetail(profileImage, newAgent.id);
            case 39:
              _context3.next = 41;
              return (0, _commonFunction.updateCometChatUser)(newAgent.id, {
                avatar: process.env.BASE_IMAGE_URL + profileImage.user_image
              });
            case 41:
              if (!(files && files.files && files.files.length > 0)) {
                _context3.next = 50;
                break;
              }
              _sendData = {
                files: files.files,
                id: newAgent.id,
                folder: 'Agent-Attachmets'
              };
              _context3.next = 45;
              return (0, _commonFunction.uploadFileForAll)(_sendData);
            case 45:
              uploadedImage = _context3.sent;
              if (!(uploadedImage.length > 0)) {
                _context3.next = 50;
                break;
              }
              whereData = {
                added_by: user.id,
                agent_id: newAgent.id
              };
              _context3.next = 50;
              return this.services.addAttachments(uploadedImage, whereData);
            case 50:
              message = _agent.AgentMessages.AGENT_ADDED;
              if (!(body.is_welcome_email == 1)) {
                _context3.next = 69;
                break;
              }
              message = _agent.AgentMessages.INVITE_LINK;
              // const token = randomstring.generate(64);
              _context3.next = 55;
              return this.Models.GlobalSettings.findOne({
                attributes: ["id", "user_role", "is_authenticate"],
                where: {
                  user_role: 7
                },
                raw: true
              });
            case 55:
              getGlobalSetting = _context3.sent;
              payload = {
                email: body.email,
                password_setting: getGlobalSetting ? getGlobalSetting.is_authenticate : 1
              };
              /** generate token */
              token = (0, _jwt.refreshToken)(payload);
              _context3.next = 60;
              return this.Models.Users.update({
                invite_token: token
              }, {
                where: {
                  email: body.email
                }
              });
            case 60:
              to = body.email.toLowerCase();
              inviteUserLink = "".concat(process.env.BASE_URL, "set-password/").concat(token);
              _context3.next = 64;
              return (0, _set_password.setPassword)(inviteUserLink);
            case 64:
              emailTemplate = _context3.sent;
              subject = "Agent Invite link";
              mailFunction = process.env.PRODUCTION == true || process.env.PRODUCTION == "true" ? _mail["default"].sendinBlueMail : _mail["default"].sendMail;
              _context3.next = 69;
              return mailFunction(to, subject, emailTemplate);
            case 69:
              return _context3.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(message, {}, _constants.RESPONSE_CODES.POST)));
            case 72:
              _context3.prev = 72;
              _context3.t0 = _context3["catch"](0);
              console.log(_context3.t0, "====error====");
              return _context3.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 76:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[0, 72]]);
      }));
      function addAgent(_x2, _x3) {
        return _addAgent.apply(this, arguments);
      }
      return addAgent;
    }())
  }, {
    key: "getAgent",
    value: (/* Get agent Detail */function () {
      var _getAgent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
        var params, user, whereCondition, getAgentDetail, setAttributes, getPermission, getAllClientOfAgents, getClientIds, getAgentsAccess, checkOwnAgentsAccess, getAgentAccessData;
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              params = req.params, user = req.user;
              whereCondition = {
                id: params.agent_id,
                role_id: _constants.ROLES.AGENT
              };
              _context4.next = 5;
              return this.services.getAgentDetailByAgentId(whereCondition, user);
            case 5:
              getAgentDetail = _context4.sent;
              if (getAgentDetail) {
                _context4.next = 8;
                break;
              }
              return _context4.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 8:
              ;
              if (!(user.role_id == _constants.ROLES.ACCOUNTMANAGER)) {
                _context4.next = 28;
                break;
              }
              setAttributes = ["id", "agent_view", "agent_hide_info", "deleted_at"];
              _context4.next = 13;
              return this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
            case 13:
              getPermission = _context4.sent;
              if (!(getPermission && getPermission.agent_view == 1)) {
                _context4.next = 27;
                break;
              }
              _context4.next = 17;
              return this.Models.AssignedUsers.findAll({
                attribute: ["id", "type", "user_id", "agent_id", "account_manager_id", "deleted_at"],
                where: {
                  account_manager_id: user.id,
                  type: [_constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER, _constants.ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER],
                  deleted_at: null
                },
                raw: true
              });
            case 17:
              getAllClientOfAgents = _context4.sent;
              getClientIds = getAllClientOfAgents.map(function (val) {
                return val.user_id;
              });
              _context4.next = 21;
              return this.Models.AssignedUsers.findOne({
                attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
                where: {
                  agent_id: params.agent_id,
                  user_id: getClientIds,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_AGENT,
                  deleted_at: null
                },
                raw: true
              });
            case 21:
              getAgentsAccess = _context4.sent;
              _context4.next = 24;
              return this.Models.AssignedUsers.findOne({
                attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
                where: {
                  agent_id: params.agent_id,
                  account_manager_id: user.id,
                  type: _constants.ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
                  deleted_at: null
                },
                raw: true
              });
            case 24:
              checkOwnAgentsAccess = _context4.sent;
              if (!(!getAgentsAccess && !checkOwnAgentsAccess)) {
                _context4.next = 27;
                break;
              }
              return _context4.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_ACCESS, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 27:
              if (getPermission && getPermission.agent_hide_info == 1) {
                getAgentDetail.email = "*****";
                getAgentDetail.phone_number = "*****";
              }
            case 28:
              _context4.next = 30;
              return this.services.getAgentAccess(params.agent_id, user);
            case 30:
              getAgentAccessData = _context4.sent;
              getAgentDetail.dataValues.is_delete_access = getAgentAccessData.is_delete_access;
              getAgentDetail.dataValues.is_edit_access = getAgentAccessData.is_edit_access;
              return _context4.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_DATA, getAgentDetail, _constants.RESPONSE_CODES.GET)));
            case 36:
              _context4.prev = 36;
              _context4.t0 = _context4["catch"](0);
              console.log(_context4.t0, "=====error======");
              return _context4.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 40:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this, [[0, 36]]);
      }));
      function getAgent(_x5, _x6) {
        return _getAgent.apply(this, arguments);
      }
      return getAgent;
    }())
  }, {
    key: "agentList",
    value: (/* agents's list */function () {
      var _agentList = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
        var body, user, list;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              body = req.body, user = req.user;
              _context5.next = 4;
              return this.services.getAgentList(body, user);
            case 4:
              list = _context5.sent;
              return _context5.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_LIST, list, _constants.RESPONSE_CODES.GET)));
            case 8:
              _context5.prev = 8;
              _context5.t0 = _context5["catch"](0);
              console.log(_context5.t0, "==error===");
              return _context5.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 12:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this, [[0, 8]]);
      }));
      function agentList(_x7, _x8) {
        return _agentList.apply(this, arguments);
      }
      return agentList;
    }())
  }, {
    key: "addAgentGroup",
    value: (/* add Agent  Group*/function () {
      var _addAgentGroup = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
        var body, user, checkGroup;
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.prev = 0;
              body = req.body, user = req.user;
              /** check group name exist or not */
              _context6.next = 4;
              return this.services.getAgentGroupByName(body.group_name);
            case 4:
              checkGroup = _context6.sent;
              if (!checkGroup) {
                _context6.next = 7;
                break;
              }
              return _context6.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.GROUP_NAME_ALREADY_ADDED, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              body.user_id = user.id;
              _context6.next = 10;
              return this.services.createAgentGroup(body);
            case 10:
              return _context6.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GROUP_ADDED, {}, _constants.RESPONSE_CODES.POST)));
            case 13:
              _context6.prev = 13;
              _context6.t0 = _context6["catch"](0);
              return _context6.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 16:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this, [[0, 13]]);
      }));
      function addAgentGroup(_x9, _x10) {
        return _addAgentGroup.apply(this, arguments);
      }
      return addAgentGroup;
    }())
  }, {
    key: "agentGroupList",
    value: (/* agents's Group list */function () {
      var _agentGroupList = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
        var body, user, getGroupList;
        return _regeneratorRuntime().wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              _context7.prev = 0;
              body = req.body, user = req.user;
              _context7.next = 4;
              return this.services.getAgentGroupList(body, user);
            case 4:
              getGroupList = _context7.sent;
              return _context7.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_LIST, getGroupList, _constants.RESPONSE_CODES.GET)));
            case 8:
              _context7.prev = 8;
              _context7.t0 = _context7["catch"](0);
              console.log(_context7.t0, "====error=====");
              return _context7.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 12:
            case "end":
              return _context7.stop();
          }
        }, _callee7, this, [[0, 8]]);
      }));
      function agentGroupList(_x11, _x12) {
        return _agentGroupList.apply(this, arguments);
      }
      return agentGroupList;
    }())
  }, {
    key: "addMemberInAgentGroup",
    value: (/* add Agents in Group*/function () {
      var _addMemberInAgentGroup = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
        var body, user, checkGroup, memberids, groupMemberData, groupMembers, i, getGroupMember, membersInfo, allMemberIds;
        return _regeneratorRuntime().wrap(function _callee8$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              _context8.prev = 0;
              body = req.body, user = req.user;
              /** check group exist or not */
              _context8.next = 4;
              return this.services.getAgentGroupById(body.group_id);
            case 4:
              checkGroup = _context8.sent;
              if (checkGroup) {
                _context8.next = 7;
                break;
              }
              return _context8.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.GROUP_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              memberids = [];
              body.user_id = user.id;
              if (!(body.agent_ids.length > 0)) {
                _context8.next = 24;
                break;
              }
              groupMemberData = [];
              groupMembers = _toConsumableArray(new Set(body.agent_ids));
              _context8.t0 = _regeneratorRuntime().keys(groupMembers);
            case 13:
              if ((_context8.t1 = _context8.t0()).done) {
                _context8.next = 21;
                break;
              }
              i = _context8.t1.value;
              _context8.next = 17;
              return this.Models.AgentGroupMembers.findOne({
                where: {
                  user_id: groupMembers[i],
                  agent_group_id: body.group_id,
                  deleted_at: null
                },
                raw: true
              });
            case 17:
              getGroupMember = _context8.sent;
              if (!getGroupMember) {
                groupMemberData.push({
                  agent_group_id: body.group_id,
                  user_id: groupMembers[i]
                });
              }
              _context8.next = 13;
              break;
            case 21:
              _context8.next = 23;
              return this.Models.AgentGroupMembers.bulkCreate(groupMemberData);
            case 23:
              memberids = _context8.sent;
            case 24:
              if (!(body.delete_agent_ids.length > 0)) {
                _context8.next = 27;
                break;
              }
              _context8.next = 27;
              return this.Models.AgentGroupMembers.update({
                deleted_at: (0, _moment["default"])(new Date()).unix()
              }, {
                where: {
                  agent_group_id: body.group_id,
                  user_id: body.delete_agent_ids
                },
                raw: true
              });
            case 27:
              membersInfo = [];
              if (!(memberids.length > 0)) {
                _context8.next = 33;
                break;
              }
              allMemberIds = memberids.map(function (val) {
                return val.id;
              });
              _context8.next = 32;
              return this.services.getGroupMembersByMemberId(allMemberIds);
            case 32:
              membersInfo = _context8.sent;
            case 33:
              return _context8.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GROUP_MEMBER_ADDED, membersInfo, _constants.RESPONSE_CODES.POST)));
            case 36:
              _context8.prev = 36;
              _context8.t2 = _context8["catch"](0);
              console.log(_context8.t2, "===error===");
              return _context8.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 40:
            case "end":
              return _context8.stop();
          }
        }, _callee8, this, [[0, 36]]);
      }));
      function addMemberInAgentGroup(_x13, _x14) {
        return _addMemberInAgentGroup.apply(this, arguments);
      }
      return addMemberInAgentGroup;
    }())
  }, {
    key: "editAgentGroup",
    value: (/* edit Agent group and members */function () {
      var _editAgentGroup = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(req, res) {
        var body, user, checkGroup, checkGroupName, groupInfo, groupMemberData, groupMembers, i, getGroupMember;
        return _regeneratorRuntime().wrap(function _callee9$(_context9) {
          while (1) switch (_context9.prev = _context9.next) {
            case 0:
              _context9.prev = 0;
              body = req.body, user = req.user;
              /** check group exist or not */
              _context9.next = 4;
              return this.services.getAgentGroupById(body.group_id);
            case 4:
              checkGroup = _context9.sent;
              if (checkGroup) {
                _context9.next = 7;
                break;
              }
              return _context9.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.GROUP_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              _context9.next = 9;
              return this.services.checkAgentGroupNameById(body.group_name, body.group_id);
            case 9:
              checkGroupName = _context9.sent;
              if (!checkGroupName) {
                _context9.next = 12;
                break;
              }
              return _context9.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.GROUP_NAME_ALREADY_ADDED, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 12:
              groupInfo = {
                group_name: body.group_name
              };
              _context9.next = 15;
              return this.services.updateAgentGroup(groupInfo, body.group_id);
            case 15:
              body.user_id = user.id;
              if (!(body.agent_ids.length > 0)) {
                _context9.next = 30;
                break;
              }
              groupMemberData = [];
              groupMembers = _toConsumableArray(new Set(body.agent_ids));
              _context9.t0 = _regeneratorRuntime().keys(groupMembers);
            case 20:
              if ((_context9.t1 = _context9.t0()).done) {
                _context9.next = 28;
                break;
              }
              i = _context9.t1.value;
              _context9.next = 24;
              return this.Models.AgentGroupMembers.findOne({
                where: {
                  user_id: groupMembers[i],
                  deleted_at: null
                },
                raw: true
              });
            case 24:
              getGroupMember = _context9.sent;
              if (!getGroupMember) {
                groupMemberData.push({
                  agent_group_id: body.group_id,
                  user_id: groupMembers[i]
                });
              }
              _context9.next = 20;
              break;
            case 28:
              _context9.next = 30;
              return this.Models.AgentGroupMembers.bulkCreate(groupMemberData);
            case 30:
              if (!(body.delete_agent_ids.length > 0)) {
                _context9.next = 33;
                break;
              }
              _context9.next = 33;
              return this.Models.AgentGroupMembers.update({
                deleted_at: (0, _moment["default"])(new Date()).unix()
              }, {
                where: {
                  agent_group_id: body.group_id,
                  user_id: body.delete_agent_ids
                },
                raw: true
              });
            case 33:
              return _context9.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GROUP_UPDATE, {}, _constants.RESPONSE_CODES.POST)));
            case 36:
              _context9.prev = 36;
              _context9.t2 = _context9["catch"](0);
              return _context9.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 39:
            case "end":
              return _context9.stop();
          }
        }, _callee9, this, [[0, 36]]);
      }));
      function editAgentGroup(_x15, _x16) {
        return _editAgentGroup.apply(this, arguments);
      }
      return editAgentGroup;
    }())
  }, {
    key: "deleteAgentGroup",
    value: (/* delete agent Group */function () {
      var _deleteAgentGroup = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(req, res) {
        var body, checkGroup, updateData;
        return _regeneratorRuntime().wrap(function _callee10$(_context10) {
          while (1) switch (_context10.prev = _context10.next) {
            case 0:
              _context10.prev = 0;
              body = req.body;
              /** check group exist or not */
              _context10.next = 4;
              return this.services.getAgentGroupById(body.group_id);
            case 4:
              checkGroup = _context10.sent;
              if (checkGroup) {
                _context10.next = 7;
                break;
              }
              return _context10.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.GROUP_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              updateData = {
                deleted_at: (0, _moment["default"])(new Date()).unix()
              };
              _context10.next = 10;
              return this.services.updateAgentGroup(updateData, body.group_id);
            case 10:
              _context10.next = 12;
              return this.Models.AgentGroupMembers.update({
                deleted_at: (0, _moment["default"])(new Date()).unix()
              }, {
                where: {
                  agent_group_id: body.group_id
                },
                raw: true
              });
            case 12:
              return _context10.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GROUP_DELETE, {}, _constants.RESPONSE_CODES.POST)));
            case 15:
              _context10.prev = 15;
              _context10.t0 = _context10["catch"](0);
              return _context10.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 18:
            case "end":
              return _context10.stop();
          }
        }, _callee10, this, [[0, 15]]);
      }));
      function deleteAgentGroup(_x17, _x18) {
        return _deleteAgentGroup.apply(this, arguments);
      }
      return deleteAgentGroup;
    }())
  }, {
    key: "agentGroupDetail",
    value: (/* get Agent group detail */function () {
      var _agentGroupDetail = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(req, res) {
        var params, user, getGroupInfo;
        return _regeneratorRuntime().wrap(function _callee11$(_context11) {
          while (1) switch (_context11.prev = _context11.next) {
            case 0:
              _context11.prev = 0;
              params = req.params, user = req.user;
              /** check group exist or not */
              _context11.next = 4;
              return this.services.getAgentGroupInfo(params.group_id, user);
            case 4:
              getGroupInfo = _context11.sent;
              if (getGroupInfo) {
                _context11.next = 7;
                break;
              }
              return _context11.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.GROUP_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              return _context11.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_DATA, getGroupInfo, _constants.RESPONSE_CODES.POST)));
            case 10:
              _context11.prev = 10;
              _context11.t0 = _context11["catch"](0);
              console.log(_context11.t0, "====error===");
              return _context11.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 14:
            case "end":
              return _context11.stop();
          }
        }, _callee11, this, [[0, 10]]);
      }));
      function agentGroupDetail(_x19, _x20) {
        return _agentGroupDetail.apply(this, arguments);
      }
      return agentGroupDetail;
    }())
  }, {
    key: "uploadAttachments",
    value: (/* upload attachments */function () {
      var _uploadAttachments = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(req, res) {
        var body, user, files, getAllAttachments, msg, whereCondition, getAgentDetail, _msg4, sendData, uploadedImage, whereData;
        return _regeneratorRuntime().wrap(function _callee12$(_context12) {
          while (1) switch (_context12.prev = _context12.next) {
            case 0:
              _context12.prev = 0;
              body = req.body, user = req.user, files = req.files;
              /** check email exist or not */
              getAllAttachments = [];
              if (body.agent_id) {
                _context12.next = 6;
                break;
              }
              msg = "Agent is required";
              return _context12.abrupt("return", this.services.errorFunction(req, res, msg));
            case 6:
              whereCondition = {
                id: body.agent_id,
                role_id: _constants.ROLES.AGENT,
                deleted_at: null
              };
              _context12.next = 9;
              return this.services.getAgentInformation(whereCondition);
            case 9:
              getAgentDetail = _context12.sent;
              if (getAgentDetail) {
                _context12.next = 12;
                break;
              }
              return _context12.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 12:
              if (!(files.length == 0)) {
                _context12.next = 15;
                break;
              }
              _msg4 = "Attachments is required";
              return _context12.abrupt("return", this.services.errorFunction(req, res, _msg4));
            case 15:
              if (!(files && files.length > 0)) {
                _context12.next = 25;
                break;
              }
              sendData = {
                files: files,
                id: body.agent_id,
                folder: 'Agent-Attachmets'
              };
              _context12.next = 19;
              return (0, _commonFunction.uploadFileForAll)(sendData);
            case 19:
              uploadedImage = _context12.sent;
              if (!(uploadedImage.length > 0)) {
                _context12.next = 25;
                break;
              }
              whereData = {
                added_by: user.id,
                agent_id: body.agent_id
              };
              _context12.next = 24;
              return this.services.addAttachments(uploadedImage, whereData);
            case 24:
              getAllAttachments = _context12.sent;
            case 25:
              return _context12.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.AGENT_ATTACHMENT_ADDED, getAllAttachments, _constants.RESPONSE_CODES.POST)));
            case 28:
              _context12.prev = 28;
              _context12.t0 = _context12["catch"](0);
              console.log(_context12.t0, "====error====");
              return _context12.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 32:
            case "end":
              return _context12.stop();
          }
        }, _callee12, this, [[0, 28]]);
      }));
      function uploadAttachments(_x21, _x22) {
        return _uploadAttachments.apply(this, arguments);
      }
      return uploadAttachments;
    }())
  }, {
    key: "deleteAgentAttachment",
    value: (/* delete Agent attachment */function () {
      var _deleteAgentAttachment = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(req, res) {
        var body, checkAttachment, updateData;
        return _regeneratorRuntime().wrap(function _callee13$(_context13) {
          while (1) switch (_context13.prev = _context13.next) {
            case 0:
              _context13.prev = 0;
              body = req.body;
              /** check group exist or not */
              _context13.next = 4;
              return this.services.getAttachmentById(body.attachment_id);
            case 4:
              checkAttachment = _context13.sent;
              if (checkAttachment) {
                _context13.next = 7;
                break;
              }
              return _context13.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.ATTACHMENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              updateData = {
                deleted_at: (0, _moment["default"])(new Date()).unix()
              };
              _context13.next = 10;
              return this.services.updateAgentAttachment(updateData, body.attachment_id);
            case 10:
              _context13.next = 12;
              return (0, _commonFunction.s3RemoveSingleFile)(checkAttachment.file);
            case 12:
              return _context13.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.ATTACHMENT_DELETE, {}, _constants.RESPONSE_CODES.POST)));
            case 15:
              _context13.prev = 15;
              _context13.t0 = _context13["catch"](0);
              return _context13.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 18:
            case "end":
              return _context13.stop();
          }
        }, _callee13, this, [[0, 15]]);
      }));
      function deleteAgentAttachment(_x23, _x24) {
        return _deleteAgentAttachment.apply(this, arguments);
      }
      return deleteAgentAttachment;
    }())
  }, {
    key: "editAgent",
    value: (/* edit Agent info */function () {
      var _editAgent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee15(req, res) {
        var body, files, user, msg, _msg5, _msg6, _msg7, whereCondition, getAgentDetail, sendData, uploadedProfile, getAgentInfo, getAgentAccessData, setAttributes, getPermission;
        return _regeneratorRuntime().wrap(function _callee15$(_context15) {
          while (1) switch (_context15.prev = _context15.next) {
            case 0:
              _context15.prev = 0;
              body = req.body, files = req.files, user = req.user;
              if (body.agent_id) {
                _context15.next = 5;
                break;
              }
              msg = "Agent id is required";
              return _context15.abrupt("return", this.services.errorFunction(req, res, msg));
            case 5:
              if (body.first_name) {
                _context15.next = 8;
                break;
              }
              _msg5 = "First name is required";
              return _context15.abrupt("return", this.services.errorFunction(req, res, _msg5));
            case 8:
              if (body.last_name) {
                _context15.next = 11;
                break;
              }
              _msg6 = "Last name is required";
              return _context15.abrupt("return", this.services.errorFunction(req, res, _msg6));
            case 11:
              if (body.address) {
                _context15.next = 14;
                break;
              }
              _msg7 = "Address is required";
              return _context15.abrupt("return", this.services.errorFunction(req, res, _msg7));
            case 14:
              whereCondition = {
                id: body.agent_id,
                role_id: _constants.ROLES.AGENT,
                deleted_at: null
              };
              /** check agent exist or not */
              _context15.next = 17;
              return this.services.getAgentInformation(whereCondition);
            case 17:
              getAgentDetail = _context15.sent;
              if (getAgentDetail) {
                _context15.next = 20;
                break;
              }
              return _context15.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 20:
              if (body.email && body.email == "*****") {
                body.email = getAgentDetail.email;
              }
              if (body.phone_number && body.phone_number == "*****") {
                body.phone_number = getAgentDetail.phone_number;
              }
              if (!(files && files.length > 0)) {
                _context15.next = 31;
                break;
              }
              if (!getAgentDetail.user_image) {
                _context15.next = 26;
                break;
              }
              _context15.next = 26;
              return (0, _commonFunction.s3RemoveSingleFile)(getAgentDetail.user_image);
            case 26:
              sendData = {
                files: files,
                id: body.agent_id,
                folder: 'Users'
              };
              _context15.next = 29;
              return (0, _commonFunction.uploadFileForAll)(sendData);
            case 29:
              uploadedProfile = _context15.sent;
              if (uploadedProfile.length > 0) {
                body.user_image = uploadedProfile[0].file_key;
              }
            case 31:
              _context15.next = 33;
              return this.services.updateAgentDetail(body, body.agent_id);
            case 33:
              _context15.next = 35;
              return this.services.getAgentDetailByAgentId(whereCondition, user);
            case 35:
              getAgentInfo = _context15.sent;
              _context15.next = 38;
              return this.services.getAgentAccess(body.agent_id, user);
            case 38:
              getAgentAccessData = _context15.sent;
              getAgentInfo.dataValues.is_delete_access = getAgentAccessData.is_delete_access;
              getAgentInfo.dataValues.is_edit_access = getAgentAccessData.is_edit_access;
              if (!(user.role_id == _constants.ROLES.ACCOUNTMANAGER)) {
                _context15.next = 47;
                break;
              }
              setAttributes = ["id", "agent_view", "agent_hide_info", "deleted_at"];
              _context15.next = 45;
              return this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
            case 45:
              getPermission = _context15.sent;
              if (getPermission && getPermission.agent_hide_info == 1) {
                getAgentInfo.email = "*****";
                getAgentInfo.phone_number = "*****";
              }
            case 47:
              _context15.next = 49;
              return (0, _commonFunction.updateCometChatUser)(body.agent_id, {
                name: getAgentInfo.first_name + " " + getAgentInfo.last_name,
                avatar: getAgentInfo.user_image ? process.env.BASE_IMAGE_URL + getAgentInfo.user_image : "",
                metadata: {
                  "@private": {
                    email: getAgentInfo.email,
                    contactNumber: getAgentInfo.phone_number
                  }
                }
              }).then(function (res) {
                return res.json();
              }).then(/*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(json) {
                  return _regeneratorRuntime().wrap(function _callee14$(_context14) {
                    while (1) switch (_context14.prev = _context14.next) {
                      case 0:
                      case "end":
                        return _context14.stop();
                    }
                  }, _callee14);
                }));
                return function (_x27) {
                  return _ref2.apply(this, arguments);
                };
              }())["catch"](function (err) {
                return console.error("error in updating agent:" + err);
              });
            case 49:
              return _context15.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.AGENT_UPDATE, getAgentInfo, _constants.RESPONSE_CODES.POST)));
            case 52:
              _context15.prev = 52;
              _context15.t0 = _context15["catch"](0);
              console.log(_context15.t0, "======error====");
              return _context15.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 56:
            case "end":
              return _context15.stop();
          }
        }, _callee15, this, [[0, 52]]);
      }));
      function editAgent(_x25, _x26) {
        return _editAgent.apply(this, arguments);
      }
      return editAgent;
    }())
  }, {
    key: "deleteAgentGroupMember",
    value: (/* delete Agent group member */function () {
      var _deleteAgentGroupMember = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee16(req, res) {
        var body, checkMember, updateData;
        return _regeneratorRuntime().wrap(function _callee16$(_context16) {
          while (1) switch (_context16.prev = _context16.next) {
            case 0:
              _context16.prev = 0;
              body = req.body;
              /** check member exist or not */
              _context16.next = 4;
              return this.services.getGroupMemberById(body.member_id);
            case 4:
              checkMember = _context16.sent;
              if (checkMember) {
                _context16.next = 7;
                break;
              }
              return _context16.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.GROUP_MEMBER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              updateData = {
                deleted_at: (0, _moment["default"])(new Date()).unix()
              };
              _context16.next = 10;
              return this.services.updateAgentGroupMemberDetail(updateData, body.member_id);
            case 10:
              return _context16.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GROUP_MEMBER_DELETE, {}, _constants.RESPONSE_CODES.POST)));
            case 13:
              _context16.prev = 13;
              _context16.t0 = _context16["catch"](0);
              return _context16.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 16:
            case "end":
              return _context16.stop();
          }
        }, _callee16, this, [[0, 13]]);
      }));
      function deleteAgentGroupMember(_x28, _x29) {
        return _deleteAgentGroupMember.apply(this, arguments);
      }
      return deleteAgentGroupMember;
    }())
  }, {
    key: "agentGroupMemeberList",
    value: (/* get Agent group memebers list */function () {
      var _agentGroupMemeberList = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee17(req, res) {
        var body, user, getGroupInfo;
        return _regeneratorRuntime().wrap(function _callee17$(_context17) {
          while (1) switch (_context17.prev = _context17.next) {
            case 0:
              _context17.prev = 0;
              body = req.body, user = req.user;
              /** check group exist or not */
              _context17.next = 4;
              return this.services.getAgentGroupMemberList(body.group_id, body, user);
            case 4:
              getGroupInfo = _context17.sent;
              if (getGroupInfo) {
                _context17.next = 7;
                break;
              }
              return _context17.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.GROUP_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              return _context17.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_DATA, getGroupInfo, _constants.RESPONSE_CODES.POST)));
            case 10:
              _context17.prev = 10;
              _context17.t0 = _context17["catch"](0);
              console.log(_context17.t0, "====error===");
              return _context17.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 14:
            case "end":
              return _context17.stop();
          }
        }, _callee17, this, [[0, 10]]);
      }));
      function agentGroupMemeberList(_x30, _x31) {
        return _agentGroupMemeberList.apply(this, arguments);
      }
      return agentGroupMemeberList;
    }())
  }, {
    key: "uploadKyc",
    value: (/* upload KYC */function () {
      var _uploadKyc = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee18(req, res) {
        var user, files, msg, _msg8, updateAgentKyc, _msg9, _msg10, _msg11, sendData, uploadFrontKyc, _sendData2, uploadBackKyc;
        return _regeneratorRuntime().wrap(function _callee18$(_context18) {
          while (1) switch (_context18.prev = _context18.next) {
            case 0:
              _context18.prev = 0;
              user = req.user, files = req.files;
              /** check email exist or not */
              if (!(user.is_complete_profile < _constants.AGENT_PROFILE_COMPLETE_STATUS.DOCUSIGN_COMPLETE)) {
                _context18.next = 5;
                break;
              }
              msg = "Please complete your docusign first.";
              return _context18.abrupt("return", this.services.errorFunction(req, res, msg));
            case 5:
              if (!(user.is_complete_profile >= _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_KYC)) {
                _context18.next = 8;
                break;
              }
              _msg8 = "You already upload your kyc detail.";
              return _context18.abrupt("return", this.services.errorFunction(req, res, _msg8));
            case 8:
              updateAgentKyc = {};
              if (files) {
                _context18.next = 12;
                break;
              }
              _msg9 = "Front id is required";
              return _context18.abrupt("return", this.services.errorFunction(req, res, _msg9));
            case 12:
              if (!(files && !files.front_id)) {
                _context18.next = 15;
                break;
              }
              _msg10 = "Front id is required";
              return _context18.abrupt("return", this.services.errorFunction(req, res, _msg10));
            case 15:
              if (!(files && !files.back_id)) {
                _context18.next = 18;
                break;
              }
              _msg11 = "Back id is required";
              return _context18.abrupt("return", this.services.errorFunction(req, res, _msg11));
            case 18:
              if (!(files && files.front_id && files.front_id.length > 0)) {
                _context18.next = 24;
                break;
              }
              sendData = {
                files: files.front_id,
                id: user.id,
                folder: 'Agent-Attachmets'
              };
              _context18.next = 22;
              return (0, _commonFunction.uploadFileForAll)(sendData);
            case 22:
              uploadFrontKyc = _context18.sent;
              if (uploadFrontKyc.length > 0) {
                updateAgentKyc.kyc_front_pic = uploadFrontKyc[0].file_key;
              }
            case 24:
              if (!(files && files.back_id && files.back_id.length > 0)) {
                _context18.next = 30;
                break;
              }
              _sendData2 = {
                files: files.back_id,
                id: user.id,
                folder: 'Agent-Attachmets'
              };
              _context18.next = 28;
              return (0, _commonFunction.uploadFileForAll)(_sendData2);
            case 28:
              uploadBackKyc = _context18.sent;
              if (uploadBackKyc.length > 0) {
                updateAgentKyc.kyc_back_pic = uploadBackKyc[0].file_key;
              }
            case 30:
              updateAgentKyc.is_complete_profile = _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_KYC;
              _context18.next = 33;
              return this.services.updateAgentDetail(updateAgentKyc, user.id);
            case 33:
              return _context18.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.KYC_UPLOADED, {}, _constants.RESPONSE_CODES.POST)));
            case 36:
              _context18.prev = 36;
              _context18.t0 = _context18["catch"](0);
              console.log(_context18.t0, "====error====");
              return _context18.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 40:
            case "end":
              return _context18.stop();
          }
        }, _callee18, this, [[0, 36]]);
      }));
      function uploadKyc(_x32, _x33) {
        return _uploadKyc.apply(this, arguments);
      }
      return uploadKyc;
    }())
  }, {
    key: "uploadCaptureImage",
    value: (/* upload Capture Image */function () {
      var _uploadCaptureImage = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee19(req, res) {
        var user, files, msg, _msg12, updateAgentCaptureImage, _msg13, sendData, _uploadCaptureImage2;
        return _regeneratorRuntime().wrap(function _callee19$(_context19) {
          while (1) switch (_context19.prev = _context19.next) {
            case 0:
              _context19.prev = 0;
              user = req.user, files = req.files;
              /** check email exist or not */
              if (!(user.is_complete_profile < _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_KYC)) {
                _context19.next = 5;
                break;
              }
              msg = "Please complete your kyc first.";
              return _context19.abrupt("return", this.services.errorFunction(req, res, msg));
            case 5:
              if (!(user.is_complete_profile >= _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE)) {
                _context19.next = 8;
                break;
              }
              _msg12 = "You already upload your captured image.";
              return _context19.abrupt("return", this.services.errorFunction(req, res, _msg12));
            case 8:
              updateAgentCaptureImage = {};
              if (files) {
                _context19.next = 12;
                break;
              }
              _msg13 = "Capture image is required";
              return _context19.abrupt("return", this.services.errorFunction(req, res, _msg13));
            case 12:
              if (!(files && files.length > 0)) {
                _context19.next = 18;
                break;
              }
              sendData = {
                files: files,
                id: user.id,
                folder: 'Agent-Attachmets'
              };
              _context19.next = 16;
              return (0, _commonFunction.uploadFileForAll)(sendData);
            case 16:
              _uploadCaptureImage2 = _context19.sent;
              if (_uploadCaptureImage2.length > 0) {
                updateAgentCaptureImage.captured_pic = _uploadCaptureImage2[0].file_key;
              }
            case 18:
              updateAgentCaptureImage.is_complete_profile = _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE;
              _context19.next = 21;
              return this.services.updateAgentDetail(updateAgentCaptureImage, user.id);
            case 21:
              return _context19.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.CAPTURE_IMAGE_UPLOADED, {}, _constants.RESPONSE_CODES.POST)));
            case 24:
              _context19.prev = 24;
              _context19.t0 = _context19["catch"](0);
              console.log(_context19.t0, "====error====");
              return _context19.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 28:
            case "end":
              return _context19.stop();
          }
        }, _callee19, this, [[0, 24]]);
      }));
      function uploadCaptureImage(_x34, _x35) {
        return _uploadCaptureImage.apply(this, arguments);
      }
      return uploadCaptureImage;
    }())
  }, {
    key: "docusignCompleted",
    value: (/* Docusign completed */function () {
      var _docusignCompleted = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee20(req, res) {
        var params, query, getEnvelope, updateAgentDocusign, getAgent, loginTime, payload, createData, token;
        return _regeneratorRuntime().wrap(function _callee20$(_context20) {
          while (1) switch (_context20.prev = _context20.next) {
            case 0:
              _context20.prev = 0;
              params = req.params, query = req.query;
              if (!query.envelopId) {
                _context20.next = 23;
                break;
              }
              _context20.next = 5;
              return this.AuthServices.getDosusignEnvelop(query.envelopId);
            case 5:
              getEnvelope = _context20.sent;
              if (!(getEnvelope.status == "completed")) {
                _context20.next = 22;
                break;
              }
              updateAgentDocusign = {
                is_complete_profile: _constants.AGENT_PROFILE_COMPLETE_STATUS.DOCUSIGN_COMPLETE
              };
              _context20.next = 10;
              return this.services.updateAgentDetail(updateAgentDocusign, params.agent_id);
            case 10:
              _context20.next = 12;
              return this.services.getAgentByAgentId(params.agent_id);
            case 12:
              getAgent = _context20.sent;
              loginTime = (0, _moment["default"])(new Date()).unix();
              payload = {
                id: getAgent.id,
                role_id: getAgent.role_id,
                first_name: getAgent.first_name,
                last_name: getAgent.last_name,
                email: getAgent.email,
                login_time: loginTime
              };
              createData = {
                user_id: getAgent.id,
                login_time: loginTime
              };
              _context20.next = 18;
              return this.services.createLoginTime(createData);
            case 18:
              token = (0, _jwt.refreshToken)(payload);
              res.redirect("".concat(process.env.BASE_URL, "kyc-doc/").concat(token));
              _context20.next = 23;
              break;
            case 22:
              res.redirect("".concat(process.env.BASE_URL));
            case 23:
              _context20.next = 29;
              break;
            case 25:
              _context20.prev = 25;
              _context20.t0 = _context20["catch"](0);
              console.log(_context20.t0, "=====error======");
              return _context20.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 29:
            case "end":
              return _context20.stop();
          }
        }, _callee20, this, [[0, 25]]);
      }));
      function docusignCompleted(_x36, _x37) {
        return _docusignCompleted.apply(this, arguments);
      }
      return docusignCompleted;
    }())
  }, {
    key: "getAssignedUserIds",
    value: (/* get assigned user ids acc. to auth token */function () {
      var _getAssignedUserIds = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee21(req, res) {
        var user, getUsersIds;
        return _regeneratorRuntime().wrap(function _callee21$(_context21) {
          while (1) switch (_context21.prev = _context21.next) {
            case 0:
              _context21.prev = 0;
              user = req.user;
              /** check group exist or not */
              _context21.next = 4;
              return this.services.getAssignedUserIdForAdminUser(user.id, user.role_id, user.added_by, user);
            case 4:
              getUsersIds = _context21.sent;
              return _context21.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_DATA, getUsersIds, _constants.RESPONSE_CODES.POST)));
            case 8:
              _context21.prev = 8;
              _context21.t0 = _context21["catch"](0);
              console.log(_context21.t0, "====error===");
              return _context21.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 12:
            case "end":
              return _context21.stop();
          }
        }, _callee21, this, [[0, 8]]);
      }));
      function getAssignedUserIds(_x38, _x39) {
        return _getAssignedUserIds.apply(this, arguments);
      }
      return getAssignedUserIds;
    }())
  }, {
    key: "completeProfile",
    value: (/* complete Profile */function () {
      var _completeProfile = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee22(req, res) {
        var user, msg, _msg14, _completeProfile2;
        return _regeneratorRuntime().wrap(function _callee22$(_context22) {
          while (1) switch (_context22.prev = _context22.next) {
            case 0:
              _context22.prev = 0;
              user = req.user;
              if (!(user.is_complete_profile < _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE)) {
                _context22.next = 5;
                break;
              }
              msg = "Please upload your capture image first.";
              return _context22.abrupt("return", this.services.errorFunction(req, res, msg));
            case 5:
              if (!(user.is_complete_profile >= _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_PROFILE)) {
                _context22.next = 8;
                break;
              }
              _msg14 = "You already completed your profile.";
              return _context22.abrupt("return", this.services.errorFunction(req, res, _msg14));
            case 8:
              _completeProfile2 = {
                is_complete_profile: _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_PROFILE
                // status: USER_STATUS.ACTIVE,
              };
              _context22.next = 11;
              return this.services.updateAgentDetail(_completeProfile2, user.id);
            case 11:
              return _context22.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.PROFILE_COMPLETE, {}, _constants.RESPONSE_CODES.POST)));
            case 14:
              _context22.prev = 14;
              _context22.t0 = _context22["catch"](0);
              console.log(_context22.t0, "====error====");
              return _context22.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 18:
            case "end":
              return _context22.stop();
          }
        }, _callee22, this, [[0, 14]]);
      }));
      function completeProfile(_x40, _x41) {
        return _completeProfile.apply(this, arguments);
      }
      return completeProfile;
    }())
  }, {
    key: "assignedClientList",
    value: (/* assigned client list */function () {
      var _assignedClientList = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee23(req, res) {
        var body, user, list;
        return _regeneratorRuntime().wrap(function _callee23$(_context23) {
          while (1) switch (_context23.prev = _context23.next) {
            case 0:
              _context23.prev = 0;
              body = req.body, user = req.user;
              _context23.next = 4;
              return this.services.getAssignedClientList(body, user);
            case 4:
              list = _context23.sent;
              return _context23.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_LIST, list, _constants.RESPONSE_CODES.GET)));
            case 8:
              _context23.prev = 8;
              _context23.t0 = _context23["catch"](0);
              console.log(_context23.t0, "==error===");
              return _context23.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 12:
            case "end":
              return _context23.stop();
          }
        }, _callee23, this, [[0, 8]]);
      }));
      function assignedClientList(_x42, _x43) {
        return _assignedClientList.apply(this, arguments);
      }
      return assignedClientList;
    }())
  }, {
    key: "recentActivityListForAgent",
    value: (/* Agent Recent Activity List */function () {
      var _recentActivityListForAgent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee24(req, res) {
        var user, body, getAgentRecentActivity;
        return _regeneratorRuntime().wrap(function _callee24$(_context24) {
          while (1) switch (_context24.prev = _context24.next) {
            case 0:
              _context24.prev = 0;
              user = req.user, body = req.body;
              _context24.next = 4;
              return this.services.getAgentRecentActitvity(user.id);
            case 4:
              getAgentRecentActivity = _context24.sent;
              return _context24.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_LIST, getAgentRecentActivity, _constants.RESPONSE_CODES.GET)));
            case 8:
              _context24.prev = 8;
              _context24.t0 = _context24["catch"](0);
              console.log(_context24.t0, "====error===");
              return _context24.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 12:
            case "end":
              return _context24.stop();
          }
        }, _callee24, this, [[0, 8]]);
      }));
      function recentActivityListForAgent(_x44, _x45) {
        return _recentActivityListForAgent.apply(this, arguments);
      }
      return recentActivityListForAgent;
    }())
  }, {
    key: "agentApproveReject",
    value: (/* agent profile aprove reject*/function () {
      var _agentApproveReject = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee25(req, res) {
        var body, user, getAgentDetail, msg, approveRejectStatus, message, getUpdatedAgentDetail, to, emailTemplate, subject, mailFunction;
        return _regeneratorRuntime().wrap(function _callee25$(_context25) {
          while (1) switch (_context25.prev = _context25.next) {
            case 0:
              _context25.prev = 0;
              body = req.body, user = req.user;
              _context25.next = 4;
              return this.services.getAgentByAgentId(body.agent_id);
            case 4:
              getAgentDetail = _context25.sent;
              if (getAgentDetail) {
                _context25.next = 7;
                break;
              }
              return _context25.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              ;
              if (!(getAgentDetail && getAgentDetail.deleted_at != null)) {
                _context25.next = 10;
                break;
              }
              return _context25.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 10:
              ;
              if (!(getAgentDetail && getAgentDetail.is_complete_profile == 5)) {
                _context25.next = 13;
                break;
              }
              return _context25.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)("".concat(_agent.AgentMessages.AGENT_STATUS_ALREADY, " rejected."), null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 13:
              ;
              if (!(getAgentDetail && getAgentDetail.is_complete_profile == 6)) {
                _context25.next = 16;
                break;
              }
              return _context25.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)("".concat(_agent.AgentMessages.AGENT_STATUS_ALREADY, " approved."), null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 16:
              ;
              if (!(getAgentDetail.is_complete_profile < _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE)) {
                _context25.next = 20;
                break;
              }
              msg = "Please upload your capture image first.";
              return _context25.abrupt("return", this.services.errorFunction(req, res, msg));
            case 20:
              approveRejectStatus = {
                is_complete_profile: body.status == 1 ? _constants.AGENT_PROFILE_COMPLETE_STATUS.APPROVE : _constants.AGENT_PROFILE_COMPLETE_STATUS.REJECT,
                reject_reason: body.reject_reason,
                status: body.status == 1 ? _constants.USER_STATUS.ACTIVE : _constants.USER_STATUS.PENDING
              };
              _context25.next = 23;
              return this.services.updateAgentDetail(approveRejectStatus, body.agent_id);
            case 23:
              message = body.status == 1 ? "KYC approved successfully." : "KYC rejected successfully";
              _context25.next = 26;
              return this.services.getAgentByAgentId(body.agent_id);
            case 26:
              getUpdatedAgentDetail = _context25.sent;
              to = getUpdatedAgentDetail.email;
              if (!(body.status == 1)) {
                _context25.next = 35;
                break;
              }
              _context25.next = 31;
              return (0, _kyc_approved.kycApproved)(getUpdatedAgentDetail);
            case 31:
              emailTemplate = _context25.sent;
              subject = "Congratulations! Your KYC Has Been Approved.";
              _context25.next = 39;
              break;
            case 35:
              _context25.next = 37;
              return (0, _kyc_rejected.kycRejected)(getUpdatedAgentDetail);
            case 37:
              emailTemplate = _context25.sent;
              subject = "Action Required: KYC Rejected.";
            case 39:
              mailFunction = process.env.PRODUCTION == true || process.env.PRODUCTION == "true" ? _mail["default"].sendinBlueMail : _mail["default"].sendMail;
              _context25.next = 42;
              return mailFunction(to, subject, emailTemplate);
            case 42:
              return _context25.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(message, {}, _constants.RESPONSE_CODES.POST)));
            case 45:
              _context25.prev = 45;
              _context25.t0 = _context25["catch"](0);
              console.log(_context25.t0, "====error====");
              return _context25.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 49:
            case "end":
              return _context25.stop();
          }
        }, _callee25, this, [[0, 45]]);
      }));
      function agentApproveReject(_x46, _x47) {
        return _agentApproveReject.apply(this, arguments);
      }
      return agentApproveReject;
    }())
  }, {
    key: "updateKycDetail",
    value: (/* update KYC detail */function () {
      var _updateKycDetail = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee26(req, res) {
        var body, user, files, getUserDetail, updateAgentKyc, deleteFiles, sendData, uploadFrontKyc, _sendData3, uploadBackKyc, _sendData4, _uploadBackKyc, msg;
        return _regeneratorRuntime().wrap(function _callee26$(_context26) {
          while (1) switch (_context26.prev = _context26.next) {
            case 0:
              _context26.prev = 0;
              body = req.body, user = req.user, files = req.files;
              /** check email exist or not */
              _context26.next = 4;
              return this.services.getAgentByAgentId(user.id);
            case 4:
              getUserDetail = _context26.sent;
              if (!(user.is_complete_profile == _constants.AGENT_PROFILE_COMPLETE_STATUS.REJECT)) {
                _context26.next = 38;
                break;
              }
              updateAgentKyc = {};
              deleteFiles = [];
              if (!(files && files.front_id && files.front_id.length > 0)) {
                _context26.next = 15;
                break;
              }
              sendData = {
                files: files.front_id,
                id: user.id,
                folder: 'Agent-Attachmets'
              };
              _context26.next = 12;
              return (0, _commonFunction.uploadFileForAll)(sendData);
            case 12:
              uploadFrontKyc = _context26.sent;
              if (uploadFrontKyc.length > 0) {
                updateAgentKyc.kyc_front_pic = uploadFrontKyc[0].file_key;
              }
              if (getUserDetail.kyc_front_pic) {
                deleteFiles.push(getUserDetail.kyc_front_pic);
              }
            case 15:
              if (!(files && files.back_id && files.back_id.length > 0)) {
                _context26.next = 22;
                break;
              }
              _sendData3 = {
                files: files.back_id,
                id: user.id,
                folder: 'Agent-Attachmets'
              };
              _context26.next = 19;
              return (0, _commonFunction.uploadFileForAll)(_sendData3);
            case 19:
              uploadBackKyc = _context26.sent;
              if (uploadBackKyc.length > 0) {
                updateAgentKyc.kyc_back_pic = uploadBackKyc[0].file_key;
              }
              if (getUserDetail.kyc_back_pic) {
                deleteFiles.push(getUserDetail.kyc_back_pic);
              }
            case 22:
              if (!(files && files.captured_pic && files.captured_pic.length > 0)) {
                _context26.next = 29;
                break;
              }
              _sendData4 = {
                files: files.captured_pic,
                id: user.id,
                folder: 'Agent-Attachmets'
              };
              _context26.next = 26;
              return (0, _commonFunction.uploadFileForAll)(_sendData4);
            case 26:
              _uploadBackKyc = _context26.sent;
              if (_uploadBackKyc.length > 0) {
                updateAgentKyc.captured_pic = _uploadBackKyc[0].file_key;
              }
              if (getUserDetail.captured_pic) {
                deleteFiles.push(getUserDetail.captured_pic);
              }
            case 29:
              if (!(deleteFiles.length > 0)) {
                _context26.next = 32;
                break;
              }
              _context26.next = 32;
              return (0, _commonFunction.s3RemoveMultipleFiles)(deleteFiles);
            case 32:
              if (body.is_finalized == 1) {
                updateAgentKyc.is_complete_profile = _constants.AGENT_PROFILE_COMPLETE_STATUS.COMPLETE_CAPTURE;
              }
              _context26.next = 35;
              return this.services.updateAgentDetail(updateAgentKyc, user.id);
            case 35:
              return _context26.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_agent.AgentMessages.KYC_DETAIL_UPDATED, {}, _constants.RESPONSE_CODES.POST)));
            case 38:
              msg = "If your KYC rejected then you can upload again documents otherwise firstly send your detail to review.";
              return _context26.abrupt("return", this.services.errorFunction(req, res, msg));
            case 40:
              _context26.next = 46;
              break;
            case 42:
              _context26.prev = 42;
              _context26.t0 = _context26["catch"](0);
              console.log(_context26.t0, "====error====");
              return _context26.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 46:
            case "end":
              return _context26.stop();
          }
        }, _callee26, this, [[0, 42]]);
      }));
      function updateKycDetail(_x48, _x49) {
        return _updateKycDetail.apply(this, arguments);
      }
      return updateKycDetail;
    }())
  }, {
    key: "getAgentClients",
    value: (/* Get agent Client List */function () {
      var _getAgentClients = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee27(req, res) {
        var params, query, user, whereCondition, getAgentDetail, getAgentAccessData;
        return _regeneratorRuntime().wrap(function _callee27$(_context27) {
          while (1) switch (_context27.prev = _context27.next) {
            case 0:
              _context27.prev = 0;
              params = req.params, query = req.query, user = req.user;
              whereCondition = {
                id: params.agent_id,
                role_id: _constants.ROLES.AGENT
              };
              _context27.next = 5;
              return this.services.getAgentDetailByAgentId(whereCondition, user);
            case 5:
              getAgentDetail = _context27.sent;
              if (getAgentDetail) {
                _context27.next = 8;
                break;
              }
              return _context27.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 8:
              ;
              _context27.next = 11;
              return this.services.getAgentAccess(params.agent_id, user);
            case 11:
              getAgentAccessData = _context27.sent;
              getAgentDetail.dataValues.is_delete_access = getAgentAccessData.is_delete_access;
              getAgentDetail.dataValues.is_edit_access = getAgentAccessData.is_edit_access;
              return _context27.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_DATA, getAgentDetail, _constants.RESPONSE_CODES.GET)));
            case 17:
              _context27.prev = 17;
              _context27.t0 = _context27["catch"](0);
              console.log(_context27.t0, "=====error======");
              return _context27.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 21:
            case "end":
              return _context27.stop();
          }
        }, _callee27, this, [[0, 17]]);
      }));
      function getAgentClients(_x50, _x51) {
        return _getAgentClients.apply(this, arguments);
      }
      return getAgentClients;
    }())
  }, {
    key: "addNoteForAgent",
    value: (/* Add agent node */function () {
      var _addNoteForAgent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee28(req, res) {
        var body, user, getAgentDetail, createNote;
        return _regeneratorRuntime().wrap(function _callee28$(_context28) {
          while (1) switch (_context28.prev = _context28.next) {
            case 0:
              _context28.prev = 0;
              body = req.body, user = req.user;
              body.added_by = user.id;
              _context28.next = 5;
              return this.services.getUserDetail(body.agent_id);
            case 5:
              getAgentDetail = _context28.sent;
              if (getAgentDetail) {
                _context28.next = 8;
                break;
              }
              return _context28.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 8:
              ;
              _context28.next = 11;
              return this.services.createAgentNote(body);
            case 11:
              createNote = _context28.sent;
              return _context28.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.NOTE_CREATED, createNote, _constants.RESPONSE_CODES.POST)));
            case 15:
              _context28.prev = 15;
              _context28.t0 = _context28["catch"](0);
              console.log(_context28.t0, "=====error======");
              return _context28.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 19:
            case "end":
              return _context28.stop();
          }
        }, _callee28, this, [[0, 15]]);
      }));
      function addNoteForAgent(_x52, _x53) {
        return _addNoteForAgent.apply(this, arguments);
      }
      return addNoteForAgent;
    }())
  }, {
    key: "getNotesOFAgent",
    value: (/* get Notes OF Agent */function () {
      var _getNotesOFAgent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee29(req, res) {
        var body, user, getAgentDetail, list;
        return _regeneratorRuntime().wrap(function _callee29$(_context29) {
          while (1) switch (_context29.prev = _context29.next) {
            case 0:
              _context29.prev = 0;
              body = req.body, user = req.user;
              _context29.next = 4;
              return this.services.getUserDetail(body.agent_id);
            case 4:
              getAgentDetail = _context29.sent;
              if (getAgentDetail) {
                _context29.next = 7;
                break;
              }
              return _context29.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.AGENT_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              ;
              _context29.next = 10;
              return this.services.getAllAgentNotes(body, user);
            case 10:
              list = _context29.sent;
              return _context29.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.GET_LIST, list, _constants.RESPONSE_CODES.GET)));
            case 14:
              _context29.prev = 14;
              _context29.t0 = _context29["catch"](0);
              console.log(_context29.t0, "==error===");
              return _context29.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 18:
            case "end":
              return _context29.stop();
          }
        }, _callee29, this, [[0, 14]]);
      }));
      function getNotesOFAgent(_x54, _x55) {
        return _getNotesOFAgent.apply(this, arguments);
      }
      return getNotesOFAgent;
    }())
  }, {
    key: "editNoteForAgent",
    value: (/* edit agent node */function () {
      var _editNoteForAgent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee30(req, res) {
        var body, params, user, getNoteDetail, updatedData, getUpdatedNote;
        return _regeneratorRuntime().wrap(function _callee30$(_context30) {
          while (1) switch (_context30.prev = _context30.next) {
            case 0:
              _context30.prev = 0;
              body = req.body, params = req.params, user = req.user;
              _context30.next = 4;
              return this.services.getNoteDetail(params.note_id);
            case 4:
              getNoteDetail = _context30.sent;
              if (getNoteDetail) {
                _context30.next = 7;
                break;
              }
              return _context30.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.NOTE_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              ;
              updatedData = {
                note: body.note
              };
              _context30.next = 11;
              return this.services.updateAgentNote(params.note_id, updatedData);
            case 11:
              _context30.next = 13;
              return this.services.getNoteDetail(params.note_id);
            case 13:
              getUpdatedNote = _context30.sent;
              return _context30.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.NOTE_UPDATED, getUpdatedNote, _constants.RESPONSE_CODES.PUT)));
            case 17:
              _context30.prev = 17;
              _context30.t0 = _context30["catch"](0);
              console.log(_context30.t0, "=====error======");
              return _context30.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 21:
            case "end":
              return _context30.stop();
          }
        }, _callee30, this, [[0, 17]]);
      }));
      function editNoteForAgent(_x56, _x57) {
        return _editNoteForAgent.apply(this, arguments);
      }
      return editNoteForAgent;
    }())
  }, {
    key: "deleteNoteForAgent",
    value: (/* delete agent node */function () {
      var _deleteNoteForAgent = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee31(req, res) {
        var params, getNoteDetail, updatedData;
        return _regeneratorRuntime().wrap(function _callee31$(_context31) {
          while (1) switch (_context31.prev = _context31.next) {
            case 0:
              _context31.prev = 0;
              params = req.params;
              _context31.next = 4;
              return this.services.getNoteDetail(params.note_id);
            case 4:
              getNoteDetail = _context31.sent;
              if (getNoteDetail) {
                _context31.next = 7;
                break;
              }
              return _context31.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_agent.AgentMessages.NOTE_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              ;
              updatedData = {
                deleted_at: (0, _moment["default"])(new Date()).unix()
              };
              _context31.next = 11;
              return this.services.updateAgentNote(params.note_id, updatedData);
            case 11:
              return _context31.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_agent.AgentMessages.NOTE_DELETED, {}, _constants.RESPONSE_CODES.DELETE)));
            case 14:
              _context31.prev = 14;
              _context31.t0 = _context31["catch"](0);
              console.log(_context31.t0, "=====error======");
              return _context31.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 18:
            case "end":
              return _context31.stop();
          }
        }, _callee31, this, [[0, 14]]);
      }));
      function deleteNoteForAgent(_x58, _x59) {
        return _deleteNoteForAgent.apply(this, arguments);
      }
      return deleteNoteForAgent;
    }())
  }]);
}();