"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _multer = _interopRequireDefault(require("multer"));
var _accountManager = _interopRequireDefault(require("./accountManager.controller"));
var _schemaValidator = _interopRequireDefault(require("../helpers/schemaValidator"));
var _accountManager2 = require("./accountManager.validator");
var _commonFunction = require("../helpers/commonFunction");
var _authorization = _interopRequireDefault(require("../helpers/authorization"));
var _clientS = require("@aws-sdk/client-s3");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var s3 = new _clientS.S3Client({
  region: process.env.AWS_REGION
});
var upload = (0, _multer["default"])({
  storage: _multer["default"].memoryStorage(),
  s3: s3
});
var AccountManager = exports["default"] = /*#__PURE__*/function () {
  function AccountManager(router, db) {
    _classCallCheck(this, AccountManager);
    this.authorization = new _authorization["default"]();
    this.router = router;
    this.db = db;
    this.accountManagerInstance = new _accountManager["default"]();
  }
  return _createClass(AccountManager, [{
    key: "routes",
    value: function () {
      var _routes = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        var _this = this;
        var userAccess;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.accountManagerInstance.init(this.db);
            case 2:
              _context.next = 4;
              return this.authorization.init(this.db);
            case 4:
              _context.next = 6;
              return (0, _commonFunction.getAccessRoles)(this.db);
            case 6:
              userAccess = _context.sent;
              _context.t0 = this.router;
              _context.next = 10;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 10:
              _context.t1 = _context.sent;
              _context.t2 = (0, _schemaValidator["default"])(_accountManager2.listAllAccountManager);
              _context.t3 = function (req, res) {
                _this.accountManagerInstance.accountManagerList(req, res);
              };
              _context.t0.post.call(_context.t0, '/accountManager/list', _context.t1, _context.t2, _context.t3);
              _context.t4 = this.router;
              _context.next = 17;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 17:
              _context.t5 = _context.sent;
              _context.t6 = (0, _schemaValidator["default"])(_accountManager2.deleteAccountManagerValidator);
              _context.t7 = function (req, res) {
                _this.accountManagerInstance.accountManagerDelete(req, res);
              };
              _context.t4.post.call(_context.t4, '/accountManager/delete', _context.t5, _context.t6, _context.t7);
              _context.t8 = this.router;
              _context.next = 24;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 24:
              _context.t9 = _context.sent;
              _context.t10 = function (req, res) {
                _this.accountManagerInstance.accountManagerDetailPage(req, res);
              };
              _context.t8.get.call(_context.t8, '/accountManager/detail/:accountManager_Id', _context.t9, _context.t10);
              _context.t11 = this.router;
              _context.next = 30;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 30:
              _context.t12 = _context.sent;
              _context.t13 = (0, _schemaValidator["default"])(_accountManager2.AssignClientToAccountManager);
              _context.t14 = function (req, res) {
                _this.accountManagerInstance.updateAccountManager(req, res);
              };
              _context.t11.post.call(_context.t11, '/accountManager/AssignClients', _context.t12, _context.t13, _context.t14);
              _context.t15 = this.router;
              _context.next = 37;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 37:
              _context.t16 = _context.sent;
              _context.t17 = function (req, res) {
                _this.accountManagerInstance.accountManagerClientList(req, res);
              };
              _context.t15.get.call(_context.t15, '/accountManager/client-list', _context.t16, _context.t17);
              _context.t18 = this.router;
              _context.next = 43;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 43:
              _context.t19 = _context.sent;
              _context.t20 = upload.array('files');
              _context.t21 = function (req, res) {
                _this.accountManagerInstance.updateAccountManagerInfo(req, res);
              };
              _context.t18.put.call(_context.t18, '/accountManager/update', _context.t19, _context.t20, _context.t21);
              _context.t22 = this.router;
              _context.next = 50;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 50:
              _context.t23 = _context.sent;
              _context.t24 = upload.array('files');
              _context.t25 = function (req, res) {
                _this.accountManagerInstance.addAccountManagerInfo(req, res);
              };
              _context.t22.post.call(_context.t22, '/accountManager/add', _context.t23, _context.t24, _context.t25);
              _context.t26 = this.router;
              _context.next = 57;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 57:
              _context.t27 = _context.sent;
              _context.t28 = (0, _schemaValidator["default"])(_accountManager2.assignClientsValidator);
              _context.t29 = function (req, res) {
                _this.accountManagerInstance.assignClientsToAccountManagers(req, res);
              };
              _context.t26.post.call(_context.t26, '/accountManager/assign-clients', _context.t27, _context.t28, _context.t29);
              _context.t30 = this.router;
              _context.next = 64;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 64:
              _context.t31 = _context.sent;
              _context.t32 = (0, _schemaValidator["default"])(_accountManager2.assignAgentsValidator);
              _context.t33 = function (req, res) {
                _this.accountManagerInstance.assignAgentsToAccountManagers(req, res);
              };
              _context.t30.post.call(_context.t30, '/accountManager/assign-agents', _context.t31, _context.t32, _context.t33);
              _context.t34 = this.router;
              _context.next = 71;
              return this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]);
            case 71:
              _context.t35 = _context.sent;
              _context.t36 = function (req, res) {
                _this.accountManagerInstance.accountManagerAgentList(req, res);
              };
              _context.t34.get.call(_context.t34, '/accountManager/agent-list', _context.t35, _context.t36);
            case 74:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function routes() {
        return _routes.apply(this, arguments);
      }
      return routes;
    }()
  }]);
}();