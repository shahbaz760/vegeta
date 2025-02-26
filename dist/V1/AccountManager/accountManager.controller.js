"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _accountManager = _interopRequireDefault(require("./accountManager.services"));
var _bcrypt = _interopRequireDefault(require("bcrypt"));
var _constants = require("../../../config/constants");
var _responseHelper = require("../../../config/responseHelper");
var _accountManager2 = require("../../../constants/message/accountManager");
var _common = require("../../../constants/message/common");
var _jwt = require("../helpers/jwt");
var _mail = _interopRequireDefault(require("../helpers/mail"));
var _randomstring = _interopRequireDefault(require("randomstring"));
var _moment = _interopRequireDefault(require("moment"));
var _set_password = require("../EmailTemplates/set_password");
var _commonFunction = require("../helpers/commonFunction");
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
var AccountManager = exports["default"] = /*#__PURE__*/function () {
  function AccountManager() {
    _classCallCheck(this, AccountManager);
  }
  return _createClass(AccountManager, [{
    key: "init",
    value: function () {
      var _init = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(db) {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              this.services = new _accountManager["default"]();
              this.Models = db.models;
              _context.next = 4;
              return this.services.init(db);
            case 4:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function init(_x) {
        return _init.apply(this, arguments);
      }
      return init;
    }() /* add Account Manager */
  }, {
    key: "addAccountManager",
    value: (function () {
      var _addAccountManager = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(req, res) {
        var body, user, checkEmail;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              body = req.body, user = req.user;
              /** check email exist or not */
              _context2.next = 4;
              return this.services.getAccountManagerByMail(body.email);
            case 4:
              checkEmail = _context2.sent;
              if (!checkEmail) {
                _context2.next = 7;
                break;
              }
              return _context2.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ALREADY_ADDED, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              body.role_id = _constants.ROLES.ACCOUNTMANAGER;
              body.added_by = user.id;
              _context2.next = 11;
              return this.services.createAccountManager(body);
            case 11:
              return _context2.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_ADDED, null, _constants.RESPONSE_CODES.POST)));
            case 14:
              _context2.prev = 14;
              _context2.t0 = _context2["catch"](0);
              console.log(_context2.t0, "====err-r");
              return _context2.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 18:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[0, 14]]);
      }));
      function addAccountManager(_x2, _x3) {
        return _addAccountManager.apply(this, arguments);
      }
      return addAccountManager;
    }() /* account manager's list */)
  }, {
    key: "accountManagerList",
    value: (function () {
      var _accountManagerList = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(req, res) {
        var body, user, list;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              body = req.body, user = req.user;
              body.role_id = user.role_id;
              body.user_id = user.id;
              _context3.next = 6;
              return this.services.getAccountManagersList(body);
            case 6:
              list = _context3.sent;
              return _context3.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.GET_LIST, list, _constants.RESPONSE_CODES.GET)));
            case 10:
              _context3.prev = 10;
              _context3.t0 = _context3["catch"](0);
              console.log(_context3.t0, "===error==");
              return _context3.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 14:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[0, 10]]);
      }));
      function accountManagerList(_x4, _x5) {
        return _accountManagerList.apply(this, arguments);
      }
      return accountManagerList;
    }() //delete Account Manager
    )
  }, {
    key: "accountManagerDelete",
    value: function () {
      var _accountManagerDelete = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(req, res) {
        var body, updateData;
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              body = req.body;
              updateData = {
                deleted_at: (0, _moment["default"])(new Date()).unix()
              }; // await this.services.removeAccountManager(
              //   updateData,
              //   body.accountManger_id
              // );
              _context4.next = 5;
              return (0, _commonFunction.deleteUserAndItsRecords)(updateData, body.accountManger_id, this.Models);
            case 5:
              _context4.next = 7;
              return (0, _commonFunction.deleteCometChatUser)(body.accountManger_id);
            case 7:
              return _context4.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.DELETE_ACCOUNT_MANAGER, {}, _constants.RESPONSE_CODES.DELETE)));
            case 10:
              _context4.prev = 10;
              _context4.t0 = _context4["catch"](0);
              console.log("====error====", _context4.t0);
              return _context4.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 14:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this, [[0, 10]]);
      }));
      function accountManagerDelete(_x6, _x7) {
        return _accountManagerDelete.apply(this, arguments);
      }
      return accountManagerDelete;
    }() // Account Manager Detail Page
  }, {
    key: "accountManagerDetailPage",
    value: function () {
      var _accountManagerDetailPage = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(req, res) {
        var params, user, getAccountManagerDetails, setAttributes, getPermission;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              params = req.params, user = req.user;
              _context5.next = 4;
              return this.services.getAccountManagerByManagerId(params.accountManager_Id, user);
            case 4:
              getAccountManagerDetails = _context5.sent;
              if (getAccountManagerDetails) {
                _context5.next = 7;
                break;
              }
              return _context5.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              if (!(user.role_id == _constants.ROLES.ACCOUNTMANAGER)) {
                _context5.next = 13;
                break;
              }
              setAttributes = ["id", "admin_hide_info", "deleted_at"];
              _context5.next = 11;
              return this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
            case 11:
              getPermission = _context5.sent;
              if (getPermission && getPermission.admin_hide_info == 1) {
                getAccountManagerDetails.email = "*****";
                getAccountManagerDetails.phone_number = "*****";
              }
            case 13:
              return _context5.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.GET_DATA, getAccountManagerDetails, _constants.RESPONSE_CODES.GET)));
            case 16:
              _context5.prev = 16;
              _context5.t0 = _context5["catch"](0);
              console.log(_context5.t0, "====error===");
              return _context5.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 20:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this, [[0, 16]]);
      }));
      function accountManagerDetailPage(_x8, _x9) {
        return _accountManagerDetailPage.apply(this, arguments);
      }
      return accountManagerDetailPage;
    }() //Assign Clients to Account Manager
  }, {
    key: "assignClients",
    value: function () {
      var _assignClients = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(req, res) {
        var body, user, checkAccountManager, AssignClients, totalClients, clientids, i, checkAlreadyExist, getClientIds, _i, _checkAlreadyExist, checkIsAnyDefaultClient;
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.prev = 0;
              body = req.body, user = req.user;
              _context6.next = 4;
              return this.services.checkAccount_ManagerById(body.account_manager_id);
            case 4:
              checkAccountManager = _context6.sent;
              if (checkAccountManager) {
                _context6.next = 7;
                break;
              }
              return _context6.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              AssignClients = [];
              if (!(body.client_ids.length == 0)) {
                _context6.next = 26;
                break;
              }
              _context6.next = 11;
              return this.services.allClientsData();
            case 11:
              totalClients = _context6.sent;
              _context6.next = 14;
              return totalClients.map(function (client) {
                return client.id;
              });
            case 14:
              clientids = _context6.sent;
              _context6.t0 = _regeneratorRuntime().keys(clientids);
            case 16:
              if ((_context6.t1 = _context6.t0()).done) {
                _context6.next = 24;
                break;
              }
              i = _context6.t1.value;
              _context6.next = 20;
              return this.Models.AssignedUsers.findOne({
                where: {
                  user_id: body.account_manager_id,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  client_id: clientids[i]
                }
              });
            case 20:
              checkAlreadyExist = _context6.sent;
              if (!checkAlreadyExist) {
                AssignClients.push({
                  user_id: body.account_manager_id,
                  client_id: clientids[i],
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  is_default: 0,
                  assigned_date: (0, _moment["default"])(new Date()).unix()
                });
              }
              _context6.next = 16;
              break;
            case 24:
              _context6.next = 36;
              break;
            case 26:
              getClientIds = _toConsumableArray(new Set(body.client_ids));
              _context6.t2 = _regeneratorRuntime().keys(getClientIds);
            case 28:
              if ((_context6.t3 = _context6.t2()).done) {
                _context6.next = 36;
                break;
              }
              _i = _context6.t3.value;
              _context6.next = 32;
              return this.Models.AssignedUsers.findOne({
                where: {
                  user_id: body.account_manager_id,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  client_id: getClientIds[_i]
                }
              });
            case 32:
              _checkAlreadyExist = _context6.sent;
              if (!_checkAlreadyExist) {
                AssignClients.push({
                  user_id: body.account_manager_id,
                  client_id: getClientIds[_i],
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  is_default: 0,
                  assigned_date: (0, _moment["default"])(new Date()).unix()
                });
              }
              _context6.next = 28;
              break;
            case 36:
              _context6.next = 38;
              return this.services.checkDefaultClientCountAccountManagerById(body.account_manager_id);
            case 38:
              checkIsAnyDefaultClient = _context6.sent;
              if (checkIsAnyDefaultClient == 0) {
                if (AssignClients.length > 0) {
                  AssignClients.forEach(function (client, index) {
                    client.is_default = index === 0 ? 1 : 0;
                  });
                }
              }
              _context6.next = 42;
              return this.Models.AssignedUsers.bulkCreate(AssignClients);
            case 42:
              return _context6.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.CLIENTS_ASSIGNED, {}, _constants.RESPONSE_CODES.POST)));
            case 45:
              _context6.prev = 45;
              _context6.t4 = _context6["catch"](0);
              return _context6.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 48:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this, [[0, 45]]);
      }));
      function assignClients(_x10, _x11) {
        return _assignClients.apply(this, arguments);
      }
      return assignClients;
    }() // Client list for Account Manager
  }, {
    key: "accountManagerClientList",
    value: function () {
      var _accountManagerClientList = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(req, res) {
        var query, getAccountManagerDetails, getAllClientList;
        return _regeneratorRuntime().wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              _context7.prev = 0;
              query = req.query;
              console.log(query, "===query====");
              if (query.account_Manager_id) {
                _context7.next = 5;
                break;
              }
              return _context7.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)("Account manager id is required.", null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 5:
              if (!(query.account_Manager_id != "")) {
                _context7.next = 11;
                break;
              }
              _context7.next = 8;
              return this.services.getUserById(query.account_Manager_id);
            case 8:
              getAccountManagerDetails = _context7.sent;
              if (getAccountManagerDetails) {
                _context7.next = 11;
                break;
              }
              return _context7.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 11:
              _context7.next = 13;
              return this.services.getAllClientList(query);
            case 13:
              getAllClientList = _context7.sent;
              return _context7.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.GET_DATA, getAllClientList, _constants.RESPONSE_CODES.GET)));
            case 17:
              _context7.prev = 17;
              _context7.t0 = _context7["catch"](0);
              console.log(_context7.t0, "===error====");
              return _context7.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 21:
            case "end":
              return _context7.stop();
          }
        }, _callee7, this, [[0, 17]]);
      }));
      function accountManagerClientList(_x12, _x13) {
        return _accountManagerClientList.apply(this, arguments);
      }
      return accountManagerClientList;
    }() //update Account Manager
  }, {
    key: "updateAccountManager",
    value: function () {
      var _updateAccountManager = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(req, res) {
        var body, getAccountManagerDetails;
        return _regeneratorRuntime().wrap(function _callee8$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              _context8.prev = 0;
              body = req.body;
              _context8.next = 4;
              return this.services.getUserById(body.account_manager_id);
            case 4:
              getAccountManagerDetails = _context8.sent;
              if (getAccountManagerDetails) {
                _context8.next = 7;
                break;
              }
              return _context8.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              _context8.next = 9;
              return this.services.updateAccountManager(body, body.account_manager_id);
            case 9:
              return _context8.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.UPDATE_ACCOUNT_MANAGER, {}, _constants.RESPONSE_CODES.DELETE)));
            case 12:
              _context8.prev = 12;
              _context8.t0 = _context8["catch"](0);
              return _context8.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 15:
            case "end":
              return _context8.stop();
          }
        }, _callee8, this, [[0, 12]]);
      }));
      function updateAccountManager(_x14, _x15) {
        return _updateAccountManager.apply(this, arguments);
      }
      return updateAccountManager;
    }()
  }, {
    key: "updateAccountManagerInfo",
    value: function () {
      var _updateAccountManagerInfo = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(req, res) {
        var _this = this;
        var body, files, user, getAccountManagerDetails, sendData, uploadedProfile, getAccountManagerInfo, setAttributes, getPermission;
        return _regeneratorRuntime().wrap(function _callee10$(_context10) {
          while (1) switch (_context10.prev = _context10.next) {
            case 0:
              _context10.prev = 0;
              body = req.body, files = req.files, user = req.user;
              if (body.account_manager_id) {
                _context10.next = 4;
                break;
              }
              return _context10.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)("Account manager id is required.", null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 4:
              if (body.zipcode && body.zipcode == "" || body.zipcode == "0" || body.zipcode == "null") {
                body.zipcode = null;
              }
              _context10.next = 7;
              return this.services.getAccountManagerByManagerId(body.account_manager_id, user);
            case 7:
              getAccountManagerDetails = _context10.sent;
              if (getAccountManagerDetails) {
                _context10.next = 10;
                break;
              }
              return _context10.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 10:
              if (body.email && body.email == "*****") {
                body.email = getAccountManagerDetails.email;
              }
              if (body.phone_number && body.phone_number == "*****") {
                body.phone_number = getAccountManagerDetails.phone_number;
              }
              if (!(files && files.length > 0)) {
                _context10.next = 18;
                break;
              }
              sendData = {
                files: files,
                id: body.account_manager_id,
                folder: "Users"
              };
              _context10.next = 16;
              return (0, _commonFunction.uploadFileForAll)(sendData);
            case 16:
              uploadedProfile = _context10.sent;
              if (uploadedProfile.length > 0) {
                body.user_image = uploadedProfile[0].file_key;
              }
            case 18:
              _context10.next = 20;
              return this.services.updateAccountManager(body, body.account_manager_id);
            case 20:
              _context10.next = 22;
              return this.services.getUserById(body.account_manager_id);
            case 22:
              getAccountManagerInfo = _context10.sent;
              _context10.next = 25;
              return (0, _commonFunction.updateCometChatUser)(body.account_manager_id, {
                name: getAccountManagerInfo.first_name + " " + getAccountManagerInfo.last_name,
                avatar: getAccountManagerInfo.user_image ? process.env.BASE_IMAGE_URL + getAccountManagerInfo.user_image : "",
                metadata: {
                  "@private": {
                    email: getAccountManagerInfo.email,
                    contactNumber: getAccountManagerInfo.phone_number
                  }
                }
              }).then(function (res) {
                return res.json();
              }).then(/*#__PURE__*/function () {
                var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(json) {
                  return _regeneratorRuntime().wrap(function _callee9$(_context9) {
                    while (1) switch (_context9.prev = _context9.next) {
                      case 0:
                        console.log("User updated...", json);
                        _context9.next = 3;
                        return _this.services.updateAccountManager({
                          cometUserCreated: 1
                        }, body.account_manager_id);
                      case 3:
                      case "end":
                        return _context9.stop();
                    }
                  }, _callee9);
                }));
                return function (_x18) {
                  return _ref.apply(this, arguments);
                };
              }())["catch"](function (err) {
                return console.error("error in updating User:" + err);
              });
            case 25:
              if (!(user.role_id == _constants.ROLES.ACCOUNTMANAGER)) {
                _context10.next = 31;
                break;
              }
              setAttributes = ["id", "admin_hide_info", "deleted_at"];
              _context10.next = 29;
              return this.services.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
            case 29:
              getPermission = _context10.sent;
              if (getPermission && getPermission.admin_hide_info == 1) {
                getAccountManagerInfo.email = "*****";
                getAccountManagerInfo.phone_number = "*****";
              }
            case 31:
              return _context10.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.UPDATE_ACCOUNT_MANAGER, getAccountManagerInfo, _constants.RESPONSE_CODES.POST)));
            case 34:
              _context10.prev = 34;
              _context10.t0 = _context10["catch"](0);
              console.log(_context10.t0, "====error====");
              return _context10.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 38:
            case "end":
              return _context10.stop();
          }
        }, _callee10, this, [[0, 34]]);
      }));
      function updateAccountManagerInfo(_x16, _x17) {
        return _updateAccountManagerInfo.apply(this, arguments);
      }
      return updateAccountManagerInfo;
    }()
  }, {
    key: "addAccountManagerInfo",
    value: function () {
      var _addAccountManagerInfo = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(req, res) {
        var _this2 = this;
        var body, files, user, msg, _msg, _msg2, _msg3, checkEmail, createManager, sendData, uploadedProfile, profiledata, message, getGlobalSetting, payload, token, to, inviteUserLink, emailTemplate, subject, mailFunction;
        return _regeneratorRuntime().wrap(function _callee12$(_context12) {
          while (1) switch (_context12.prev = _context12.next) {
            case 0:
              _context12.prev = 0;
              body = req.body, files = req.files, user = req.user;
              if (body.first_name) {
                _context12.next = 5;
                break;
              }
              msg = "First name is required";
              return _context12.abrupt("return", this.services.errorFunction(req, res, msg));
            case 5:
              if (body.last_name) {
                _context12.next = 8;
                break;
              }
              _msg = "Last name is required";
              return _context12.abrupt("return", this.services.errorFunction(req, res, _msg));
            case 8:
              if (body.email) {
                _context12.next = 11;
                break;
              }
              _msg2 = "Email address is required";
              return _context12.abrupt("return", this.services.errorFunction(req, res, _msg2));
            case 11:
              body.email = body.email.toLowerCase();

              // if (!body.address) {
              //   let msg = "Address is required";
              //   return this.services.errorFunction(req, res, msg);
              // }
              if (body.role_permission_id) {
                _context12.next = 15;
                break;
              }
              _msg3 = "Role permission id is required";
              return _context12.abrupt("return", this.services.errorFunction(req, res, _msg3));
            case 15:
              if (body.zipcode && body.zipcode == "" || body.zipcode == "0" || body.zipcode == "null") {
                body.zipcode = null;
              }

              /** check email exist or not */
              _context12.next = 18;
              return this.services.getAccountManagerByMail(body.email);
            case 18:
              checkEmail = _context12.sent;
              if (!checkEmail) {
                _context12.next = 21;
                break;
              }
              return _context12.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ALREADY_ADDED, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 21:
              body.role_id = _constants.ROLES.ACCOUNTMANAGER;
              body.added_by = user.id;
              body.status = _constants.USER_STATUS.ACTIVE;
              _context12.next = 26;
              return this.services.createAccountManager(body);
            case 26:
              createManager = _context12.sent;
              _context12.next = 29;
              return (0, _commonFunction.createCometChatUser)(body.first_name + " " + body.last_name, createManager.id, _constants.COMETCHATROLES[_constants.ROLES.ACCOUNTMANAGER - 1], body.email, body.phone_number).then(function (res) {
                return res.json();
              }).then(/*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(json) {
                  return _regeneratorRuntime().wrap(function _callee11$(_context11) {
                    while (1) switch (_context11.prev = _context11.next) {
                      case 0:
                        _context11.next = 2;
                        return _this2.services.updateAccountManager({
                          cometUserCreated: 1
                        }, createManager.id);
                      case 2:
                      case "end":
                        return _context11.stop();
                    }
                  }, _callee11);
                }));
                return function (_x21) {
                  return _ref2.apply(this, arguments);
                };
              }())["catch"](function (err) {
                return console.error("error in creating Account Manager:" + err);
              });
            case 29:
              if (!(files && files.length > 0)) {
                _context12.next = 40;
                break;
              }
              sendData = {
                files: files,
                id: createManager.id,
                folder: "Users"
              };
              _context12.next = 33;
              return (0, _commonFunction.uploadFileForAll)(sendData);
            case 33:
              uploadedProfile = _context12.sent;
              if (!(uploadedProfile.length > 0)) {
                _context12.next = 40;
                break;
              }
              profiledata = {
                user_image: uploadedProfile[0].file_key
              };
              _context12.next = 38;
              return this.services.updateAccountManager(profiledata, createManager.id);
            case 38:
              _context12.next = 40;
              return (0, _commonFunction.updateCometChatUser)(createManager.id, {
                avatar: process.env.BASE_IMAGE_URL + profiledata.user_image
              });
            case 40:
              message = _accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_ADDED;
              if (!(body.is_welcome_email == 1)) {
                _context12.next = 59;
                break;
              }
              message = _accountManager2.AccountManagerMessages.INVITE_LINK;
              // const token = randomstring.generate(64);
              _context12.next = 45;
              return this.Models.GlobalSettings.findOne({
                attributes: ["id", "user_role", "is_authenticate"],
                where: {
                  user_role: 7
                },
                raw: true
              });
            case 45:
              getGlobalSetting = _context12.sent;
              payload = {
                email: body.email,
                password_setting: getGlobalSetting ? getGlobalSetting.is_authenticate : 1
              };
              /** generate token */
              token = (0, _jwt.refreshToken)(payload);
              _context12.next = 50;
              return this.Models.Users.update({
                invite_token: token
              }, {
                where: {
                  email: body.email
                }
              });
            case 50:
              to = body.email.toLowerCase();
              inviteUserLink = "".concat(process.env.BASE_URL, "set-password/").concat(token);
              _context12.next = 54;
              return (0, _set_password.setPassword)(inviteUserLink);
            case 54:
              emailTemplate = _context12.sent;
              subject = "Account Manager Invite link";
              mailFunction = process.env.PRODUCTION == true || process.env.PRODUCTION == "true" ? _mail["default"].sendinBlueMail : _mail["default"].sendMail;
              _context12.next = 59;
              return mailFunction(to, subject, emailTemplate);
            case 59:
              return _context12.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(message, {}, _constants.RESPONSE_CODES.POST)));
            case 62:
              _context12.prev = 62;
              _context12.t0 = _context12["catch"](0);
              console.log(_context12.t0, "====error====");
              return _context12.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 66:
            case "end":
              return _context12.stop();
          }
        }, _callee12, this, [[0, 62]]);
      }));
      function addAccountManagerInfo(_x19, _x20) {
        return _addAccountManagerInfo.apply(this, arguments);
      }
      return addAccountManagerInfo;
    }()
  }, {
    key: "assignClientsToAccountManagers",
    value: (/* Asign Clients To Account Manager */function () {
      var _assignClientsToAccountManagers = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(req, res) {
        var body, user, getAccountManagerDetails, assignClients, getClientIds, i, getClient, checkAlreadyExist;
        return _regeneratorRuntime().wrap(function _callee13$(_context13) {
          while (1) switch (_context13.prev = _context13.next) {
            case 0:
              _context13.prev = 0;
              body = req.body, user = req.user;
              /** check account manager exist or not */
              _context13.next = 4;
              return this.services.getUserById(body.account_manager_id);
            case 4:
              getAccountManagerDetails = _context13.sent;
              if (getAccountManagerDetails) {
                _context13.next = 7;
                break;
              }
              return _context13.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              if (!(body.client_ids.length > 0)) {
                _context13.next = 25;
                break;
              }
              assignClients = [];
              getClientIds = _toConsumableArray(new Set(body.client_ids));
              _context13.t0 = _regeneratorRuntime().keys(getClientIds);
            case 11:
              if ((_context13.t1 = _context13.t0()).done) {
                _context13.next = 23;
                break;
              }
              i = _context13.t1.value;
              _context13.next = 15;
              return this.Models.Users.findOne({
                where: {
                  id: getClientIds[i],
                  deleted_at: null,
                  role_id: _constants.ROLES.CLIENT
                },
                raw: true
              });
            case 15:
              getClient = _context13.sent;
              if (!getClient) {
                _context13.next = 21;
                break;
              }
              _context13.next = 19;
              return this.Models.AssignedUsers.findOne({
                where: {
                  account_manager_id: body.account_manager_id,
                  user_id: getClient.id,
                  deleted_at: null
                },
                raw: true
              });
            case 19:
              checkAlreadyExist = _context13.sent;
              if (!checkAlreadyExist) {
                assignClients.push({
                  user_id: getClientIds[i],
                  account_manager_id: body.account_manager_id,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  is_default: 0,
                  assigned_date: (0, _moment["default"])(new Date()).unix()
                });
              }
            case 21:
              _context13.next = 11;
              break;
            case 23:
              _context13.next = 25;
              return this.Models.AssignedUsers.bulkCreate(assignClients);
            case 25:
              return _context13.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.CLIENT_ASSINGNED, {}, _constants.RESPONSE_CODES.POST)));
            case 28:
              _context13.prev = 28;
              _context13.t2 = _context13["catch"](0);
              console.log(_context13.t2, "=====error===");
              return _context13.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 32:
            case "end":
              return _context13.stop();
          }
        }, _callee13, this, [[0, 28]]);
      }));
      function assignClientsToAccountManagers(_x22, _x23) {
        return _assignClientsToAccountManagers.apply(this, arguments);
      }
      return assignClientsToAccountManagers;
    }())
  }, {
    key: "assignAgentsToAccountManagers",
    value: (/* Asign Agents To Account Manager */function () {
      var _assignAgentsToAccountManagers = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(req, res) {
        var body, getAccountManagerDetails, assignAgents, getAgentsIds, i, getAgent, checkAlreadyExist;
        return _regeneratorRuntime().wrap(function _callee14$(_context14) {
          while (1) switch (_context14.prev = _context14.next) {
            case 0:
              _context14.prev = 0;
              body = req.body;
              /** check account manager exist or not */
              _context14.next = 4;
              return this.services.getUserById(body.account_manager_id);
            case 4:
              getAccountManagerDetails = _context14.sent;
              if (getAccountManagerDetails) {
                _context14.next = 7;
                break;
              }
              return _context14.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 7:
              if (!(body.agent_ids.length > 0)) {
                _context14.next = 25;
                break;
              }
              assignAgents = [];
              getAgentsIds = _toConsumableArray(new Set(body.agent_ids));
              _context14.t0 = _regeneratorRuntime().keys(getAgentsIds);
            case 11:
              if ((_context14.t1 = _context14.t0()).done) {
                _context14.next = 23;
                break;
              }
              i = _context14.t1.value;
              _context14.next = 15;
              return this.Models.Users.findOne({
                where: {
                  id: getAgentsIds[i],
                  deleted_at: null,
                  role_id: _constants.ROLES.AGENT
                },
                raw: true
              });
            case 15:
              getAgent = _context14.sent;
              if (!getAgent) {
                _context14.next = 21;
                break;
              }
              _context14.next = 19;
              return this.Models.AssignedUsers.findOne({
                where: {
                  agent_id: getAgent.id,
                  account_manager_id: body.account_manager_id,
                  type: _constants.ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
                  deleted_at: null
                },
                raw: true
              });
            case 19:
              checkAlreadyExist = _context14.sent;
              if (!checkAlreadyExist) {
                assignAgents.push({
                  agent_id: getAgentsIds[i],
                  account_manager_id: body.account_manager_id,
                  type: _constants.ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
                  is_default: 0,
                  assigned_date: (0, _moment["default"])(new Date()).unix()
                });
              }
            case 21:
              _context14.next = 11;
              break;
            case 23:
              _context14.next = 25;
              return this.Models.AssignedUsers.bulkCreate(assignAgents);
            case 25:
              return _context14.abrupt("return", res.status(201).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.AGENT_ASSINGNED, {}, _constants.RESPONSE_CODES.POST)));
            case 28:
              _context14.prev = 28;
              _context14.t2 = _context14["catch"](0);
              console.log(_context14.t2, "=====error===");
              return _context14.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 32:
            case "end":
              return _context14.stop();
          }
        }, _callee14, this, [[0, 28]]);
      }));
      function assignAgentsToAccountManagers(_x24, _x25) {
        return _assignAgentsToAccountManagers.apply(this, arguments);
      }
      return assignAgentsToAccountManagers;
    }())
  }, {
    key: "accountManagerAgentList",
    value: // Agent list for Account Manager
    function () {
      var _accountManagerAgentList = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee15(req, res) {
        var query, user, msg, getAccountManagerDetails, getAllAgentList;
        return _regeneratorRuntime().wrap(function _callee15$(_context15) {
          while (1) switch (_context15.prev = _context15.next) {
            case 0:
              _context15.prev = 0;
              query = req.query, user = req.user;
              if (query.account_Manager_id) {
                _context15.next = 5;
                break;
              }
              msg = "Account manager id is required.";
              return _context15.abrupt("return", this.services.errorFunction(req, res, msg));
            case 5:
              if (!(query.account_Manager_id != "")) {
                _context15.next = 11;
                break;
              }
              _context15.next = 8;
              return this.services.getUserById(query.account_Manager_id);
            case 8:
              getAccountManagerDetails = _context15.sent;
              if (getAccountManagerDetails) {
                _context15.next = 11;
                break;
              }
              return _context15.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(_accountManager2.AccountManagerMessages.ACCOUNT_MANAGER_NOT_FOUND, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 11:
              _context15.next = 13;
              return this.services.getAllAssignedAgentList(query, user);
            case 13:
              getAllAgentList = _context15.sent;
              return _context15.abrupt("return", res.status(200).send((0, _responseHelper.successResponse)(_accountManager2.AccountManagerMessages.GET_DATA, getAllAgentList, _constants.RESPONSE_CODES.GET)));
            case 17:
              _context15.prev = 17;
              _context15.t0 = _context15["catch"](0);
              console.log(_context15.t0, "===error===");
              return _context15.abrupt("return", res.status(500).send((0, _responseHelper.errorResponse)(_common.CommonMessages.ERROR, null, _constants.RESPONSE_CODES.SERVER_ERROR)));
            case 21:
            case "end":
              return _context15.stop();
          }
        }, _callee15, this, [[0, 17]]);
      }));
      function accountManagerAgentList(_x26, _x27) {
        return _accountManagerAgentList.apply(this, arguments);
      }
      return accountManagerAgentList;
    }()
  }]);
}();