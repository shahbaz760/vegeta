"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _sequelize = _interopRequireDefault(require("sequelize"));
var _constants = require("../../../config/constants");
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _responseHelper = require("../../../config/responseHelper");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Op = _sequelize["default"].Op;
var AccountManager = exports["default"] = /*#__PURE__*/function () {
  function AccountManager() {
    var _this = this;
    _classCallCheck(this, AccountManager);
    // get User by Email
    _defineProperty(this, "getAccountManagerByMail", /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(email) {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _this.Models.Users.findOne({
                where: {
                  email: email
                  // role_id: ROLES.ACCOUNTMANAGER
                },
                raw: true
              });
            case 2:
              return _context.abrupt("return", _context.sent);
            case 3:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
    // create Account Manager
    _defineProperty(this, "createAccountManager", /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(body) {
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return _this.Models.Users.create(body);
            case 2:
              return _context2.abrupt("return", _context2.sent);
            case 3:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));
      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    }());
    //get Account Manager List
    _defineProperty(this, "getAccountManagersList", /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(body) {
        var havingCondition, countCondition, attributes, allAccountMangersCount, allAccountMangerCountWithoutSearch, allAccountMangers;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              havingCondition = {
                deleted_at: null,
                role_id: _constants.ROLES.ACCOUNTMANAGER
              };
              countCondition = {
                deleted_at: null,
                role_id: _constants.ROLES.ACCOUNTMANAGER
              }; // search Account Manager by First Or Last name
              if (body.search) {
                havingCondition = _defineProperty(_defineProperty(_defineProperty({}, Op.or, [{
                  userName: _defineProperty({}, Op.like, "%".concat(body.search, "%"))
                }]), "deleted_at", null), "role_id", _constants.ROLES.ACCOUNTMANAGER);
              }
              if (body.role_id == _constants.ROLES.ACCOUNTMANAGER) {
                havingCondition.id = _defineProperty({}, Op.ne, body.user_id);
                countCondition.id = _defineProperty({}, Op.ne, body.user_id);
              }
              attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "deleted_at", "role_permission_id", "created_at", "updated_at", [_sequelize["default"].literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [_sequelize["default"].literal("(SELECT Count(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND type = 2)"), "assigned_clients_count"], [_sequelize["default"].literal("\n    CASE\n      WHEN status = 0 THEN 'Pending'\n      WHEN status = 1 THEN 'Active'\n      WHEN status = 2 THEN 'Inactive'\n      ELSE 'Inactive'\n    END\n  "), 'status'], [_sequelize["default"].literal("(SELECT name FROM roles_and_permissions WHERE roles_and_permissions.id = users.role_permission_id AND roles_and_permissions.deleted_at IS NULL limit 1)"), "role_permission_name"]];
              if (body.client_id && body.client_id != 0) {
                attributes = ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "user_image", "company_name", "deleted_at", "created_at", "updated_at", [_sequelize["default"].literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [_sequelize["default"].literal("\n            CASE\n                WHEN (SELECT COUNT(*) FROM assigned_users WHERE assigned_users.account_manager_id = users.id AND deleted_at IS NULL AND user_id = ".concat(body.client_id, " AND type = 2) > 0\n                THEN 1\n                ELSE 0\n            END\n        ")), "is_assigned"], [_sequelize["default"].literal("\n    CASE\n      WHEN status = 0 THEN 'Pending'\n      WHEN status = 1 THEN 'Active'\n      WHEN status = 2 THEN 'Inactive'\n      ELSE 'Inactive'\n    END\n  "), 'status']];
                havingCondition.is_assigned = 0;
              }

              //Count of all Account Manager
              _context3.next = 8;
              return _this.Models.Users.findAll({
                attributes: attributes,
                having: havingCondition
              });
            case 8:
              allAccountMangersCount = _context3.sent;
              _context3.next = 11;
              return _this.Models.Users.count({
                where: countCondition
              });
            case 11:
              allAccountMangerCountWithoutSearch = _context3.sent;
              _context3.next = 14;
              return _this.Models.Users.findAll({
                attributes: attributes,
                include: [{
                  model: _this.Models.AssignedUsers,
                  attributes: ["id", "user_id", "type", "assigned_date", "deleted_at", [_sequelize["default"].literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = user_id)"), "userName"], [_sequelize["default"].literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"]],
                  as: "assigned_clients",
                  where: {
                    deleted_at: null
                  },
                  required: false
                }],
                having: havingCondition,
                order: [['id', 'DESC']],
                offset: parseInt(body.start) == 0 ? 0 : (parseInt(body.start) || _constants.PAGINATION.START) * (parseInt(body.limit) || _constants.PAGINATION.LIMIT) || _constants.PAGINATION.START,
                limit: body.limit == -1 ? allAccountMangersCount.length : parseInt(body.limit) || _constants.PAGINATION.LIMIT
              });
            case 14:
              allAccountMangers = _context3.sent;
              return _context3.abrupt("return", {
                list: allAccountMangers,
                total_records: allAccountMangersCount.length,
                total_count: allAccountMangerCountWithoutSearch,
                filtered_records: allAccountMangers.length
              });
            case 16:
            case "end":
              return _context3.stop();
          }
        }, _callee3);
      }));
      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    }());
    // Remove Account Manager's
    _defineProperty(this, "removeAccountManager", /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(data, Ids) {
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _this.Models.Users.update(data, {
                where: {
                  id: Ids,
                  role_id: _constants.ROLES.ACCOUNTMANAGER
                }
              });
            case 2:
            case "end":
              return _context4.stop();
          }
        }, _callee4);
      }));
      return function (_x4, _x5) {
        return _ref4.apply(this, arguments);
      };
    }());
    // get user by id
    _defineProperty(this, "getUserById", /*#__PURE__*/function () {
      var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(Id) {
        var accountManagerDetail;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return _this.Models.Users.findOne({
                attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "city", "zipcode", "user_image", "company_name", "role_permission_id", "created_at", "updated_at", [_sequelize["default"].literal("(SELECT Count(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND type = 3)"), "assigned_clients_count"], [_sequelize["default"].literal("\n      CASE\n        WHEN status = 0 THEN 'Pending'\n        WHEN status = 1 THEN 'Active'\n        WHEN status = 2 THEN 'Inactive'\n        ELSE 'Inactive'\n      END\n    "), 'status']],
                include: [{
                  model: _this.Models.AssignedUsers,
                  attributes: ["id", "user_id", "type", "assigned_date", "deleted_at", [_sequelize["default"].literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = user_id)"), "userName"], [_sequelize["default"].literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"]],
                  as: "assigned_clients",
                  where: {
                    deleted_at: null
                  },
                  required: false
                }],
                where: {
                  id: Id,
                  role_id: _constants.ROLES.ACCOUNTMANAGER
                }
              });
            case 2:
              accountManagerDetail = _context5.sent;
              return _context5.abrupt("return", accountManagerDetail);
            case 4:
            case "end":
              return _context5.stop();
          }
        }, _callee5);
      }));
      return function (_x6) {
        return _ref5.apply(this, arguments);
      };
    }());
    _defineProperty(this, "getAccountmanagerById", /*#__PURE__*/function () {
      var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(Id) {
        var accountManagerDetail;
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return _this.Models.Users.findOne({
                attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "social_id", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", "role_permission_id", "created_at", "updated_at", [_sequelize["default"].literal("(SELECT Count(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND type = 3)"), "assigned_clients_count"], [_sequelize["default"].literal("\n      CASE\n        WHEN status = 0 THEN 'Pending'\n        WHEN status = 1 THEN 'Active'\n        WHEN status = 2 THEN 'Inactive'\n        ELSE 'Inactive'\n      END\n    "), 'status']],
                include: [{
                  model: _this.Models.AssignedUsers,
                  attributes: ["id", "user_id", "account_manager_id", "type", "assigned_date", "deleted_at", [_sequelize["default"].literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = user_id)"), "userName"], [_sequelize["default"].literal("(SELECT company_name FROM users WHERE users.id = user_id)"), "company_name"], [_sequelize["default"].literal("(SELECT first_name FROM users WHERE users.id = user_id)"), "first_name"], [_sequelize["default"].literal("(SELECT last_name FROM users WHERE users.id = user_id)"), "last_name"], [_sequelize["default"].literal("(SELECT user_image FROM users WHERE users.id = user_id)"), "user_image"], [_sequelize["default"].literal("\n          CASE\n            WHEN (SELECT COUNT(*) FROM client_subscriptions \n                  WHERE client_subscriptions.client_id = user_id \n                  AND deleted_at IS NULL \n                  AND client_subscriptions.status = 1 \n                  AND client_subscriptions.is_signed_docusign = 1 \n                  LIMIT 1) > 0 THEN 'Active'\n            WHEN (SELECT COUNT(*) FROM client_subscriptions \n                  WHERE client_subscriptions.client_id = user_id \n                  AND deleted_at IS NULL \n                  AND client_subscriptions.status = 2\n                  AND client_subscriptions.is_signed_docusign = 1 \n                  LIMIT 1) > 0 THEN 'Paused'\n            WHEN (SELECT COUNT(*) FROM client_subscriptions \n                  WHERE client_subscriptions.client_id = user_id \n                  AND deleted_at IS NULL \n                  AND client_subscriptions.status = 0 \n                  AND client_subscriptions.is_signed_docusign = 0 \n                  LIMIT 1) > 0 THEN 'Pending'\n            WHEN (SELECT COUNT(*) FROM client_subscriptions \n                  WHERE client_subscriptions.client_id = user_id \n                  AND deleted_at IS NULL \n                  AND client_subscriptions.status = 1 \n                  AND client_subscriptions.is_signed_docusign = 0 \n                  AND client_subscriptions.created_at < CURRENT_DATE \n                  LIMIT 1) > 0 THEN 'Suspended'\n            WHEN (SELECT COUNT(*) FROM client_subscriptions \n                WHERE client_subscriptions.client_id = user_id \n                AND deleted_at IS NULL \n                AND client_subscriptions.status = 4 \n                AND client_subscriptions.is_signed_docusign = 1\n                LIMIT 1) > 0 THEN 'Cancelled'\n            ELSE 'Pending'\n          END\n        "), 'subcription_status'], [_sequelize["default"].literal("\n        CASE\n          WHEN status = 0 THEN 'Pending'\n          WHEN status = 1 THEN 'Active'\n          WHEN status = 2 THEN 'Inactive'\n          ELSE 'Inactive'\n        END\n      "), 'status']],
                  as: "assigned_account_manager_client",
                  where: {
                    deleted_at: null
                  },
                  required: false
                }],
                where: {
                  id: Id,
                  role_id: _constants.ROLES.ACCOUNTMANAGER
                }
              });
            case 2:
              accountManagerDetail = _context6.sent;
              return _context6.abrupt("return", accountManagerDetail);
            case 4:
            case "end":
              return _context6.stop();
          }
        }, _callee6);
      }));
      return function (_x7) {
        return _ref6.apply(this, arguments);
      };
    }());
    //get Account Manager By ID
    _defineProperty(this, "checkAccount_ManagerById", /*#__PURE__*/function () {
      var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(accManager_Id) {
        return _regeneratorRuntime().wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return _this.Models.Users.findOne({
                attributes: ["id"],
                where: {
                  id: accManager_Id,
                  deleted_at: null,
                  role_id: _constants.ROLES.ACCOUNTMANAGER
                }
              });
            case 2:
              return _context7.abrupt("return", _context7.sent);
            case 3:
            case "end":
              return _context7.stop();
          }
        }, _callee7);
      }));
      return function (_x8) {
        return _ref7.apply(this, arguments);
      };
    }());
    // get All existed Clients
    _defineProperty(this, "allClientsData", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
      return _regeneratorRuntime().wrap(function _callee8$(_context8) {
        while (1) switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return _this.Models.Users.findAll({
              attributes: ["id"],
              where: {
                deleted_at: null,
                role_id: _constants.ROLES.CLIENT
              },
              raw: true
            });
          case 2:
            return _context8.abrupt("return", _context8.sent);
          case 3:
          case "end":
            return _context8.stop();
        }
      }, _callee8);
    })));
    _defineProperty(this, "checkDefaultClientCountAccountManagerById", /*#__PURE__*/function () {
      var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(account_manager_id) {
        return _regeneratorRuntime().wrap(function _callee9$(_context9) {
          while (1) switch (_context9.prev = _context9.next) {
            case 0:
              _context9.next = 2;
              return _this.Models.AssignedUsers.count({
                where: {
                  is_default: 1,
                  user_id: account_manager_id,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  deleted_at: null
                }
              });
            case 2:
              return _context9.abrupt("return", _context9.sent);
            case 3:
            case "end":
              return _context9.stop();
          }
        }, _callee9);
      }));
      return function (_x9) {
        return _ref9.apply(this, arguments);
      };
    }());
    /** get all client list */
    _defineProperty(this, "getAllClientList", /*#__PURE__*/function () {
      var _ref10 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(query) {
        var havingCondition, account_Manager_id, attributes, getAllClientsCount, getAllClients;
        return _regeneratorRuntime().wrap(function _callee10$(_context10) {
          while (1) switch (_context10.prev = _context10.next) {
            case 0:
              havingCondition = {
                deleted_at: null,
                role_id: _constants.ROLES.CLIENT,
                is_assigned: 1
              };
              if (query.search) {
                havingCondition = _defineProperty(_defineProperty(_defineProperty(_defineProperty({}, Op.or, [{
                  userName: _defineProperty({}, Op.like, "%".concat(query.search, "%"))
                }]), "deleted_at", null), "role_id", _constants.ROLES.CLIENT), "is_assigned", 1);
              }
              if (query.type && query.type == 1) {
                havingCondition.is_assigned = _defineProperty({}, Op.ne, 1);
              }
              account_Manager_id = query.account_Manager_id;
              attributes = ["id", "role_id", "first_name", "last_name", "company_name", "user_image", "deleted_at", [_sequelize["default"].literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [_sequelize["default"].literal("\n          CASE\n              WHEN (SELECT COUNT(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND account_manager_id = ".concat(account_Manager_id, " AND type = 2) > 0\n              THEN 1\n              ELSE 0\n          END\n      ")), "is_assigned"], [_sequelize["default"].literal("(SELECT assigned_date FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND account_manager_id = ".concat(account_Manager_id, " AND type = 2 limit 1)")), "assigned_date"], [_sequelize["default"].literal("(SELECT created_at FROM client_subscriptions WHERE client_subscriptions.client_id = users.id AND client_subscriptions.status = 0 AND client_subscriptions.deleted_at IS NULL limit 1)"), "subscription_creation_date"], [_sequelize["default"].literal("\n        CASE\n          WHEN (SELECT COUNT(*) FROM client_subscriptions \n                WHERE client_subscriptions.client_id = users.id \n                AND deleted_at IS NULL \n                AND client_subscriptions.status = 1 \n                AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Active'\n          WHEN (SELECT COUNT(*) FROM client_subscriptions \n                WHERE client_subscriptions.client_id = users.id \n                AND deleted_at IS NULL \n                AND client_subscriptions.status = 2\n                AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Paused'\n          WHEN (SELECT COUNT(*) FROM client_subscriptions \n                WHERE client_subscriptions.client_id = users.id \n                AND deleted_at IS NULL \n                AND client_subscriptions.status = 3\n                AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 'Suspended'\n          WHEN (SELECT COUNT(*) FROM client_subscriptions \n                WHERE client_subscriptions.client_id = users.id \n                AND deleted_at IS NULL \n                AND client_subscriptions.status = 4 \n                AND client_subscriptions.is_signed_docusign = 1) > 0 THEN 'Pending'\n          WHEN (SELECT COUNT(*) FROM client_subscriptions \n                WHERE client_subscriptions.client_id = users.id \n                AND deleted_at IS NULL \n                AND client_subscriptions.status = 1 \n                AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 'Pending'\n          WHEN (SELECT COUNT(*) FROM client_subscriptions \n                WHERE client_subscriptions.client_id = users.id \n                AND deleted_at IS NULL \n                AND client_subscriptions.status = 0 \n                AND client_subscriptions.is_signed_docusign = 0) > 0 THEN 'Pending'\n          ELSE 'Pending'\n        END\n      "), 'subscription_status'], [_sequelize["default"].literal("\n        CASE\n          WHEN status = 0 THEN 'Pending'\n          WHEN status = 1 THEN 'Active'\n          WHEN status = 2 THEN 'Inactive'\n          ELSE 'Inactive'\n        END\n      "), 'status']];
              _context10.next = 7;
              return _this.Models.Users.findAll({
                attributes: attributes,
                having: havingCondition,
                order: [['id', 'DESC']],
                raw: true
              });
            case 7:
              getAllClientsCount = _context10.sent;
              _context10.next = 10;
              return _this.Models.Users.findAll({
                attributes: attributes,
                having: havingCondition,
                order: [['id', 'DESC']],
                raw: true,
                offset: parseInt(query.start) == 0 ? 0 : (parseInt(query.start) || _constants.PAGINATION.START) * (parseInt(query.limit) || _constants.PAGINATION.LIMIT) || _constants.PAGINATION.START,
                limit: query.limit == -1 ? getAllClientsCount.length : parseInt(query.limit) || _constants.PAGINATION.LIMIT
              });
            case 10:
              getAllClients = _context10.sent;
              return _context10.abrupt("return", {
                list: getAllClients,
                total_records: getAllClientsCount.length,
                filtered_records: getAllClients.length
              });
            case 12:
            case "end":
              return _context10.stop();
          }
        }, _callee10);
      }));
      return function (_x10) {
        return _ref10.apply(this, arguments);
      };
    }());
    // update Account Manager's
    _defineProperty(this, "updateAccountManager", /*#__PURE__*/function () {
      var _ref11 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(data, Ids) {
        return _regeneratorRuntime().wrap(function _callee11$(_context11) {
          while (1) switch (_context11.prev = _context11.next) {
            case 0:
              _context11.next = 2;
              return _this.Models.Users.update(data, {
                where: {
                  id: Ids,
                  role_id: _constants.ROLES.ACCOUNTMANAGER
                }
              });
            case 2:
            case "end":
              return _context11.stop();
          }
        }, _callee11);
      }));
      return function (_x11, _x12) {
        return _ref11.apply(this, arguments);
      };
    }());
    _defineProperty(this, "errorFunction", /*#__PURE__*/function () {
      var _ref12 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(req, res, msg) {
        return _regeneratorRuntime().wrap(function _callee12$(_context12) {
          while (1) switch (_context12.prev = _context12.next) {
            case 0:
              return _context12.abrupt("return", res.status(400).send((0, _responseHelper.errorResponse)(msg, null, _constants.RESPONSE_CODES.BAD_REQUEST)));
            case 1:
            case "end":
              return _context12.stop();
          }
        }, _callee12);
      }));
      return function (_x13, _x14, _x15) {
        return _ref12.apply(this, arguments);
      };
    }());
    _defineProperty(this, "getAccountManagerByManagerId", /*#__PURE__*/function () {
      var _ref13 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(Id, user) {
        var assinedUserCondition, getClientIds, setAttributes, getPermission, getAllClientOfAgents, accountManagerDetail;
        return _regeneratorRuntime().wrap(function _callee13$(_context13) {
          while (1) switch (_context13.prev = _context13.next) {
            case 0:
              assinedUserCondition = {
                deleted_at: null,
                type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER
              };
              getClientIds = [Id];
              if (!(user.role_id == _constants.ROLES.ACCOUNTMANAGER)) {
                _context13.next = 13;
                break;
              }
              setAttributes = ["id", "client_view", "agent_view", "deleted_at"];
              _context13.next = 6;
              return _this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
            case 6:
              getPermission = _context13.sent;
              if (!(getPermission.client_view == 1)) {
                _context13.next = 13;
                break;
              }
              _context13.next = 10;
              return _this.Models.AssignedUsers.findAll({
                attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
                where: {
                  account_manager_id: user.id,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  deleted_at: null
                },
                raw: true
              });
            case 10:
              getAllClientOfAgents = _context13.sent;
              getClientIds = getAllClientOfAgents.map(function (val) {
                return val.user_id;
              });
              assinedUserCondition = {
                deleted_at: null,
                user_id: _defineProperty({}, _sequelize["default"].Op["in"], getClientIds)
              };
            case 13:
              _context13.next = 15;
              return _this.Models.Users.findOne({
                attributes: ["id", "role_id", "first_name", "last_name", "email", "country_code", "phone_number", "address", "address2", "country", "state", "social_id", "city", "zipcode", "user_image", "company_name", "two_factor_authentication", "role_permission_id", "created_at", "updated_at", [_sequelize["default"].literal("(SELECT Count(*) FROM assigned_users WHERE assigned_users.user_id = users.id AND deleted_at IS NULL AND type = 3)"), "assigned_clients_count"], [_sequelize["default"].literal("\n      CASE\n        WHEN status = 0 THEN 'Pending'\n        WHEN status = 1 THEN 'Active'\n        WHEN status = 2 THEN 'Inactive'\n        ELSE 'Inactive'\n      END\n    "), 'status']],
                // include: [
                //   {
                //     model: this.Models.AssignedUsers,
                //     attributes: ["id", "user_id", "account_manager_id", "type", "assigned_date", "deleted_at", [sequelize.literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = assigned_account_manager_client.user_id)"), "userName"], [sequelize.literal("(SELECT company_name FROM users WHERE users.id = assigned_account_manager_client.user_id)"), "company_name"], [sequelize.literal("(SELECT first_name FROM users WHERE users.id = assigned_account_manager_client.user_id)"), "first_name"], [sequelize.literal("(SELECT last_name FROM users WHERE users.id = assigned_account_manager_client.user_id)"), "last_name"], [sequelize.literal("(SELECT user_image FROM users WHERE users.id = assigned_account_manager_client.user_id)"), "user_image"], [sequelize.literal(`
                //     CASE
                //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
                //             WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
                //             AND deleted_at IS NULL 
                //             AND client_subscriptions.status = 1 
                //             AND client_subscriptions.is_signed_docusign = 1 
                //             LIMIT 1) > 0 THEN 'Active'
                //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
                //             WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
                //             AND deleted_at IS NULL 
                //             AND client_subscriptions.status = 2
                //             AND client_subscriptions.is_signed_docusign = 1 
                //             LIMIT 1) > 0 THEN 'Paused'
                //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
                //             WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
                //             AND deleted_at IS NULL 
                //             AND client_subscriptions.status = 0 
                //             AND client_subscriptions.is_signed_docusign = 0 
                //             LIMIT 1) > 0 THEN 'Pending'
                //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
                //             WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
                //             AND deleted_at IS NULL 
                //             AND client_subscriptions.status = 1 
                //             AND client_subscriptions.is_signed_docusign = 0 
                //             AND client_subscriptions.created_at < CURRENT_DATE 
                //             LIMIT 1) > 0 THEN 'Suspended'
                //       WHEN (SELECT COUNT(*) FROM client_subscriptions 
                //           WHERE client_subscriptions.client_id = assigned_account_manager_client.user_id 
                //           AND deleted_at IS NULL 
                //           AND client_subscriptions.status = 4 
                //           AND client_subscriptions.is_signed_docusign = 1
                //           LIMIT 1) > 0 THEN 'Cancelled'
                //       ELSE 'Pending'
                //     END
                //   `), 'subcription_status'], [sequelize.literal(`
                //   CASE
                //     WHEN status = 0 THEN 'Pending'
                //     WHEN status = 1 THEN 'Active'
                //     WHEN status = 2 THEN 'Inactive'
                //     ELSE 'Inactive'
                //   END
                // `), 'status']],
                //     as: "assigned_account_manager_client",
                //     where: assinedUserCondition,
                //     required: false,
                //   },
                // ],
                where: {
                  id: Id,
                  role_id: _constants.ROLES.ACCOUNTMANAGER
                }
              });
            case 15:
              accountManagerDetail = _context13.sent;
              return _context13.abrupt("return", accountManagerDetail);
            case 17:
            case "end":
              return _context13.stop();
          }
        }, _callee13);
      }));
      return function (_x16, _x17) {
        return _ref13.apply(this, arguments);
      };
    }());
    /**Get Roles And Permissions by Id*/
    _defineProperty(this, "getAccountManagerRolePermissions", /*#__PURE__*/function () {
      var _ref14 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(permissionId, Attributes) {
        return _regeneratorRuntime().wrap(function _callee14$(_context14) {
          while (1) switch (_context14.prev = _context14.next) {
            case 0:
              return _context14.abrupt("return", _this.Models.RolesAndPermissions.findOne({
                attributes: Attributes,
                where: {
                  id: permissionId,
                  deleted_at: null
                },
                raw: true
              }));
            case 1:
            case "end":
              return _context14.stop();
          }
        }, _callee14);
      }));
      return function (_x18, _x19) {
        return _ref14.apply(this, arguments);
      };
    }());
    /** get all assigned agent list */
    _defineProperty(this, "getAllAssignedAgentList", /*#__PURE__*/function () {
      var _ref15 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee15(query, user) {
        var havingCondition, getAllClientOfManager, getClientIds, getAllAgentsOfClients, getAgentIds, setAttributes, getPermission, _getAllClientOfManager, _getClientIds, _getAllAgentsOfClients, getAllAgentsOfManager, getAssignedAgentIds, getClientsAgentIds, _getAgentIds, account_Manager_id, attributes, getAllAgentsCount, getAllAgents;
        return _regeneratorRuntime().wrap(function _callee15$(_context15) {
          while (1) switch (_context15.prev = _context15.next) {
            case 0:
              havingCondition = {
                deleted_at: null,
                role_id: _constants.ROLES.AGENT,
                is_assigned: 1
              };
              if (query.search) {
                havingCondition = _defineProperty(_defineProperty(_defineProperty(_defineProperty({}, Op.or, [{
                  userName: _defineProperty({}, Op.like, "%".concat(query.search, "%"))
                }]), "deleted_at", null), "role_id", _constants.ROLES.AGENT), "is_assigned", 1);
              }
              if (!(query.type && query.type == 1)) {
                _context15.next = 33;
                break;
              }
              havingCondition.is_assigned = _defineProperty({}, Op.ne, 1);
              _context15.next = 6;
              return _this.Models.AssignedUsers.findAll({
                attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
                where: {
                  account_manager_id: query.account_Manager_id,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  deleted_at: null
                },
                raw: true
              });
            case 6:
              getAllClientOfManager = _context15.sent;
              getClientIds = getAllClientOfManager.map(function (val) {
                return val.user_id;
              });
              _context15.next = 10;
              return _this.Models.AssignedUsers.findAll({
                attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
                where: {
                  user_id: getClientIds,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_AGENT,
                  deleted_at: null
                },
                raw: true
              });
            case 10:
              getAllAgentsOfClients = _context15.sent;
              getAgentIds = getAllAgentsOfClients.map(function (val) {
                return val.agent_id;
              }); // if(getAgentIds.length > 0) {
              //   havingCondition.id = {
              //     [Op.notIn]: getAgentIds
              //   }
              // }
              if (query.search) {
                havingCondition = _defineProperty(_defineProperty(_defineProperty(_defineProperty({
                  id: _defineProperty({}, Op.notIn, getAgentIds)
                }, Op.or, [{
                  userName: _defineProperty({}, Op.like, "%".concat(query.search, "%"))
                }]), "deleted_at", null), "role_id", _constants.ROLES.AGENT), "is_assigned", _defineProperty({}, Op.ne, 1));
              }
              setAttributes = ["id", "agent_view", "agent_delete", "deleted_at"];
              _context15.next = 16;
              return _this.getAccountManagerRolePermissions(user.role_permission_id, setAttributes);
            case 16:
              getPermission = _context15.sent;
              if (!(getPermission && getPermission.agent_view == 1)) {
                _context15.next = 33;
                break;
              }
              _context15.next = 20;
              return _this.Models.AssignedUsers.findAll({
                attribute: ["id", "type", "user_id", "account_manager_id", "deleted_at"],
                where: {
                  account_manager_id: user.id,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_ACCOUNT_MANAGER,
                  deleted_at: null
                },
                raw: true
              });
            case 20:
              _getAllClientOfManager = _context15.sent;
              _getClientIds = _getAllClientOfManager.map(function (val) {
                return val.user_id;
              });
              _context15.next = 24;
              return _this.Models.AssignedUsers.findAll({
                attribute: ["id", "type", "user_id", "agent_id", "deleted_at"],
                where: {
                  user_id: _getClientIds,
                  type: _constants.ASSIGNED_USERS.CLIENTS_TO_AGENT,
                  deleted_at: null
                },
                raw: true
              });
            case 24:
              _getAllAgentsOfClients = _context15.sent;
              _context15.next = 27;
              return _this.Models.AssignedUsers.findAll({
                attribute: ["id", "type", "account_manager_id", "agent_id", "deleted_at"],
                where: {
                  account_manager_id: user.id,
                  type: _constants.ASSIGNED_USERS.AGENTS_TO_ACCOUNT_MANAGER,
                  deleted_at: null
                },
                raw: true
              });
            case 27:
              getAllAgentsOfManager = _context15.sent;
              getAssignedAgentIds = getAllAgentsOfManager.map(function (val) {
                return val.agent_id;
              });
              getClientsAgentIds = _getAllAgentsOfClients.map(function (val) {
                return val.agent_id;
              });
              _getAgentIds = getAssignedAgentIds.concat(getClientsAgentIds);
              havingCondition = {
                id: _getAgentIds,
                deleted_at: null,
                role_id: _constants.ROLES.AGENT,
                is_assigned: _defineProperty({}, Op.ne, 1)
              };
              if (query.search) {
                havingCondition = _defineProperty(_defineProperty(_defineProperty(_defineProperty({
                  id: _getAgentIds
                }, Op.or, [{
                  userName: _defineProperty({}, Op.like, "%".concat(query.search, "%"))
                }]), "deleted_at", null), "role_id", _constants.ROLES.AGENT), "is_assigned", _defineProperty({}, Op.ne, 1));
              }
            case 33:
              account_Manager_id = +query.account_Manager_id;
              attributes = ["id", "role_id", "first_name", "last_name", "user_image", "status", "deleted_at", [_sequelize["default"].literal("(SELECT concat(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = users.id)"), "userName"], [_sequelize["default"].literal("\n          CASE\n              WHEN (SELECT COUNT(*) FROM assigned_users WHERE assigned_users.agent_id = users.id AND deleted_at IS NULL AND assigned_users.deleted_at IS NULL AND assigned_users.account_manager_id = ".concat(account_Manager_id, " AND type = 3) > 0\n              THEN 1\n              ELSE 0\n          END\n      ")), "is_assigned"], [_sequelize["default"].literal("\n        CASE\n          WHEN status = 0 THEN 'Pending'\n          WHEN status = 1 THEN 'Active'\n          WHEN status = 2 THEN 'Inactive'\n          ELSE 'Inactive'\n        END\n      "), 'status']];
              _context15.next = 37;
              return _this.Models.Users.findAll({
                attributes: attributes,
                having: havingCondition,
                order: [['id', 'DESC']],
                raw: true
              });
            case 37:
              getAllAgentsCount = _context15.sent;
              _context15.next = 40;
              return _this.Models.Users.findAll({
                attributes: attributes,
                having: havingCondition,
                order: [['id', 'DESC']],
                raw: true,
                offset: parseInt(query.start) == 0 ? 0 : (parseInt(query.start) || _constants.PAGINATION.START) * (parseInt(query.limit) || _constants.PAGINATION.LIMIT) || _constants.PAGINATION.START,
                limit: query.limit == -1 ? getAllAgentsCount.length : parseInt(query.limit) || _constants.PAGINATION.LIMIT
              });
            case 40:
              getAllAgents = _context15.sent;
              return _context15.abrupt("return", {
                list: getAllAgents,
                total_records: getAllAgentsCount.length,
                filtered_records: getAllAgents.length
              });
            case 42:
            case "end":
              return _context15.stop();
          }
        }, _callee15);
      }));
      return function (_x20, _x21) {
        return _ref15.apply(this, arguments);
      };
    }());
  }
  return _createClass(AccountManager, [{
    key: "init",
    value: function () {
      var _init = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee16(db) {
        return _regeneratorRuntime().wrap(function _callee16$(_context16) {
          while (1) switch (_context16.prev = _context16.next) {
            case 0:
              this.Models = db.models;
            case 1:
            case "end":
              return _context16.stop();
          }
        }, _callee16, this);
      }));
      function init(_x22) {
        return _init.apply(this, arguments);
      }
      return init;
    }()
  }]);
}();