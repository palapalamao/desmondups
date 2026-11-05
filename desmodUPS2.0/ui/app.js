(() => {
  var __defProp = Object.defineProperty;
  var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value2) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value2 }) : obj[key] = value2;
  var __publicField = (obj, key, value2) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value2);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value2) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value2);
  var __privateSet = (obj, member, value2, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value2) : member.set(obj, value2), value2);
  var __privateWrapper = (obj, member, setter, getter) => ({
    set _(value2) {
      __privateSet(obj, member, value2, setter);
    },
    get _() {
      return __privateGet(obj, member, getter);
    }
  });
  var __using = (stack, value2, async) => {
    if (value2 != null) {
      if (typeof value2 !== "object" && typeof value2 !== "function") __typeError("Object expected");
      var dispose, inner;
      if (async) dispose = value2[__knownSymbol("asyncDispose")];
      if (dispose === void 0) {
        dispose = value2[__knownSymbol("dispose")];
        if (async) inner = dispose;
      }
      if (typeof dispose !== "function") __typeError("Object not disposable");
      if (inner) dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
      stack.push([async, dispose, value2]);
    } else if (async) {
      stack.push([async]);
    }
    return value2;
  };
  var __callDispose = (stack, error, hasError) => {
    var E = typeof SuppressedError === "function" ? SuppressedError : function(e, s, m, _) {
      return _ = Error(m), _.name = "SuppressedError", _.error = e, _.suppressed = s, _;
    };
    var fail = (e) => error = hasError ? new E(e, error, "An error was suppressed during disposal") : (hasError = true, e);
    var next = (it) => {
      while (it = stack.pop()) {
        try {
          var result = it[1] && it[1].call(it[2]);
          if (it[0]) return Promise.resolve(result).then(next, (e) => (fail(e), next()));
        } catch (e) {
          fail(e);
        }
      }
      if (hasError) throw error;
    };
    return next();
  };

  // node_modules/haystack-core/dist/index.es.js
  var TokenType;
  (function(TokenType2) {
    TokenType2[TokenType2["eof"] = 0] = "eof";
    TokenType2[TokenType2["text"] = 1] = "text";
    TokenType2[TokenType2["paths"] = 2] = "paths";
    TokenType2[TokenType2["string"] = 3] = "string";
    TokenType2[TokenType2["number"] = 4] = "number";
    TokenType2[TokenType2["date"] = 5] = "date";
    TokenType2[TokenType2["time"] = 6] = "time";
    TokenType2[TokenType2["uri"] = 7] = "uri";
    TokenType2[TokenType2["ref"] = 8] = "ref";
    TokenType2[TokenType2["boolean"] = 9] = "boolean";
    TokenType2[TokenType2["symbol"] = 10] = "symbol";
    TokenType2[TokenType2["equals"] = 11] = "equals";
    TokenType2[TokenType2["notEquals"] = 12] = "notEquals";
    TokenType2[TokenType2["lessThan"] = 13] = "lessThan";
    TokenType2[TokenType2["lessThanOrEqual"] = 14] = "lessThanOrEqual";
    TokenType2[TokenType2["greaterThan"] = 15] = "greaterThan";
    TokenType2[TokenType2["greaterThanOrEqual"] = 16] = "greaterThanOrEqual";
    TokenType2[TokenType2["leftBrace"] = 17] = "leftBrace";
    TokenType2[TokenType2["rightBrace"] = 18] = "rightBrace";
    TokenType2[TokenType2["rel"] = 19] = "rel";
    TokenType2[TokenType2["wildcardEq"] = 20] = "wildcardEq";
  })(TokenType || (TokenType = {}));
  var TokenObj = class {
    /**
     * Contructs a new token value.
     *
     * @param type The token type.
     * @param text The token's text.
     * @param value The tokens value.
     */
    constructor(type, text2) {
      /**
       * The token type.
       */
      __publicField(this, "type");
      /**
       * The token text value.
       */
      __publicField(this, "text");
      /**
       * Flag used to identify a token object.
       */
      __publicField(this, "_isATokenObj", true);
      this.type = type;
      this.text = text2;
    }
    /**
     * @returns The text value as a paths array.
     */
    get paths() {
      return [this.text];
    }
    /**
     * Returns true if the type matches this token's type.
     *
     * @param type The token type.
     * @return True if the type matches.
     */
    is(type) {
      return this.type === type;
    }
    /**
     * Returns true if the object matches this one.
     *
     * @param type The token type.
     * @param text The text.
     * @return True if the objects are equal.
     */
    equals(token) {
      if (!isTokenObj(token)) {
        return false;
      }
      return this.type === token.type && this.text === token.text;
    }
    /**
     * @returns A string representation of the token.
     */
    toString() {
      return this.toFilter();
    }
    /**
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.text;
    }
    /**
     * @returns A JSON representation of the token.
     */
    toJSON() {
      return {
        type: TokenType[this.type],
        text: this.text
      };
    }
  };
  function isTokenObj(value2) {
    return !!(value2 && value2._isATokenObj);
  }
  var tokens = {
    eof: new TokenObj(TokenType.eof, "<eof>"),
    equals: new TokenObj(TokenType.equals, "=="),
    notEquals: new TokenObj(TokenType.notEquals, "!="),
    lessThan: new TokenObj(TokenType.lessThan, "<"),
    lessThanOrEqual: new TokenObj(TokenType.lessThanOrEqual, "<="),
    greaterThan: new TokenObj(TokenType.greaterThan, ">"),
    greaterThanOrEqual: new TokenObj(TokenType.greaterThanOrEqual, ">="),
    leftBrace: new TokenObj(TokenType.leftBrace, "("),
    rightBrace: new TokenObj(TokenType.rightBrace, ")"),
    and: new TokenObj(TokenType.text, "and"),
    or: new TokenObj(TokenType.text, "or"),
    not: new TokenObj(TokenType.text, "not"),
    wildcardEq: new TokenObj(TokenType.wildcardEq, "*==")
  };
  var Kind;
  (function(Kind2) {
    Kind2["Str"] = "str";
    Kind2["Number"] = "number";
    Kind2["Date"] = "date";
    Kind2["Time"] = "time";
    Kind2["Uri"] = "uri";
    Kind2["Ref"] = "ref";
    Kind2["Bool"] = "bool";
    Kind2["Dict"] = "dict";
    Kind2["DateTime"] = "dateTime";
    Kind2["Marker"] = "marker";
    Kind2["Remove"] = "remove";
    Kind2["NA"] = "na";
    Kind2["Coord"] = "coord";
    Kind2["XStr"] = "xstr";
    Kind2["Bin"] = "bin";
    Kind2["Symbol"] = "symbol";
    Kind2["List"] = "list";
    Kind2["Grid"] = "grid";
  })(Kind || (Kind = {}));
  var JSON_MARKER = {
    _kind: Kind.Marker
  };
  var marker;
  var HMarker = class _HMarker {
    /**
     * Constructs a new haystack marker.
     */
    constructor() {
    }
    /**
     * Makes a marker.
     *
     * @returns A marker instance.
     */
    static make() {
      return marker ?? (marker = Object.freeze(new _HMarker()));
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Marker;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return "\u2714";
    }
    /**
     * @returns The zinc encoded string.
     */
    valueOf() {
      return this.toZinc();
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return "M";
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A dict isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * Value equality check.
     *
     * @param value The marker to compare.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Marker);
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      return valueIsKind(value2, Kind.Marker) ? 0 : -1;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return JSON_MARKER;
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return "m:";
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return "marker()";
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make([this]);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  var _value, _date;
  var _HDate = class _HDate {
    /**
     * Constructs a new haystack date.
     *
     * @param value The value as a string, date object or an object
     * literal with year, month and day values.
     * @throws An error if the date is invalid.
     */
    constructor(value2) {
      /**
       * Interval value.
       */
      __privateAdd(this, _value);
      /**
       * Internal implementation.
       */
      __privateAdd(this, _date);
      if (value2 instanceof Date) {
        __privateSet(this, _value, _HDate.getDateFromDateObj(value2));
        __privateSet(this, _date, value2);
      } else if (typeof value2 === "string") {
        __privateSet(this, _value, value2);
        __privateSet(this, _date, _HDate.toJsDate(__privateGet(this, _value)));
      } else if (value2.val) {
        __privateSet(this, _value, value2.val);
        __privateSet(this, _date, _HDate.toJsDate(__privateGet(this, _value)));
      } else {
        let year = 0;
        let month = 0;
        let day = 0;
        if (value2 && value2.year) {
          const dateObj = value2;
          year = dateObj.year;
          month = dateObj.month;
          day = dateObj.day;
        }
        let date = String(year);
        date += "-" + (month < 10 ? "0" : "") + month;
        date += "-" + (day < 10 ? "0" : "") + day;
        __privateSet(this, _value, date);
        __privateSet(this, _date, _HDate.toJsDate(__privateGet(this, _value)));
        this.validate();
      }
    }
    static toJsDate(value2) {
      const date = Date.parse(value2 + "T00:00:00Z");
      if (isNaN(date)) {
        throw new Error(`Invalid Date format ${value2}`);
      }
      return new Date(date);
    }
    /**
     * Factory method for a haystack date.
     *
     * @param value The value as a string, date object or an object
     * literal with year, month and day values.
     * @returns The haystack date.
     */
    static make(value2) {
      if (valueIsKind(value2, Kind.Date)) {
        return value2;
      } else {
        return new _HDate(value2);
      }
    }
    /**
     * @returns The date value.
     */
    get value() {
      return __privateGet(this, _value);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Date;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * Value equality check.
     *
     * @param value The value property.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Date) && __privateGet(value2, _value) === __privateGet(this, _value);
    }
    /**
     * Compares two dates.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Date)) {
        return -1;
      }
      if (__privateGet(this, _value) < __privateGet(value2, _value)) {
        return -1;
      }
      if (__privateGet(this, _value) === __privateGet(value2, _value)) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return this.date.toLocaleDateString();
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * The encoding for a haystack filter is mostly zinc but contains
     * some exceptions.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.toZinc();
    }
    /**
     * @returns The date as a string.
     */
    valueOf() {
      return this.value;
    }
    /**
     * @returns A JS date object.
     */
    get date() {
      return __privateGet(this, _date);
    }
    /**
     * @return Today's date.
     */
    static now() {
      return _HDate.make(/* @__PURE__ */ new Date());
    }
    /**
     * @returns The year for the date.
     */
    get year() {
      return this.date.getUTCFullYear();
    }
    set year(year) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The month for the date.
     */
    get month() {
      return this.date.getUTCMonth() + 1;
    }
    set month(month) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The day for the date.
     */
    get day() {
      return this.date.getUTCDate();
    }
    set day(day) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * Validate the internal year, month and day variables.
     */
    validate() {
      let year;
      let month;
      let day;
      const res = /^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$/.exec(__privateGet(this, _value));
      if (res) {
        year = Number(res[1]);
        month = Number(res[2]);
        day = Number(res[3]);
      }
      if (!year || year < 1900) {
        throw new Error("Invalid year");
      }
      if (!month || month < 1 || month > 12) {
        throw new Error("Invalid month");
      }
      if (!day || day < 1 || day > 31)
        throw new Error("Invalid day");
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return __privateGet(this, _value);
    }
    /**
     * Return the date from the JS date object.
     *
     * @param date The JS date object.
     * @returns The date string.
     * @throws An error if the date can't be found.
     */
    static getDateFromDateObj(date) {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return {
        _kind: this.getKind(),
        val: __privateGet(this, _value)
      };
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `d:${this.toZinc()}`;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return this.toZinc();
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make([this]);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  _value = new WeakMap();
  _date = new WeakMap();
  var HDate = _HDate;
  var MEMOIZE_CACHES = /* @__PURE__ */ new WeakMap();
  var _cache;
  var MemoizeCache = class {
    constructor() {
      /**
       * The internal cache map.
       */
      __privateAdd(this, _cache, /* @__PURE__ */ new Map());
    }
    /**
     * Get an item from the cache.
     *
     * ```typescript
     * const myAge = getMemoizeCache(obj)?.get('age')
     * ```
     *
     * @param name name of item to retrieve.
     * @returns item or undefined.
     */
    get(name) {
      return __privateGet(this, _cache).get(name);
    }
    /**
     * Set an item in the cache.
     *
     * ```typescript
     * getMemoizeCache(obj)?.set('age', 123)
     * ```
     *
     * @param name name of cached item.
     * @param value cached item.
     * @returns The cache item.
     */
    set(name, value2) {
      __privateGet(this, _cache).set(name, value2);
      return value2;
    }
    /**
     * Return true if the item exists in the cache.
     *
      ```typescript
     * const isInCache = !!getMemoizeCache(obj)?.has('age')
     * ```
     *
     * @param name name of cached item to lookup.
     * @returns true if an item is in cache.
     */
    has(name) {
      return __privateGet(this, _cache).has(name);
    }
    /**
     * Clear all entries from the cache.
     *
     * ```typescript
     * getMemoizeCache(obj)?.clear()
     * ```
     */
    clear() {
      __privateGet(this, _cache).clear();
    }
    /**
     * Removes an item from the cache by name.
     *
     * ```typescript
     * getMemoizeCache(obj).delete('memoizedElementName')
     * ```
     *
     * @param name cached item name to remove
     * @returns true if an item is successfully removed.
     */
    remove(name) {
      return __privateGet(this, _cache).delete(name);
    }
    /**
     * Return the size of the cache.
     *
     * ```typescript
     * const size = getMemoizeCache(obj).?size ?? 0
     * ```
     *
     * @returns The size of the cache.
     */
    get size() {
      return __privateGet(this, _cache).size;
    }
    /**
     * Returns if the cache is empty.
     *
     * @returns True if the cache is empty.
     */
    isEmpty() {
      return this.size === 0;
    }
    /**
     * Return all of the cached keys.
     *
     * * ```typescript
     * const keys = getMemoizeCache(obj)?.keys()
     * ```
     *
     * @returns The cache's keys.
     */
    get keys() {
      return [...__privateGet(this, _cache).keys()];
    }
    /**
     * Return a copy of the cache as an object.
     *
     * ```typescript
     * const obj = getMemoizeCache(obj)?.toObj()
     * ```
     *
     * @returns The cached values.
     */
    toObj() {
      const obj = {};
      for (const key of this.keys) {
        obj[key] = this.get(key);
      }
      return obj;
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      if (message) {
        console.log(String(message));
      }
      const obj = {};
      for (const key of this.keys) {
        obj[key] = String(this.get(key));
      }
      console.table(obj);
      return this;
    }
  };
  _cache = new WeakMap();
  function getCache(obj) {
    let cache = MEMOIZE_CACHES.get(obj);
    if (!cache) {
      MEMOIZE_CACHES.set(obj, cache = new MemoizeCache());
    }
    return cache;
  }
  function memoize() {
    return function(target, context, descriptor) {
      let propKey = "";
      let get2;
      let value2;
      let tc39 = false;
      if (typeof context === "string") {
        propKey = context;
        get2 = descriptor?.get;
        value2 = descriptor?.value;
      } else if (context?.kind && context?.name && typeof context.name === "string") {
        tc39 = true;
        propKey = context.name;
        switch (context.kind) {
          case "getter":
            get2 = target;
            break;
          case "method":
            value2 = target;
            break;
        }
      }
      if (typeof get2 === "function") {
        const getter = function() {
          const cache = getCache(this);
          return cache.has(propKey) ? cache.get(propKey) : cache.set(propKey, get2.call(this));
        };
        return tc39 ? getter : {
          get: getter
        };
      } else if (typeof value2 === "function") {
        const method = function(...args) {
          const cache = getCache(this);
          const key = JSON.stringify({ propKey, args });
          return cache.has(key) ? cache.get(key) : cache.set(key, value2.apply(this, args));
        };
        return tc39 ? method : {
          value: method
        };
      } else {
        throw new Error("Only class methods and getters can be memoized");
      }
    };
  }
  var __decorate$3 = function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var _byId, _quantities, _units;
  var UnitDatabase = class {
    constructor() {
      /**
       * All units keyed by their ids.
       */
      __privateAdd(this, _byId, /* @__PURE__ */ new Map());
      /**
       * All units organized by quantity.
       */
      __privateAdd(this, _quantities, /* @__PURE__ */ new Map());
      /**
       * All the registered units.
       */
      __privateAdd(this, _units, /* @__PURE__ */ new Set());
    }
    /**
     * Define a unit within the database.
     *
     * @param unit The unit to define.
     */
    define(unit) {
      for (const id of unit.ids) {
        __privateGet(this, _byId).set(id, unit);
      }
      const quantity = unit.quantity;
      if (quantity) {
        let units = __privateGet(this, _quantities).get(quantity);
        if (!units) {
          units = /* @__PURE__ */ new Map();
          __privateGet(this, _quantities).set(quantity, units);
        }
        units.set(unit.name, unit);
      }
      __privateGet(this, _units).add(unit);
    }
    /**
     * Get a unit via its id or undefined if it can't be found.
     *
     * @param id The unit's id.
     * @returns The unit or undefined.
     */
    get(id) {
      return __privateGet(this, _byId).get(id);
    }
    /**
     * @returns All the registered units in the database.
     */
    get units() {
      return Object.freeze([...__privateGet(this, _units).values()]);
    }
    /**
     * @returns A list of all the quantities.
     */
    get quantities() {
      return [...__privateGet(this, _quantities).keys()];
    }
    /**
     * Returns all the units for the specified quantity.
     *
     * @param quanity The quantity to search for.
     * @returns An array of units.
     */
    getUnitsForQuantity(quanity) {
      const units = __privateGet(this, _quantities).get(quanity);
      return Object.freeze(units ? [...units.values()] : []);
    }
    /**
     * Return a unit that can be used when multiplying two numbers together.
     *
     * @param unit0 The first unit to multiply by.
     * @param unit1 The second unit to multiply by.
     * @return The unit to multiply by.
     * @throws An error if the units can't be multiplied.
     */
    multiply(unit0, unit1) {
      if (!unit0.dimensions || !unit1.dimensions) {
        throw new Error(`Cannot compute dimensionless ${unit0.name} * ${unit1.name}`);
      }
      const dim = unit0.dimensions.add(unit1.dimensions);
      const scale = unit0.scale * unit1.scale;
      const matches = this.match(dim, scale);
      if (matches.length === 1) {
        return matches[0];
      }
      const expectedName = `${unit0.name}_${unit1.name}`;
      for (const match of matches) {
        if (match.name === expectedName) {
          return match;
        }
      }
      throw new Error(`Cannot match to db ${unit0.name} * ${unit1.name}`);
    }
    /**
     * Return a unit that can be used when dividing two numbers together.
     *
     * @param unit0 The first unit to divide by.
     * @param unit1 The second unit to divide by.
     * @return The unit to divide by.
     * @throws An error if the units can't be divided.
     */
    divide(unit0, unit1) {
      if (!unit0.dimensions || !unit1.dimensions) {
        throw new Error(`Cannot compute dimensionless ${unit0.name} / ${unit1.name}`);
      }
      const dim = unit0.dimensions.subtract(unit1.dimensions);
      const scale = unit0.scale / unit1.scale;
      const matches = this.match(dim, scale);
      if (matches.length === 1) {
        return matches[0];
      }
      const expectedName = `${unit0.name}_${unit1.name}`;
      for (const match of matches) {
        if (match.name === expectedName) {
          return match;
        }
      }
      throw new Error(`Cannot match to db ${unit1.name} / ${unit1.name}`);
    }
    /**
     * Match the unit dimensions and scale against what's already registered
     * in the database.
     *
     * @param dim The dimension.
     * @param scale The scale.
     * @returns A list of matching units.
     */
    match(dim, scale) {
      const units = [];
      for (const unit of __privateGet(this, _units)) {
        if (unit.dimensions?.equals(dim) && HUnit.isApproximate(unit.scale, scale)) {
          units.push(unit);
        }
      }
      return units;
    }
  };
  _byId = new WeakMap();
  _quantities = new WeakMap();
  _units = new WeakMap();
  __decorate$3([
    memoize()
  ], UnitDatabase.prototype, "match", null);
  var UnitDimensions = class _UnitDimensions {
    constructor({ kg, m, sec, K, A, mol, cd }) {
      __publicField(this, "kg");
      __publicField(this, "m");
      __publicField(this, "sec");
      __publicField(this, "K");
      __publicField(this, "A");
      __publicField(this, "mol");
      __publicField(this, "cd");
      this.kg = kg ?? 0;
      this.m = m ?? 0;
      this.sec = sec ?? 0;
      this.K = K ?? 0;
      this.A = A ?? 0;
      this.mol = mol ?? 0;
      this.cd = cd ?? 0;
    }
    /**
     * Add this unit to another one and return the result.
     *
     * @param dim The dimension to add to this one.
     * @returns The new dimension.
     */
    add(dim) {
      return new _UnitDimensions({
        kg: this.kg + dim.kg,
        m: this.m + dim.m,
        sec: this.sec + dim.sec,
        K: this.K + dim.K,
        A: this.A + dim.A,
        mol: this.mol + dim.mol,
        cd: this.cd + dim.cd
      });
    }
    /**
     * Subtract the units from one another and return the result.
     *
     * @param dim The dimension to subtract from this one.
     * @returns The new dimension.
     */
    subtract(dim) {
      return new _UnitDimensions({
        kg: this.kg - dim.kg,
        m: this.m - dim.m,
        sec: this.sec - dim.sec,
        K: this.K - dim.K,
        A: this.A - dim.A,
        mol: this.mol - dim.mol,
        cd: this.cd - dim.cd
      });
    }
    /**
     * Dimension equality.
     *
     * @param dim The dimension to test for equality.
     * @returns True if the dimensions match.
     */
    equals(dim) {
      if (!dim) {
        return false;
      }
      return this.kg === dim.kg && this.m === dim.m && this.sec === dim.sec && this.K === dim.K && this.A === dim.A && this.mol === dim.mol && this.cd === dim.cd;
    }
    /**
     * @returns A JSON representation of the dimension.
     */
    toJSON() {
      return {
        kg: this.kg,
        m: this.m,
        sec: this.sec,
        K: this.K,
        A: this.A,
        mol: this.mol,
        cd: this.cd
      };
    }
  };
  var db;
  function getDb() {
    return db ?? (db = new UnitDatabase());
  }
  function isByteUnit(unit) {
    return unit.name === "byte" || unit.name === "kilobyte" || unit.name === "megabyte" || unit.name === "gigabyte" || unit.name === "terabyte" || unit.name === "petabyte";
  }
  function valueIsHUnit(value2) {
    return !!value2?._isHUnit;
  }
  var _quantity, _ids, _dimensions, _scale, _offset;
  var _HUnit = class _HUnit {
    constructor({ quantity, ids, dimensions, scale, offset }) {
      __privateAdd(this, _quantity);
      __privateAdd(this, _ids);
      __privateAdd(this, _dimensions);
      __privateAdd(this, _scale);
      __privateAdd(this, _offset);
      /**
       * Used for a type guard check.
       */
      __publicField(this, "_isHUnit", true);
      __privateSet(this, _quantity, quantity);
      __privateSet(this, _ids, ids);
      __privateSet(this, _dimensions, dimensions && new UnitDimensions(dimensions));
      __privateSet(this, _scale, scale);
      __privateSet(this, _offset, offset);
    }
    /**
     * Defines a unit in the database.
     *
     * @param data The unit instance or data.
     * @return The unit instance.
     * @throws An error if the unit is already registered.
     */
    static define(data) {
      const unit = valueIsHUnit(data) ? data : new _HUnit(data);
      getDb().define(unit);
      return unit;
    }
    /**
     * Return a unit from the database via its id or undefined if it can't be found.
     *
     * @param id The id of the unit to look up.
     * @returns The unit or undefined.
     */
    static get(id) {
      return getDb().get(id);
    }
    /**
     * Clear the underlying unit database.
     */
    static clearDatabase() {
      db = void 0;
    }
    /**
     * Parse the database and return all of the units.
     *
     * @param text The text from `units.txt` to parse.
     * @returns All parsed units.
     */
    static parseDatabase(text2) {
      const units = [];
      let lastQuantity = "";
      for (const line of text2.split("\n")) {
        const quantity = this.parseQuantity(line);
        if (quantity) {
          lastQuantity = quantity;
        } else {
          const unit = this.parseUnit(line);
          if (unit) {
            if (lastQuantity) {
              unit.quantity = lastQuantity;
            }
            units.push(unit);
          }
        }
      }
      return units;
    }
    /**
     * Parse some text to see if contains some quantity information.
     * Return the quantity or undefined if it can't be found.
     *
     * @param text The text to parse.
     * @returns The quantity or undefined if it can't be found.
     */
    static parseQuantity(text2) {
      const res = /^ *-- *([^(]+) */.exec(text2);
      return ((res && res[1]) ?? "").trim();
    }
    /**
     * Parse a line from `units.txt` as follows...
     *
     * unit   := <ids> [";" <dim> [";" <scale> [";" <offset>]]]
     * names  := <ids> ("," <id>)*
     * id     := <idChar>*
     * idChar := 'a'-'z' | 'A'-'Z' | '_' | '%' | '/' | any char > 128
     * dim    := <ratio> ["*" <ratio>]*   // no whitespace allowed
     * ratio  := <base> <exp>
     * base   := "kg" | "m" | "sec" | "K" | "A" | "mol" | "cd"
     * exp    := <int>
     * scale  := <float>
     * offset := <float>
     *
     * @param text The text to parse.
     * @return The unit data or undefined if no unit data is found.
     * @throws An error if unit data is found but the format is invalid.
     */
    static parseUnit(text2) {
      const [, ids, dimensions, scale, offset] = /^ *([a-zA-Z][^;]*) *;? *([^;]+)? *;? *([^;]+)? *;? *([^;]+)?/.exec(text2) ?? [];
      if (!ids) {
        return void 0;
      }
      const data = {
        ids: this.parseIds(ids),
        scale: 1,
        offset: 0
      };
      if (dimensions) {
        data.dimensions = this.parseDimensions(dimensions);
      }
      if (scale) {
        data.scale = this.parseNumber(scale);
      }
      if (offset) {
        data.offset = this.parseNumber(offset);
      }
      return data;
    }
    static parseIds(ids) {
      return ids.split(",").map((id) => id.trim());
    }
    static parseDimensions(dimensions) {
      const dimension = {};
      dimensions.split("*").forEach((dim) => {
        const [, ratio, val] = /^ *(kg|sec|mol|m|K|A|cd) *([-+]?\d+)/.exec(dim) ?? [];
        switch (ratio) {
          case "kg":
            dimension.kg = Number(val);
            break;
          case "sec":
            dimension.sec = Number(val);
            break;
          case "mol":
            dimension.mol = Number(val);
            break;
          case "m":
            dimension.m = Number(val);
            break;
          case "K":
            dimension.K = Number(val);
            break;
          case "A":
            dimension.A = Number(val);
            break;
          case "cd":
            dimension.cd = Number(val);
            break;
        }
      });
      return Object.keys(dimension).length ? new UnitDimensions(dimension) : void 0;
    }
    static parseNumber(str) {
      const num = Number(str.trim());
      if (isNaN(num) || typeof num !== "number") {
        throw new Error(`Unable to convert '${str}' to a number`);
      }
      return num;
    }
    /**
     * @returns The ids for the units.
     */
    get ids() {
      return __privateGet(this, _ids);
    }
    /**
     * @returns The unit's name.
     */
    get name() {
      return __privateGet(this, _ids)[0] ?? "";
    }
    /**
     * @returns The unit's symbol.
     */
    get symbol() {
      return __privateGet(this, _ids)[__privateGet(this, _ids).length - 1] ?? "";
    }
    /**
     * @returns The unit's scale.
     */
    get scale() {
      return __privateGet(this, _scale);
    }
    /**
     * @returns The unit's offset.
     */
    get offset() {
      return __privateGet(this, _offset);
    }
    /**
     * @returns The unit's quantity or undefined if none available.
     */
    get quantity() {
      return __privateGet(this, _quantity);
    }
    /**
     * @returns A list of all the quantities available.
     */
    static get quantities() {
      return getDb().quantities;
    }
    /**
     * Return the units for the quantity.
     *
     * @param quanity The quantity to search for.
     * @returns An array of quantities. An empty array is returned
     * if the quantity can't be found.
     */
    static getUnitsForQuantity(quanity) {
      return getDb().getUnitsForQuantity(quanity);
    }
    /**
     * @returns All the registered units.
     */
    static get units() {
      return getDb().units;
    }
    /**
     * @returns The unit's dimensions or undefined if dimensionless.
     */
    get dimensions() {
      return __privateGet(this, _dimensions);
    }
    /**
     * Return a unit that can be used when multiplying two numbers together.
     *
     * @param unit The unit to multiply.
     * @return The unit to multiply by.
     * @throws An error if the units can't be multiplied.
     */
    multiply(unit) {
      return getDb().multiply(this, unit);
    }
    /**
     * Return a unit that can be used when dividing two numbers together.
     *
     * @param unit The unit to divide.
     * @return The unit to divide by.
     * @throws An error if the units can't be divided.
     */
    divide(unit) {
      return getDb().divide(this, unit);
    }
    /**
     * @returns The unit as a JSON object.
     */
    toJSON() {
      const data = {
        ids: __privateGet(this, _ids),
        scale: __privateGet(this, _scale),
        offset: __privateGet(this, _offset)
      };
      if (__privateGet(this, _quantity)) {
        data.quantity = __privateGet(this, _quantity);
      }
      if (__privateGet(this, _dimensions)) {
        data.dimensions = __privateGet(this, _dimensions)?.toJSON();
      }
      return data;
    }
    /**
     * Equality for units.
     *
     * @param unit The value to compare against.
     * @returns True if the units are equal.
     */
    equals(unit) {
      if (!unit) {
        return false;
      }
      if (this.ids.length !== unit.ids.length) {
        return false;
      }
      for (let i = 0; i < this.ids.length; ++i) {
        if (this.ids[i] !== unit.ids[i]) {
          return false;
        }
      }
      if (__privateGet(this, _dimensions) ? !__privateGet(this, _dimensions).equals(unit.dimensions) : unit.dimensions) {
        return false;
      }
      if (!_HUnit.isApproximate(this.scale, unit.scale)) {
        return false;
      }
      if (this.offset !== unit.offset) {
        return false;
      }
      return true;
    }
    /**
     * @returns A string representation of a unit.
     */
    toString() {
      return this.symbol;
    }
    /**
     * Dump the current state of the unit database to the console output.
     */
    static inspectDb() {
      console.table(getDb().units.map((unit) => unit.toJSON()));
    }
    /**
     * Convert the unit to the new scalar.
     *
     * @param scalar The new scalar value.
     * @param to The new unit to convert too.
     * @returns The new scalar value.
     */
    convertTo(scalar2, to) {
      if (!(isByteUnit(this) && isByteUnit(to)) && !__privateGet(this, _dimensions)?.equals(to.dimensions)) {
        throw new Error(`Inconvertible units: ${this} and ${to}`);
      }
      return (scalar2 * this.scale + this.offset - to.offset) / to.scale;
    }
    /**
     * Returns true if the two numbers approximately match.
     *
     * @param a The first number.
     * @param b The second number.
     * @returns True if the two numbers match.
     */
    static isApproximate(a, b) {
      if (a === b) {
        return true;
      }
      const t = Math.min(Math.abs(a / 1e3), Math.abs(b / 1e3));
      return Math.abs(a - b) <= t;
    }
  };
  _quantity = new WeakMap();
  _ids = new WeakMap();
  _dimensions = new WeakMap();
  _scale = new WeakMap();
  _offset = new WeakMap();
  var HUnit = _HUnit;
  HUnit.define({
    ids: ["nanosecond", "ns"],
    scale: 1e-9,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["microsecond", "\xB5s"],
    scale: 1e-6,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  var millisecond = HUnit.define({
    ids: ["millisecond", "ms"],
    scale: 1e-3,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["hundredths_second", "cs"],
    scale: 0.01,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["tenths_second", "ds"],
    scale: 0.1,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["second", "sec", "s"],
    scale: 1,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["minute", "min"],
    scale: 60,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["hour", "hr", "h"],
    scale: 3600,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["day"],
    scale: 86400,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["week", "wk"],
    scale: 604800,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["julian_month", "mo"],
    scale: 2629800,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  HUnit.define({
    ids: ["year", "yr"],
    scale: 31536e3,
    offset: 0,
    dimensions: { kg: 0, m: 0, sec: 1, K: 0, A: 0, mol: 0, cd: 0 },
    quantity: "time"
  });
  var DEFAULT_PRECISION = 1;
  var zeroNoUnitsNum;
  var POSITIVE_INFINITY_ZINC = "INF";
  var NEGATIVE_INFINITY_ZINC = "-INF";
  var NOT_A_NUMBER_ZINC = "NaN";
  var _value2, _unitSymbol;
  var _HNum = class _HNum {
    /**
     * Constructs a new haystack number.
     *
     * @param value The value.
     * @param unit Optional units.
     */
    constructor(value2, unit) {
      /**
       * The numerical value.
       */
      __privateAdd(this, _value2);
      /**
       * The unit symbol for the number.
       */
      __privateAdd(this, _unitSymbol);
      __privateSet(this, _value2, value2);
      if (unit) {
        if (typeof unit === "string") {
          __privateSet(this, _unitSymbol, unit);
        } else {
          const symbol = unit.symbol;
          if (!HUnit.get(symbol)) {
            HUnit.define(unit);
          }
          __privateSet(this, _unitSymbol, symbol);
        }
      } else {
        __privateSet(this, _unitSymbol, "");
      }
    }
    /**
     * Makes a haystack number.
     *
     * @param value The value or a hayson number object.
     * @param unit Optional units.
     * @returns A haystack number.
     */
    static make(value2, unit) {
      let val = 0;
      if (typeof value2 === "number") {
        val = value2;
      } else if (valueIsKind(value2, Kind.Number)) {
        return value2;
      } else {
        const obj = value2;
        switch (typeof obj.val) {
          case "string":
            if (obj.val === POSITIVE_INFINITY_ZINC) {
              val = Number.POSITIVE_INFINITY;
            } else if (obj.val === NEGATIVE_INFINITY_ZINC) {
              val = Number.NEGATIVE_INFINITY;
            } else if (obj.val === NOT_A_NUMBER_ZINC) {
              val = Number.NaN;
            } else {
              throw new Error("Invalid hayson number string value");
            }
            break;
          case "number":
            val = obj.val;
            break;
          default:
            throw new Error("Invalid hayson number value");
        }
        unit = obj.unit;
      }
      return val === 0 && !unit ? zeroNoUnitsNum ?? Object.freeze(zeroNoUnitsNum = new _HNum(val, unit)) : new _HNum(val, unit);
    }
    /**
     * @returns The numeric value.
     */
    get value() {
      return __privateGet(this, _value2);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns Optional unit value for a number.
     */
    get unit() {
      if (!__privateGet(this, _unitSymbol)) {
        return void 0;
      }
      let unit = HUnit.get(__privateGet(this, _unitSymbol));
      if (unit) {
        return unit;
      }
      unit = new HUnit({ ids: [__privateGet(this, _unitSymbol)], scale: 1, offset: 0 });
      HUnit.define(unit);
      return unit;
    }
    set unit(unit) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Number;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * @returns The object's value as a number.
     */
    valueOf() {
      return __privateGet(this, _value2);
    }
    /**
     * Return the number as a readable string.
     *
     * @param params The number format options. Can also be a number for precision
     * to support backwards compatibility.
     * @returns A string representation of the value.
     */
    toString(options) {
      let precision = DEFAULT_PRECISION;
      let locale;
      if (typeof options === "number") {
        precision = options;
      } else if (options) {
        precision = options.precision;
        locale = options.locale;
      }
      if (this.value === Number.POSITIVE_INFINITY) {
        return POSITIVE_INFINITY_ZINC;
      } else if (this.value === Number.NEGATIVE_INFINITY) {
        return NEGATIVE_INFINITY_ZINC;
      } else if (isNaN(this.value)) {
        return NOT_A_NUMBER_ZINC;
      } else {
        const value2 = this.value.toLocaleString(locale, {
          style: "decimal",
          maximumFractionDigits: precision,
          minimumFractionDigits: 0
        });
        return __privateGet(this, _unitSymbol) ? value2 + __privateGet(this, _unitSymbol) : value2;
      }
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * The encoding for a haystack filter is mostly zinc but contains
     * some exceptions.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      if (this.value === Number.POSITIVE_INFINITY || this.value === Number.NEGATIVE_INFINITY || isNaN(this.value)) {
        throw new Error("Numeric INF, -INF and NaN not supported in filter");
      }
      return this.toZinc();
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return this.encodeToZinc(
        /*unitSeparator*/
        ""
      );
    }
    /**
     * Returns a number encoded as zinc.
     *
     * @param unitSeparator The separator to use between the unit and the number when encoding.
     * @returns The encoded number.
     */
    encodeToZinc(separator) {
      if (this.value === Number.POSITIVE_INFINITY) {
        return POSITIVE_INFINITY_ZINC;
      } else if (this.value === Number.NEGATIVE_INFINITY) {
        return NEGATIVE_INFINITY_ZINC;
      } else if (isNaN(this.value)) {
        return NOT_A_NUMBER_ZINC;
      } else {
        return __privateGet(this, _unitSymbol) ? String(this.value) + separator + __privateGet(this, _unitSymbol) : String(this.value);
      }
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      if (!valueIsKind(value2, Kind.Number)) {
        return false;
      }
      if (this.value !== value2.value && !(Number.isNaN(this.value) && Number.isNaN(value2.value))) {
        return false;
      }
      const unit = this.unit;
      return unit ? unit.equals(value2.unit) : unit === value2.unit;
    }
    /**
     * Compares two values.
     *
     * @param value The number to compare.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Number)) {
        return -1;
      }
      let value0 = this.value;
      let value1 = value2.value;
      const unit = this.unit;
      if (unit && value2.unit && !unit.equals(value2.unit)) {
        if (this.isDuration() && value2.isDuration()) {
          value0 = this.convertTo(millisecond).value;
          value1 = value2.convertTo(millisecond).value;
          if (Math.abs(value0 - value1) < Number.EPSILON) {
            value0 = value1;
          }
        } else {
          throw new Error(`${unit.symbol} <=> ${value2.unit.symbol}`);
        }
      }
      if (value0 < value1) {
        return -1;
      }
      if (value0 === value1) {
        return 0;
      }
      return 1;
    }
    /**
     * Returns true if the number is a type of duration.
     *
     * @returns True if the number is a duration.
     */
    isDuration() {
      return this.unit?.quantity === "time";
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      let val;
      if (this.value === Number.POSITIVE_INFINITY) {
        val = POSITIVE_INFINITY_ZINC;
      } else if (this.value === Number.NEGATIVE_INFINITY) {
        val = NEGATIVE_INFINITY_ZINC;
      } else if (isNaN(this.value)) {
        val = NOT_A_NUMBER_ZINC;
      } else {
        val = this.value;
      }
      if (__privateGet(this, _unitSymbol)) {
        return {
          _kind: this.getKind(),
          val,
          unit: __privateGet(this, _unitSymbol)
        };
      } else {
        if (typeof val === "string") {
          return {
            _kind: this.getKind(),
            val
          };
        } else {
          return val;
        }
      }
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `n:${this.encodeToZinc(
        /*unitSeparator*/
        " "
      )}`;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return this.toZinc();
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make([this]);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
    /**
     * Add a number to this number.
     *
     * @param num The number to add.
     * @returns The new number.
     * @throws An error if the units are incompatible.
     */
    plus(num) {
      return _HNum.make(this.value + num.value, this.checkPlusMinusUnit(num.unit, "+"));
    }
    /**
     * Subtract a number from this number.
     *
     * @param num The number to subtract.
     * @returns The new number.
     * @throws An error if the units are incompatible.
     */
    minus(num) {
      return _HNum.make(this.value - num.value, this.checkPlusMinusUnit(num.unit, "-"));
    }
    checkPlusMinusUnit(unit, symbol) {
      const thisUnit = this.unit;
      if (!thisUnit) {
        return unit;
      }
      if (!unit) {
        return thisUnit;
      }
      if (thisUnit.equals(unit)) {
        return thisUnit;
      }
      throw new Error(`Unit error: ${thisUnit} ${symbol} ${unit}`);
    }
    /**
     * Multiply this number by another.
     *
     * @param num The number to multiply by.
     * @returns The new number.
     * @throws An error if the units are incompatible.
     */
    multiply(num) {
      return _HNum.make(this.value * num.value, this.checkMultiplyUnit(num.unit));
    }
    checkMultiplyUnit(unit) {
      const thisUnit = this.unit;
      if (!thisUnit) {
        return unit;
      }
      if (!unit) {
        return thisUnit;
      }
      return thisUnit.multiply(unit);
    }
    /**
     * Divide this number by another.
     *
     * @param num The number to divide by.
     * @returns The new number.
     * @throws An error if the units are incompatible.
     */
    divide(num) {
      return _HNum.make(this.value / num.value, this.checkDivideUnit(num.unit));
    }
    checkDivideUnit(unit) {
      const thisUnit = this.unit;
      if (!thisUnit) {
        return unit;
      }
      if (!unit) {
        return thisUnit;
      }
      return thisUnit.divide(unit);
    }
    /**
     * Convert the number to another unit.
     *
     * Please note, the unit to convert to must be compatible
     * otherwise an error is thrown.
     *
     * If the current number does not have a unit then return a number
     * with the specified unit and value.
     *
     * @param unit The unit to convert too.
     * @returns The new number with the new unit.
     * @throws An error if the number can't be converted with the unit.
     */
    convertTo(unit) {
      const thisUnit = this.unit;
      return _HNum.make(thisUnit ? thisUnit.convertTo(this.value, unit) : this.value, unit);
    }
  };
  _value2 = new WeakMap();
  _unitSymbol = new WeakMap();
  var HNum = _HNum;
  var _value3, _displayName;
  var _HRef = class _HRef {
    /**
     * Constructs a new haystack ref.
     *
     * @param value The value.
     * @param displayName The optional display name.
     */
    constructor(value2, displayName) {
      /**
       * The ref's value.
       */
      __privateAdd(this, _value3);
      /**
       * The ref's display name.
       */
      __privateAdd(this, _displayName);
      if (valueIsKind(value2, Kind.Str)) {
        value2 = value2.value;
      }
      if (typeof value2 === "string") {
        if (value2.startsWith("@")) {
          value2 = value2.substring(1, value2.length);
        }
        __privateSet(this, _value3, value2);
        __privateSet(this, _displayName, displayName ?? "");
      } else {
        const obj = value2;
        __privateSet(this, _value3, obj.val);
        __privateSet(this, _displayName, obj.dis ?? "");
      }
    }
    /**
     * Makes a Haystack ref.
     *
     * @param value The value or hayson ref.
     * @param displayName Optional display string for a reference.
     * @returns A haystack ref.
     */
    static make(value2, displayName) {
      if (valueIsKind(value2, Kind.Ref)) {
        return value2;
      } else {
        return new _HRef(value2, displayName);
      }
    }
    /**
     * @returns The ref value.
     */
    get value() {
      return __privateGet(this, _value3);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The display name value in shorthand.
     */
    get dis() {
      return __privateGet(this, _displayName) || __privateGet(this, _value3);
    }
    set dis(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The display name value.
     */
    get displayName() {
      return this.dis;
    }
    set displayName(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Ref;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * The encoding for a haystack filter is mostly zinc but contains
     * some exceptions.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.toZinc(
        /*excludeDis*/
        true
      );
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the ref is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Ref) && this.value === value2.value;
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Ref)) {
        return -1;
      }
      if (this.value < value2.value) {
        return -1;
      }
      if (this.value === value2.value) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return this.toZinc();
    }
    /**
     * @returns The ref's value.
     */
    valueOf() {
      return this.value;
    }
    /**
     * Encode to zinc encoding.
     *
     * @params excludeDis Excludes the display name from the encoding.
     * @returns The encoded zinc string.
     */
    toZinc(excludeDis) {
      let zinc = `@${this.value}`;
      if (!excludeDis && __privateGet(this, _displayName)) {
        zinc += ` ${HStr.make(__privateGet(this, _displayName)).toZinc()}`;
      }
      return zinc;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      const obj = {
        _kind: this.getKind(),
        val: this.value
      };
      if (__privateGet(this, _displayName)) {
        obj.dis = __privateGet(this, _displayName);
      }
      return obj;
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `r:${this.value}${__privateGet(this, _displayName) ? ` ${__privateGet(this, _displayName)}` : ""}`;
    }
    /**
     * @returns An Axon encoded string.
     */
    toAxon() {
      return this.toZinc(
        /*excludeDis*/
        true
      );
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns A ref with no display name.
     */
    noDis() {
      return __privateGet(this, _displayName) ? _HRef.make(__privateGet(this, _value3)) : this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make([this]);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  _value3 = new WeakMap();
  _displayName = new WeakMap();
  var HRef = _HRef;
  var _value4, _date2;
  var _HTime = class _HTime {
    /**
     * Constructs a new haystack time.
     *
     * @param value The value.
     */
    constructor(value2) {
      /**
       * The string time value.
       */
      __privateAdd(this, _value4);
      /**
       * Internal implementation.
       */
      __privateAdd(this, _date2);
      if (typeof value2 === "string") {
        __privateSet(this, _value4, value2);
        __privateSet(this, _date2, _HTime.toJsDate(__privateGet(this, _value4)));
      } else if (value2 instanceof Date) {
        __privateSet(this, _date2, value2);
        __privateSet(this, _value4, _HTime.getTimeFromDateObj(__privateGet(this, _date2)));
      } else if (value2.val) {
        __privateSet(this, _value4, value2.val);
        __privateSet(this, _date2, _HTime.toJsDate(__privateGet(this, _value4)));
      } else if (typeof value2.hours === "number") {
        const obj = value2;
        __privateSet(this, _value4, _HTime.getTime(obj.hours, obj.minutes, obj.seconds || 0, obj.milliseconds || 0));
        __privateSet(this, _date2, _HTime.toJsDate(__privateGet(this, _value4)));
      } else {
        __privateSet(this, _value4, "");
        __privateSet(this, _date2, /* @__PURE__ */ new Date());
      }
      if (!__privateGet(this, _value4)) {
        throw new Error("Invalid time");
      }
    }
    static toJsDate(value2) {
      const time = Date.parse("1970-01-01T" + value2 + "Z");
      if (isNaN(time)) {
        throw new Error(`Invalid Time format ${value2}`);
      }
      return new Date(time);
    }
    /**
     * Makes a haystack time.
     *
     * @param value The value.
     * @returns A haystack time.
     */
    static make(value2) {
      if (valueIsKind(value2, Kind.Time)) {
        return value2;
      } else {
        return new _HTime(value2);
      }
    }
    /**
     * @returns The time value.
     */
    get value() {
      return __privateGet(this, _value4);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The hours in a 24 hour format.
     */
    get hours() {
      return this.date.getUTCHours();
    }
    set hours(hours) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The minutes.
     */
    get minutes() {
      return this.date.getMinutes();
    }
    set minutes(minutes) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The seconds.
     */
    get seconds() {
      return this.date.getSeconds();
    }
    set seconds(seconds) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The milliseconds.
     */
    get milliseconds() {
      return this.date.getMilliseconds();
    }
    set milliseconds(milliseconds) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Time;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * The encoding for a haystack filter is mostly zinc but contains
     * some exceptions.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.toZinc();
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Time) && __privateGet(this, _value4) === __privateGet(value2, _value4);
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Time)) {
        return -1;
      }
      if (__privateGet(this, _value4) < __privateGet(value2, _value4)) {
        return -1;
      }
      if (__privateGet(this, _value4) === __privateGet(value2, _value4)) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return __privateGet(this, _value4);
    }
    /**
     * @returns The encoded time value.
     */
    valueOf() {
      return __privateGet(this, _value4);
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return __privateGet(this, _value4);
    }
    /**
     * @returns The current time.
     */
    static now() {
      return _HTime.make(/* @__PURE__ */ new Date());
    }
    /**
     * @returns The Date for this time.
     */
    get date() {
      return __privateGet(this, _date2);
    }
    /**
     * Return the time from the JS date object.
     *
     * @param date The JS date object.
     * @returns The time string.
     * @throws An error if the time can't be found.
     */
    static getTimeFromDateObj(date) {
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      const ms = date.getUTCMilliseconds();
      return _HTime.getTime(hours, minutes, seconds, ms);
    }
    /**
     * Return the time from the JS date object.
     *
     * @param date The JS date object.
     * @returns The time string.
     * @throws An error if the time can't be found.
     */
    static getTime(hours, minutes, seconds, milliseconds) {
      let time = (hours < 10 ? "0" : "") + String(hours);
      time += ":" + (minutes < 10 ? "0" : "") + String(minutes);
      time += ":" + (seconds < 10 ? "0" : "") + String(seconds);
      if (milliseconds) {
        let nsStr = String(milliseconds);
        while (nsStr.length < 3) {
          nsStr = "0" + nsStr;
        }
        time += "." + nsStr;
      }
      return time;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return {
        _kind: this.getKind(),
        val: __privateGet(this, _value4)
      };
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `h:${__privateGet(this, _value4)}`;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return this.toZinc();
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make(this);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  _value4 = new WeakMap();
  _date2 = new WeakMap();
  var HTime = _HTime;
  var __decorate$2 = function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var HTTP_SCHEME = "http";
  var HTTP_PORT = 80;
  var HTTPS_SCHEME = "https";
  var HTTPS_PORT = 443;
  var _value5;
  var _HUri = class _HUri {
    /**
     * Constructs a new haystack URI.
     *
     * @param value The value.
     */
    constructor(value2) {
      /**
       * The URI value.
       */
      __privateAdd(this, _value5);
      __privateSet(this, _value5, value2);
    }
    /**
     * Makes a haystack URI.
     *
     * @param value The string value for the URI or a Hayson URI object.
     * @returns A haystack URI.
     */
    static make(value2) {
      if (valueIsKind(value2, Kind.Uri)) {
        return value2;
      } else {
        let val = "";
        if (typeof value2 === "string") {
          val = value2;
        } else {
          const obj = value2;
          val = obj.val;
        }
        return new _HUri(val);
      }
    }
    /**
     * @returns The URI string value.
     */
    get value() {
      return __privateGet(this, _value5);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Uri;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * The encoding for a haystack filter is mostly zinc but contains
     * some exceptions.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.toZinc();
    }
    /**
     * Value equality check.
     *
     * @param value The uri to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Uri) && this.value === value2.value;
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Uri)) {
        return -1;
      }
      if (this.value < value2.value) {
        return -1;
      }
      if (this.value === value2.value) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return this.value;
    }
    /**
     * @returns The encoded URI value.
     */
    valueOf() {
      return this.value;
    }
    /**
     * Encode to zinc encoding.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      let buf = "`";
      for (const c of this.value) {
        const code = c.charCodeAt(0);
        if (c < " " || c === "`" || code >= 128) {
          buf += "\\";
          switch (c) {
            case "`":
              buf += "`";
              break;
            default:
              let seq = code.toString(16);
              while (seq.length < 4) {
                seq = `0${seq}`;
              }
              buf += `u${seq}`;
          }
        } else {
          buf += c;
        }
      }
      buf += "`";
      return buf;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return {
        _kind: this.getKind(),
        val: this.value
      };
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `u:${this.value}`;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return this.toZinc();
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make(this);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
    /**
     * Return the scheme being used or an empty string if it can't be found.
     */
    get scheme() {
      return this.parse().scheme;
    }
    /**
     * @returns The host name or an empty string if it can't be found.
     */
    get hostname() {
      return this.parse().hostname;
    }
    /**
     * @returns The port number being used or -1 if the port number can't
     * be parsed for an unknown protocol.
     */
    get port() {
      return this.parse().port;
    }
    /**
     * @returns The pathname or an empty string if none can be found.
     */
    get pathname() {
      return this.parse().pathname;
    }
    /**
     * @returns The paths or an empty array if no paths can be found.
     */
    get paths() {
      return this.parse().pathname.split("/").filter((path2) => !!path2.length);
    }
    /**
     * @return the fragment identifier or an empty string if it can't be found.
     */
    get hash() {
      return this.parse().hash;
    }
    /**
     * @returns The whole query string.
     */
    get query() {
      return this.parse().query;
    }
    /**
     * @returns The parsed query object.
     */
    get queryParams() {
      return this.parse().query.split("&").reduce((obj, value2) => {
        const [key, val] = value2.split("=");
        if (key) {
          obj[decodeURIComponent(key)] = decodeURIComponent(val ?? "");
        }
        return obj;
      }, {});
    }
    /**
     * @returns parse the URI query and return the result.
     */
    parse() {
      const res = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(this.value);
      const scheme = (res?.[2] ?? "").toLowerCase();
      let hostname = "";
      let port = -1;
      if (scheme) {
        const hostRes = /^([^:]+)(:([0-9]+):?)?/.exec(res?.[4] ?? "");
        hostname = hostRes?.[1] ?? "";
        if (hostRes?.[3]) {
          port = Number(hostRes?.[3]);
        } else {
          if (scheme === HTTP_SCHEME) {
            port = HTTP_PORT;
          } else if (scheme === HTTPS_SCHEME) {
            port = HTTPS_PORT;
          }
        }
      }
      const pathname = res?.[5] ?? "";
      const query = res?.[7] ?? "";
      const hash = res?.[9] ?? "";
      return {
        scheme,
        hostname,
        port,
        pathname,
        query,
        hash
      };
    }
  };
  _value5 = new WeakMap();
  var HUri = _HUri;
  __decorate$2([
    memoize()
  ], HUri.prototype, "paths", null);
  __decorate$2([
    memoize()
  ], HUri.prototype, "queryParams", null);
  __decorate$2([
    memoize()
  ], HUri.prototype, "parse", null);
  var JSON_REMOVE = {
    _kind: Kind.Remove
  };
  var remove;
  var HRemove = class _HRemove {
    /**
     * Constructs a new haystack remove.
     */
    constructor() {
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Remove;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * Makes a haystack remove instance.
     *
     * @returns A haystack remove.
     */
    static make() {
      return remove ?? (remove = Object.freeze(new _HRemove()));
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return "REMOVE";
    }
    /**
     * @returns The zinc encoded string.
     */
    valueOf() {
      return this.toZinc();
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return "R";
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A dict isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Remove);
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      return valueIsKind(value2, Kind.Remove) ? 0 : -1;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return JSON_REMOVE;
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return "-:";
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return "removeMarker()";
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make(this);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  var JSON_NA = {
    _kind: Kind.NA
  };
  var na;
  var HNa = class _HNa {
    /**
     * Constructs a new haystack marker.
     */
    constructor() {
    }
    /**
     * Makes an na.
     *
     * @returns A na instance.
     */
    static make() {
      return na ?? (na = Object.freeze(new _HNa()));
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.NA;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return this.toZinc();
    }
    /**
     * @returns The zinc encoded string.
     */
    valueOf() {
      return this.toZinc();
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return "NA";
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A dict isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.NA);
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      return valueIsKind(value2, Kind.NA) ? 0 : -1;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return JSON_NA;
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return "z:";
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return "na()";
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make([this]);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  var _latitude, _longitude;
  var _HCoord = class _HCoord {
    /**
     * Constructs a new haystack coord.
     *
     * @param value An object with latitude and longitude or a Hayson coordinate object.
     * @throws An error if the latitude or longitude are invalid.
     */
    constructor(value2) {
      /**
       * Internal latitude.
       */
      __privateAdd(this, _latitude);
      /**
       * Internal longitude.
       */
      __privateAdd(this, _longitude);
      let latitude = 0;
      let longitude = 0;
      if (value2) {
        if (typeof value2.latitude === "number") {
          const obj = value2;
          latitude = obj.latitude;
          longitude = obj.longitude;
        } else {
          const obj = value2;
          latitude = obj.lat;
          longitude = obj.lng;
        }
      }
      if (latitude < -9e7 || latitude > 9e7) {
        throw new Error("Invalid lat > +/- 90");
      }
      if (longitude < -18e7 || longitude > 18e7) {
        throw new Error("Invalid lng > +/- 180");
      }
      __privateSet(this, _latitude, latitude);
      __privateSet(this, _longitude, longitude);
    }
    /**
     * Factory method for a new haystack coord.
     *
     * @param value An object with latitude and longitude or a Hayson coordinate object.
     * @returns A haystack coordinate.
     * @throws An error if the latitude or longitude are invalid.
     */
    static make(value2) {
      if (valueIsKind(value2, Kind.Coord)) {
        return value2;
      } else {
        return new _HCoord(value2);
      }
    }
    /**
     * @returns The latitude value.
     */
    get latitude() {
      return __privateGet(this, _latitude);
    }
    set latitude(latitude) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The longitude value.
     */
    get longitude() {
      return __privateGet(this, _longitude);
    }
    set longitude(longitude) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Coord;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return `latitude: ${this.latitude}, longitude: ${this.longitude}`;
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A dict isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return `C(${this.latitude},${this.longitude})`;
    }
    /**
     * Value equality check.
     *
     * @param value The value to compare.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Coord) && value2.latitude === this.latitude && value2.longitude === this.longitude;
    }
    /**
     * Compares two coords.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Coord)) {
        return -1;
      }
      const val0 = `${this.latitude}:${this.longitude}`;
      const val1 = `${value2.latitude}:${value2.longitude}`;
      if (val0 < val1) {
        return -1;
      }
      if (val0 === val1) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return {
        _kind: Kind.Coord,
        lat: this.latitude,
        lng: this.longitude
      };
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `c:${this.latitude},${this.longitude}`;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return `coord(${this.latitude},${this.longitude})`;
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make([this]);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  _latitude = new WeakMap();
  _longitude = new WeakMap();
  var HCoord = _HCoord;
  var _type, _value6;
  var _HXStr = class _HXStr {
    /**
     * Constructs a new haystack xstring.
     *
     * @param type The type or an hayson xstr object.
     * @param value The value.
     */
    constructor(type, value2) {
      /**
       * The inner type.
       */
      __privateAdd(this, _type);
      /**
       * The inner value.
       */
      __privateAdd(this, _value6);
      if (typeof type === "string") {
        __privateSet(this, _type, type);
        __privateSet(this, _value6, value2 ?? "");
      } else {
        const obj = type;
        __privateSet(this, _type, obj.type);
        __privateSet(this, _value6, obj.val ?? "");
      }
    }
    /**
     * Make a haystack xstring.
     *
     * @param type The type or an hayson xstr object.
     * @param value The value.
     * @returns A haystack xstring.
     */
    static make(type, value2) {
      if (valueIsKind(type, Kind.XStr)) {
        return type;
      } else {
        return new _HXStr(type, value2);
      }
    }
    /**
     * @returns The type value.
     */
    get type() {
      return __privateGet(this, _type);
    }
    set type(type) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value.
     */
    get value() {
      return __privateGet(this, _value6);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.XStr;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return this.toZinc();
    }
    /**
     * @returns The zinc encoded string.
     */
    valueOf() {
      return this.toZinc();
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return `${this.type}(${HStr.make(this.value).toZinc()})`;
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.XStr) && this.value === value2.value && this.type === value2.type;
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.XStr)) {
        return -1;
      }
      const str = `${this.type}:${this.value}`;
      const strVal = `${value2.type}:${value2.value}`;
      if (str < strVal) {
        return -1;
      }
      if (str === strVal) {
        return 0;
      }
      return 1;
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A dict isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return {
        _kind: this.getKind(),
        val: this.value,
        type: this.type
      };
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `x:${this.type}:${this.value}`;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return `xstr(${HStr.make(this.type).toZinc()},${HStr.make(this.value).toZinc()})`;
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make(this);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  _type = new WeakMap();
  _value6 = new WeakMap();
  var HXStr = _HXStr;
  var _value7;
  var _HSymbol = class _HSymbol {
    /**
     * Constructs a new haystack symbol.
     *
     * @param value The value.
     */
    constructor(value2) {
      /**
       * Internal implementation.
       */
      __privateAdd(this, _value7);
      __privateSet(this, _value7, value2);
    }
    /**
     * Makes a haystack symbol.
     *
     * @param value The value string or Hayson symbol object.
     * @returns A haystack symbol.
     */
    static make(value2) {
      if (valueIsKind(value2, Kind.Symbol)) {
        return value2;
      } else {
        let valStr = "";
        if (typeof value2 === "string") {
          if (value2.startsWith("^")) {
            value2 = value2.substring(1, value2.length);
          }
          valStr = value2;
        } else {
          const obj = value2;
          valStr = obj.val;
        }
        return new _HSymbol(valStr);
      }
    }
    /**
     * @returns The symbol value.
     */
    get value() {
      return __privateGet(this, _value7);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Symbol;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * The encoding for a haystack filter is mostly zinc but contains
     * some exceptions.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.toZinc();
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Symbol) && this.value === value2.value;
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Symbol)) {
        return -1;
      }
      if (this.value < value2.value) {
        return -1;
      }
      if (this.value === value2.value) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return this.value;
    }
    /**
     * @returns A encoded reference.
     */
    valueOf() {
      return this.value;
    }
    /**
     * Encode to zinc encoding.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return `^${this.value}`;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return {
        _kind: this.getKind(),
        val: this.value
      };
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `y:${this.value}`;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return this.toZinc();
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make(this);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  _value7 = new WeakMap();
  var HSymbol = _HSymbol;
  var _lex, _args, _index;
  var LocalizedError = class extends Error {
    /**
     * Constructs a new parse error.
     *
     * @param options.message The error message hard coded in english.
     * @param options.lex The lexicon key used to translate the message.
     * @param options.args Optional arguments used when translating the lexicon key.
     * @param options.index Optional index number that may be used by any parsers to show position.
     */
    constructor({ message, lex, args, index }) {
      super(message);
      __privateAdd(this, _lex);
      __privateAdd(this, _args);
      __privateAdd(this, _index);
      __privateSet(this, _lex, lex);
      __privateSet(this, _args, args);
      __privateSet(this, _index, index);
    }
    /**
     * @returns The lexicon key associated with the error. If the looked up
     * lexicon key has '%s', these will be replaced by arguments from in `args`.
     */
    get lex() {
      return __privateGet(this, _lex);
    }
    /**
     * @returns The arguments associated with the lexicon key to create a localized
     * error message.
     */
    get args() {
      return __privateGet(this, _args) ?? {};
    }
    /**
     * @returns The index number of the character from the input originally
     * associated with the error. Please note, this may return undefined if
     * no line number was originally associated with the error.
     */
    get index() {
      return __privateGet(this, _index);
    }
  };
  _lex = new WeakMap();
  _args = new WeakMap();
  _index = new WeakMap();
  var A_CHAR_CODE = "a".charCodeAt(0);
  var Z_CHAR_CODE = "z".charCodeAt(0);
  var UPPER_A_CHAR_CODE = "A".charCodeAt(0);
  var UPPER_Z_CHAR_CODE = "Z".charCodeAt(0);
  var ZERO_CHAR_CODE = "0".charCodeAt(0);
  var NINE_CHAR_CODE = "9".charCodeAt(0);
  var Scanner = class _Scanner {
    /**
     * Constructors a new lexer.
     *
     * @param input The input haystack filter string to process.
     */
    constructor(input) {
      /**
       * The input string to read from.
       */
      __publicField(this, "input");
      /**
       * The current character read from the input.
       */
      __publicField(this, "current", null);
      /**
       * The next character read from the input.
       */
      __publicField(this, "next", null);
      /**
       * The current character index from the input.
       */
      __publicField(this, "index", 0);
      this.input = input;
      this.update();
    }
    /**
     * Consume the next character.
     *
     * @returns The scanner instance.
     */
    consume() {
      ++this.index;
      this.update();
      return this;
    }
    /**
     * Expect a new line character and consume it.
     *
     * This will handle carriage return line feeds as well.
     *
     * @param id The expected id.
     * @returns The scanner instance.
     * @throws An error if a newline isn't found.
     */
    expectAndConsumeNewLine(id) {
      if (this.current === "\r" && this.next === "\n") {
        this.consume();
      }
      this.expect("\n", id);
      this.consume();
      return this;
    }
    /**
     * Expect the current character or throw an error.
     *
     * @param expected The expected character.
     * @param id The expected id.
     * @returns The scanner instance.
     * @throws An error if the two values don't match.
     */
    expect(expected, id) {
      if (this.current !== expected) {
        this.throwExpectedError(expected, id);
      }
      return this;
    }
    /**
     * Throw an error for an expected value.
     *
     * @param expected The expected character.
     * @param id The expected id.
     * @throws Always throws an expected error.
     */
    throwExpectedError(expected, id) {
      throw new LocalizedError({
        message: `Expected ${expected} for ${id}`,
        lex: "lexerExpected",
        args: { arg0: expected, arg1: id },
        index: this.index
      });
    }
    /**
     * Update character references.
     */
    update() {
      this.current = this.index >= this.input.length ? null : this.input[this.index];
      this.next = this.index + 1 >= this.input.length ? null : this.input[this.index + 1];
    }
    /**
     * Return true if the specified character matches the current character.
     *
     * @param c The character to test.
     * @returns True if there's a match.
     */
    is(c) {
      return this.current === c;
    }
    /**
     * Return true if the end of the data stream has been reached.
     *
     * @returns True if EOF.
     */
    isEof() {
      return this.current === null;
    }
    /**
     * Consume any space and tab characters.
     *
     * This does not consume all different types of white space - just space and tab characters.
     * @returns The scanner instance.
     */
    consumeSpacesAndTabs() {
      while (this.isSpaceOrTab()) {
        this.consume();
      }
      return this;
    }
    /**
     * @returns true if the current character is a space or tab.
     */
    isSpaceOrTab() {
      return _Scanner.isSpaceOrTab(this.current);
    }
    /**
     * Return true if the character is a space or a tab.
     *
     * @param c The character to test.
     * @returns True if a space or a tab.
     */
    static isSpaceOrTab(c) {
      return c === " " || c === "	";
    }
    /**
     * Consume any white space characters.
     * @returns The scanner instance.
     */
    consumeWhiteSpace() {
      while (this.isWhiteSpace()) {
        this.consume();
      }
      return this;
    }
    /**
     * Return true if the current character is a valid letter (a-z and A-Z).
     *
     * @returns True if valid letter.
     */
    isLetter() {
      return _Scanner.isLetter(this.current);
    }
    /**
     * Return true if the current character is a newline.
     *
     * @returns True if the current character is a new line.
     */
    isNewLine() {
      return _Scanner.isNewLine(this.current);
    }
    /**
     * Return true if the character is a newline.
     *
     * @param c The character to test.
     * @returns True if the character is a new line.
     */
    static isNewLine(c) {
      return c === "\n" || c === "\r";
    }
    /**
     * Return true if the character is a valid letter (a-z and A-Z).
     *
     * @param c The character to test.
     * @returns True if valid letter.
     */
    static isLetter(c) {
      if (typeof c !== "string") {
        return false;
      }
      const code = c.charCodeAt(0);
      return code >= A_CHAR_CODE && code <= Z_CHAR_CODE || code >= UPPER_A_CHAR_CODE && code <= UPPER_Z_CHAR_CODE;
    }
    /**
     * Return true if the current character is a valid digit.
     *
     * @returns True if valid number.
     */
    isDigit() {
      return _Scanner.isDigit(this.current);
    }
    /**
     * Return true if the character is a valid digit.
     *
     * @param c The character to test.
     * @returns True if valid number.
     */
    static isDigit(c) {
      if (typeof c !== "string") {
        return false;
      }
      const code = c.charCodeAt(0);
      return code >= ZERO_CHAR_CODE && code <= NINE_CHAR_CODE;
    }
    /**
     * Return true if the current character is considered white space.
     *
     * @returns True if white space.
     */
    isWhiteSpace() {
      return _Scanner.isWhiteSpace(this.current);
    }
    /**
     * Return true if the character is considered white space.
     *
     * @param c The character to test.
     * @returns True if white space.
     */
    static isWhiteSpace(c) {
      return c === " " || c === "	" || c === "\r" || c === "\n";
    }
    /**
     * Return true if the current character is a valid hex character
     *
     * @returns True if this is a hex character.
     */
    isHex() {
      return _Scanner.isHex(this.current);
    }
    /**
     * Return true if the character is a valid hex character
     *
     * @param c The charcter to test.
     * @returns True if this is a hex character.
     */
    static isHex(c) {
      switch (c) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case "a":
        case "b":
        case "c":
        case "d":
        case "e":
        case "f":
        case "A":
        case "B":
        case "C":
        case "D":
        case "E":
        case "F":
          return true;
        default:
          return false;
      }
    }
    /**
     * Return true if the current character is a string and is upper case.
     *
     * @returns True if upper case.
     */
    isUpperCase() {
      return _Scanner.isUpperCase(this.current);
    }
    /**
     * Return true if the character is a string and is upper case.
     *
     * @param c The character to test.
     * @returns True if upper case.
     */
    static isUpperCase(c) {
      if (!c) {
        return false;
      }
      return c.toUpperCase() === c;
    }
    /**
     * Return true if the current character is a string and is lower case.
     *
     * @returns True if lower case.
     */
    isLowerCase() {
      return _Scanner.isLowerCase(this.current);
    }
    /**
     * Return true if the character is a string and is lower case.
     *
     * @param c The character to test.
     * @returns True if lower case.
     */
    static isLowerCase(c) {
      if (!c) {
        return false;
      }
      return c.toUpperCase() !== c;
    }
  };
  var DICT_STORE_SYMBOL = Symbol.for("haystack-core.dictStore");
  function isDictStore(value2) {
    return !!(value2?.[DICT_STORE_SYMBOL] === DICT_STORE_SYMBOL);
  }
  function hvalObjToJson(hvals) {
    const obj = {};
    for (const name of Object.keys(hvals)) {
      obj[name] = hvals[name]?.toJSON() ?? null;
    }
    return obj;
  }
  function toHValObj(values) {
    const hvalObj = {};
    for (const prop in values) {
      const obj = values[prop];
      if (obj !== void 0 && typeof obj !== "function" && typeof obj !== "symbol") {
        hvalObj[prop] = makeValue(obj);
      }
    }
    return hvalObj;
  }
  var _a, _values;
  _a = DICT_STORE_SYMBOL;
  var DictHValObjStore = class {
    constructor(values) {
      __privateAdd(this, _values);
      __publicField(this, _a, DICT_STORE_SYMBOL);
      __privateSet(this, _values, values);
    }
    get(name) {
      return __privateGet(this, _values)[name];
    }
    has(name) {
      return __privateGet(this, _values)[name] !== void 0;
    }
    set(name, value2) {
      __privateGet(this, _values)[name] = value2;
    }
    remove(name) {
      delete __privateGet(this, _values)[name];
    }
    clear() {
      __privateSet(this, _values, {});
    }
    getKeys() {
      return Object.keys(__privateGet(this, _values));
    }
    toObj() {
      return __privateGet(this, _values);
    }
    toJSON() {
      return hvalObjToJson(__privateGet(this, _values));
    }
    toJSONString() {
      return JSON.stringify(this.toJSON());
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
  };
  _values = new WeakMap();
  var _a2, _values2, _hvals;
  _a2 = DICT_STORE_SYMBOL;
  var DictJsonStore = class {
    constructor(values) {
      /**
       * The original Hayson dict.
       *
       * If undefined then all values have been decoded so this object is no longer needed.
       */
      __privateAdd(this, _values2);
      /**
       * Cached hvals.
       *
       * This cache is gradually added to if values are read from the JSON object.
       * If the dict is written too then all values are decoded.
       */
      __privateAdd(this, _hvals, {});
      __publicField(this, _a2, DICT_STORE_SYMBOL);
      __privateSet(this, _values2, values);
    }
    get(name) {
      const hval = __privateGet(this, _hvals)[name];
      if (hval !== void 0) {
        return hval;
      }
      if (__privateGet(this, _values2)) {
        const val = __privateGet(this, _values2)[name];
        if (val !== void 0) {
          const newHVal = makeValue(val);
          __privateGet(this, _hvals)[name] = newHVal;
          if (newHVal && (newHVal.getKind() === Kind.Dict || newHVal.getKind() === Kind.List || newHVal.getKind() === Kind.Grid)) {
            this.decodeAll();
          }
          return newHVal;
        }
      }
      return void 0;
    }
    has(name) {
      return __privateGet(this, _values2) ? __privateGet(this, _values2)[name] !== void 0 : __privateGet(this, _hvals)[name] !== void 0;
    }
    set(name, value2) {
      this.decodeAll();
      __privateGet(this, _hvals)[name] = value2;
    }
    remove(name) {
      delete __privateGet(this, _hvals)[name];
      delete __privateGet(this, _values2)?.[name];
    }
    clear() {
      __privateSet(this, _values2, void 0);
      __privateSet(this, _hvals, {});
    }
    getKeys() {
      return Object.keys(__privateGet(this, _values2) ?? __privateGet(this, _hvals));
    }
    toObj() {
      this.decodeAll();
      return __privateGet(this, _hvals);
    }
    toJSON() {
      return __privateGet(this, _values2) ?? hvalObjToJson(__privateGet(this, _hvals));
    }
    toJSONString() {
      return JSON.stringify(this.toJSON());
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    decodeAll() {
      if (__privateGet(this, _values2)) {
        __privateSet(this, _hvals, toHValObj(__privateGet(this, _values2)));
        __privateSet(this, _values2, void 0);
      }
    }
  };
  _values2 = new WeakMap();
  _hvals = new WeakMap();
  var GRID_COLUMN_SYMBOL = Symbol.for("haystack-core.gridColumn");
  var _a3;
  _a3 = GRID_COLUMN_SYMBOL;
  var GridColumn = class {
    /**
     * Constructs a new column.
     *
     * @param name The name of the column.
     * @param meta The column's meta data.
     */
    constructor(name, meta) {
      /**
       * Name of the column.
       */
      __publicField(this, "name");
      /**
       * Meta data for the column.
       */
      __publicField(this, "meta");
      /**
       * Flag used to identify a grid column.
       */
      __publicField(this, _a3, GRID_COLUMN_SYMBOL);
      this.name = name;
      this.meta = meta ?? HDict.make();
    }
    /**
     * @returns The display name for the column.
     */
    get dis() {
      const dis2 = this.meta.get("dis");
      return valueIsKind(dis2, Kind.Str) && dis2.value || this.name;
    }
    /**
     * @returns The display name for the column.
     */
    get displayName() {
      return this.dis;
    }
    /**
     * Column equality check.
     *
     * @param column The column to test.
     * @returns True if the value is the same.
     */
    equals(column) {
      if (!isGridColumn(column)) {
        return false;
      }
      if (column.name !== this.name) {
        return false;
      }
      if (!column.meta.equals(this.meta)) {
        return false;
      }
      return true;
    }
  };
  function isGridColumn(value2) {
    return value2?.[GRID_COLUMN_SYMBOL] === GRID_COLUMN_SYMBOL;
  }
  var GRID_STORE_SYMBOL = Symbol.for("haystack-core.gridStore");
  var DEFAULT_GRID_VERSION = "3.0";
  var GRID_VERSION_NAME = "ver";
  function isGridStore(value2) {
    return !!(value2?.[GRID_STORE_SYMBOL] === GRID_STORE_SYMBOL);
  }
  var _a4, _version, _meta, _metaJson, _columns, _columnsJson, _rows, _rowsJson;
  _a4 = GRID_STORE_SYMBOL;
  var GridJsonStore = class {
    constructor(grid) {
      __privateAdd(this, _version);
      __privateAdd(this, _meta);
      __privateAdd(this, _metaJson);
      __privateAdd(this, _columns);
      __privateAdd(this, _columnsJson);
      __privateAdd(this, _rows);
      __privateAdd(this, _rowsJson);
      __publicField(this, _a4, GRID_STORE_SYMBOL);
      __privateSet(this, _metaJson, grid.meta);
      __privateSet(this, _columnsJson, grid.cols);
      __privateSet(this, _rowsJson, grid.rows);
      this.removeEmptyColumnMeta();
    }
    get version() {
      if (__privateGet(this, _version) === void 0) {
        __privateSet(this, _version, String(__privateGet(this, _metaJson)?.[GRID_VERSION_NAME] ?? DEFAULT_GRID_VERSION));
      }
      return __privateGet(this, _version);
    }
    set version(version) {
      __privateSet(this, _version, version);
    }
    get meta() {
      if (!__privateGet(this, _meta)) {
        if (__privateGet(this, _metaJson)) {
          __privateSet(this, _meta, new HDict(new DictJsonStore(__privateGet(this, _metaJson))));
          if (__privateGet(this, _meta).has(GRID_VERSION_NAME)) {
            if (!__privateGet(this, _version)) {
              __privateSet(this, _version, __privateGet(this, _meta).get(GRID_VERSION_NAME)?.toString());
            }
            __privateGet(this, _meta).remove(GRID_VERSION_NAME);
          }
        } else {
          __privateSet(this, _meta, new HDict());
        }
      }
      return __privateGet(this, _meta);
    }
    set meta(meta) {
      __privateSet(this, _meta, meta);
    }
    get columns() {
      if (!__privateGet(this, _columns)) {
        __privateSet(this, _columns, __privateGet(this, _columnsJson)?.map((column) => new GridColumn(column.name, column.meta ? new HDict(new DictJsonStore(column.meta)) : void 0)) ?? []);
        __privateSet(this, _columnsJson, void 0);
      }
      return __privateGet(this, _columns);
    }
    set columns(columns) {
      __privateSet(this, _columns, columns);
      __privateSet(this, _columnsJson, void 0);
    }
    get rows() {
      if (!__privateGet(this, _rows)) {
        __privateSet(this, _rows, __privateGet(this, _rowsJson)?.map((row) => new HDict(new DictJsonStore(row))) ?? []);
        __privateSet(this, _rowsJson, void 0);
      }
      return __privateGet(this, _rows);
    }
    set rows(rows) {
      __privateSet(this, _rows, rows);
      __privateSet(this, _rowsJson, void 0);
    }
    toJSON() {
      const meta = __privateGet(this, _meta) || __privateGet(this, _version) ? { ...this.meta.toJSON() } : __privateGet(this, _metaJson) ?? {};
      if (!meta[GRID_VERSION_NAME]) {
        meta[GRID_VERSION_NAME] = this.version;
      }
      return {
        _kind: Kind.Grid,
        meta,
        cols: __privateGet(this, _columns) ? __privateGet(this, _columns).map((column) => ({
          name: column.name,
          meta: column.meta.isEmpty() ? void 0 : column.meta.toJSON()
        })) : __privateGet(this, _columnsJson) ?? [],
        rows: __privateGet(this, _rows) ? __privateGet(this, _rows).map((row) => row.toJSON()) : __privateGet(this, _rowsJson) ?? []
      };
    }
    removeEmptyColumnMeta() {
      if (__privateGet(this, _columnsJson)) {
        for (const column of __privateGet(this, _columnsJson)) {
          if (column.meta && !Object.keys(column.meta).length) {
            column.meta = void 0;
          }
        }
      }
    }
    toJSONString() {
      return JSON.stringify(this.toJSON());
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
  };
  _version = new WeakMap();
  _meta = new WeakMap();
  _metaJson = new WeakMap();
  _columns = new WeakMap();
  _columnsJson = new WeakMap();
  _rows = new WeakMap();
  _rowsJson = new WeakMap();
  var LIST_STORE_SYMBOL = Symbol.for("haystack-core.listStore");
  function isListStore(value2) {
    return !!(value2?.[LIST_STORE_SYMBOL] === LIST_STORE_SYMBOL);
  }
  var _a5, _list, _values3;
  _a5 = LIST_STORE_SYMBOL;
  var ListJsonStore = class {
    constructor(list) {
      __privateAdd(this, _list);
      __privateAdd(this, _values3);
      __publicField(this, _a5, LIST_STORE_SYMBOL);
      __privateSet(this, _list, list);
    }
    get values() {
      if (!__privateGet(this, _values3)) {
        __privateSet(this, _values3, __privateGet(this, _list)?.map((value2) => makeValue(value2)) ?? []);
        __privateSet(this, _list, void 0);
      }
      return __privateGet(this, _values3);
    }
    set values(values) {
      __privateSet(this, _values3, values);
      __privateSet(this, _list, void 0);
    }
    toJSON() {
      return __privateGet(this, _values3) ? __privateGet(this, _values3).map((value2) => value2?.toJSON() ?? null) : __privateGet(this, _list) ?? [];
    }
    toJSONString() {
      return JSON.stringify(this);
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
  };
  _list = new WeakMap();
  _values3 = new WeakMap();
  function makeValue(val) {
    if (val === null || val === void 0) {
      return null;
    }
    if (isHVal(val)) {
      return val;
    }
    switch (typeof val) {
      case "string":
        return HStr.make(val);
      case "number":
        return HNum.make(val);
      case "boolean":
        return HBool.make(val);
    }
    if (!val) {
      throw new Error("Invalid value");
    }
    if (Array.isArray(val)) {
      return new HList(new ListJsonStore(val));
    }
    const obj = val;
    switch (toKind(obj._kind ?? "")) {
      case Kind.Marker:
        return HMarker.make();
      case Kind.Remove:
        return HRemove.make();
      case Kind.NA:
        return HNa.make();
      case Kind.Coord:
        return HCoord.make(obj);
      case Kind.XStr:
      case Kind.Bin:
        return HXStr.make(obj);
      case Kind.Date:
        return HDate.make(obj);
      case Kind.DateTime:
        return HDateTime.make(obj);
      case Kind.Number:
        return HNum.make(obj);
      case Kind.Ref:
        return HRef.make(obj);
      case Kind.Symbol:
        return HSymbol.make(obj);
      case Kind.Time:
        return HTime.make(obj);
      case Kind.Uri:
        return HUri.make(obj);
      case Kind.Dict:
      case void 0:
        return new HDict(new DictJsonStore(obj));
      case Kind.Grid:
        return new HGrid(new GridJsonStore(obj));
      default:
        throw new Error("Could not resolve value from kind: " + obj._kind);
    }
  }
  function toKind(kind) {
    switch (kind) {
      case "Marker":
      case Kind.Marker:
        return Kind.Marker;
      case "Remove":
      case Kind.Remove:
        return Kind.Remove;
      case "NA":
      case Kind.NA:
        return Kind.NA;
      case "Coord":
      case Kind.Coord:
        return Kind.Coord;
      case "XStr":
      case Kind.XStr:
        return Kind.XStr;
      case "Bin":
      case Kind.Bin:
        return Kind.Bin;
      case "Date":
      case Kind.Date:
        return Kind.Date;
      case "DateTime":
      case Kind.DateTime:
        return Kind.DateTime;
      case "Number":
      case Kind.Number:
        return Kind.Number;
      case "Ref":
      case Kind.Ref:
        return Kind.Ref;
      case "Symbol":
      case Kind.Symbol:
        return Kind.Symbol;
      case "Time":
      case Kind.Time:
        return Kind.Time;
      case "Uri":
      case Kind.Uri:
        return Kind.Uri;
      case "Dict":
      case Kind.Dict:
        return Kind.Dict;
      case "Grid":
      case Kind.Grid:
        return Kind.Grid;
      case "Str":
      case Kind.Str:
        return Kind.Str;
      case "List":
      case Kind.List:
        return Kind.List;
      case "Bool":
      case Kind.Bool:
        return Kind.Bool;
      default:
        return void 0;
    }
  }
  function makeDefaultValue(kind) {
    let value2;
    switch (kind) {
      case Kind.Str:
        value2 = HStr.make("");
        break;
      case Kind.Number:
        value2 = HNum.make(0);
        break;
      case Kind.Date:
        value2 = HDate.now();
        break;
      case Kind.Time:
        value2 = HTime.now();
        break;
      case Kind.Uri:
        value2 = HUri.make("");
        break;
      case Kind.Ref:
        value2 = HRef.make("");
        break;
      case Kind.Bool:
        value2 = HBool.make(true);
        break;
      case Kind.Dict:
        value2 = HDict.make();
        break;
      case Kind.DateTime:
        value2 = HDateTime.now();
        break;
      case Kind.Marker:
        value2 = HMarker.make();
        break;
      case Kind.Remove:
        value2 = HRemove.make();
        break;
      case Kind.NA:
        value2 = HNa.make();
        break;
      case Kind.Coord:
        value2 = HCoord.make({ latitude: 0, longitude: 0 });
        break;
      case Kind.XStr:
      case Kind.Bin:
        value2 = HXStr.make("");
        break;
      case Kind.Symbol:
        value2 = HSymbol.make("");
        break;
      case Kind.List:
        value2 = HList.make();
        break;
      case Kind.Grid:
        value2 = HGrid.make();
        break;
    }
    return value2;
  }
  function dictToDis(dict, def, i18n, short) {
    let val = dict.get("dis");
    if (isHVal(val)) {
      return val.toString();
    }
    const runMacro = (val2) => macro(val2.toString(), (val3) => dict.get(val3), i18n);
    if (!short) {
      val = dict.get("disMacro");
      if (isHVal(val)) {
        return runMacro(val);
      }
    }
    val = dict.get("disKey");
    if (isHVal(val)) {
      return i18n ? disKey(val.toString(), i18n) ?? val.toString() : val.toString();
    }
    val = dict.get("name");
    if (isHVal(val)) {
      return val.toString();
    }
    val = dict.get("def");
    if (isHVal(val)) {
      return val.toString();
    }
    val = dict.get("tag");
    if (isHVal(val)) {
      return val.toString();
    }
    val = dict.get("navName");
    if (isHVal(val)) {
      return val.toString();
    }
    if (short) {
      val = dict.get("disMacro");
      if (isHVal(val)) {
        return runMacro(val);
      }
    }
    val = dict.get("id");
    if (valueIsKind(val, Kind.Ref)) {
      return val.dis;
    }
    return def ?? "";
  }
  function macro(pattern, getValue, i18n) {
    const replacer = (match, key) => {
      const val = getValue(key);
      if (valueIsKind(val, Kind.Ref)) {
        return val.dis;
      }
      return val?.toString() ?? match;
    };
    let result = pattern.replace(/\$([a-z][a-zA-Z0-9_]+)/g, replacer);
    result = result.replace(/\${([a-z][a-zA-Z0-9_]+)}/g, replacer);
    if (i18n) {
      result = result.replace(/\$<([^>]+)>/g, (match, key) => disKey(key, i18n) ?? match);
    }
    return result.trim();
  }
  function disKey(key, i18n) {
    const [, pod, disKey2] = /^([^:]+)::([^:]+)$/.exec(key.trim()) ?? [];
    return pod && disKey2 ? i18n(pod, disKey2) : void 0;
  }
  var _a6;
  _a6 = LIST_STORE_SYMBOL;
  var ListObjStore = class {
    constructor(values) {
      __publicField(this, "values");
      __publicField(this, _a6, LIST_STORE_SYMBOL);
      this.values = values;
    }
    toJSON() {
      return this.values.map((value2) => value2 ? value2.toJSON() : null);
    }
    toJSONString() {
      return JSON.stringify(this);
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
  };
  var ListValueIterator = class {
    constructor(list) {
      __publicField(this, "$values");
      __publicField(this, "$index", 0);
      this.$values = list.toArray();
    }
    next() {
      if (this.$index >= this.$values.length) {
        return {
          done: true,
          value: void 0
        };
      }
      return {
        done: false,
        value: this.$values[this.$index++]
      };
    }
  };
  var HList = class _HList {
    /**
     * Creates a new list.
     *
     * ```typescript
     * // A single haystack value array.
     * const list0 = new HList([HStr.make('foo), HMarker.make()])
     *
     * // Create a list using Hayson.
     * const list2 = new HList(['foo', { _kind: Kind.Marker }])
     * const list2 = new HList('foo', { _kind: Kind.Marker })
     * ```
     *
     * @param value list values.
     */
    constructor(values) {
      /**
       * The list values.
       */
      __publicField(this, "$store");
      this.$store = isListStore(values) ? values : new ListObjStore(_HList.toValues(values ?? []));
      const handler = {
        get: function(target, prop) {
          const anyTarget = target;
          if (prop === "length") {
            return target.values.length;
          } else if (typeof prop === "string" && /^[0-9]+$/.test(prop)) {
            return target.get(Number(prop));
          } else {
            return anyTarget[prop];
          }
        },
        set(target, prop, value2) {
          const anyTarget = target;
          if (typeof prop === "string" && /^[0-9]+$/.test(prop)) {
            target.set(Number(prop), value2);
          } else {
            anyTarget[prop] = value2;
          }
          return true;
        }
      };
      return new Proxy(this, handler);
    }
    get values() {
      return this.$store.values;
    }
    set values(values) {
      this.$store.values = values;
    }
    /**
     * Make a list.
     *
     * @param values A value or list of values.
     * @returns A list.
     */
    static make(...values) {
      return values.length === 1 && valueIsKind(values[0], Kind.List) ? values[0] : new _HList(_HList.toValues(values));
    }
    /**
     * Returns a flattened array of haystack values.
     *
     * @param values The values to flatten into an array of haystack values.
     * @returns An array of values.
     */
    static toValues(values) {
      const newValues = [];
      for (const val of values) {
        if (Array.isArray(val)) {
          for (const innerVal of val) {
            if (innerVal !== void 0) {
              newValues.push(makeValue(innerVal));
            }
          }
        } else if (val !== void 0) {
          newValues.push(makeValue(val));
        }
      }
      return newValues;
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.List;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Return the length of the list.
     */
    get length() {
      return this.values.length;
    }
    /**
     * Returns a haystack value from the list or undefined
     * if it can't be found.
     *
     * ```typescript
     * const val = list.get(0)
     * if (val) {
     *   // Do something
     * }
     * ```
     *
     * @param index The index number of the value to get.
     * @return The value, null or undefined if it can't be found.
     */
    get(index) {
      return this.values[index];
    }
    /**
     * Set a haystack value in the list.
     *
     * ```typescript
     * list.set(0, HStr.make('A new string'))
     *
     * // Or use Hayson...
     * list.set(0, 'A new string')
     * ```
     *
     * @param index The index of the item in the list.
     * @param value The haystack value or hayson value to set.
     * @returns The list instance.
     */
    set(index, value2) {
      this.values[index] = makeValue(value2);
      return this;
    }
    /**
     * Removes a value from the list.
     *
     * ```typescript
     * // Removes the first element of the list.
     * list.remove(0)
     * ```
     *
     * @param index The index of the item in the list.
     */
    remove(index) {
      this.values.splice(index, 1);
    }
    /**
     * Clear all entries from the list.
     *
     * ```typescript
     * // Makes a list completely empty.
     * list.clear()
     * ```
     */
    clear() {
      this.values.splice(0, this.values.length);
    }
    /**
     * Adds an element to the list.
     *
     * This method can add multiple values at once...
     *
     * ```typescript
     * list.add(HStr.make('foo'))
     * list.add(HStr.make('foo'), HStr.make('boo))
     *
     * // Using an array...
     * list.add([HStr.make('foo'), HStr.make('boo)])
     *
     * // Same but using hayson...
     * list.add('foo')
     * list.add('foo', 'boo')
     * list.add(['foo', 'boo'])
     * ```
     *
     * @param values The values to add to the list.
     * @returns The list instance.
     */
    add(...values) {
      const toAdd = _HList.toValues(values);
      for (const val of toAdd) {
        this.values.push(val);
      }
      return this;
    }
    /**
     * Concatenate two lists together and return the new list.
     *
     * ```typescript
     * const newList = listA.concat(listB)
     * ```
     *
     * @param list The list to concatenate.
     * @returns The new list.
     */
    concat(list) {
      return _HList.make(this.values.concat(list.values));
    }
    /**
     * Inserts an element into the list.
     *
     * This method can insert multiple values at once...
     *
     * ```typescript
     * list.insert(1, HStr.make('foo'))
     * list.insert(1, HStr.make('foo'), HStr.make('boo))
     *
     * // Using an array...
     * list.insert(1, [HStr.make('foo'), HStr.make('boo)])
     *
     * // Same but using hayson...
     * list.insert(1, 'foo')
     * list.insert(1, 'foo', 'boo')
     * list.insert(1, ['foo', 'boo'])
     * ```
     *
     * @param values The values to insert into the list.
     * @returns The list instance.
     */
    insert(index, ...values) {
      const toInsert = _HList.toValues(values);
      if (!toInsert.length) {
        throw new Error("No dicts to insert into grid");
      }
      if (index < 0) {
        throw new Error("Index cannot be less than zero");
      }
      if (index > this.values.length) {
        throw new Error("Index not in range");
      }
      for (const val of toInsert) {
        this.values.splice(index++, 0, val);
      }
      return this;
    }
    /**
     * Pushes a value onto the end of the list.
     *
     * ```typescript
     * list.push(HStr.make('A new string'))
     *
     * // Same but using Hayson...
     * list.push('A new string')
     * ```
     *
     * @param val The value to add to the list.
     * @returns The list instance.
     */
    push(val) {
      return this.add(val);
    }
    /**
     * Pops removes the last element of the array and returns it.
     * If the array is empty then undefined is returned.
     *
     * ```typescript
     * const lastValue = list.pop()
     *
     * if (lastValue) {
     *   // Do something
     * }
     * ```
     *
     * @returns The popped value or undefined.
     */
    pop() {
      return this.values.pop();
    }
    /**
     * Sort the list in ascending order.
     *
     * ```typescript
     * const sortedList = list.sort()
     * ```
     *
     * @returns The list instance.
     */
    sort() {
      this.values.sort((first2, second) => {
        if (!first2 && !second) {
          return 0;
        }
        if (!first2) {
          return -1;
        }
        if (!second) {
          return 1;
        }
        return first2.compareTo(second);
      });
      return this;
    }
    /**
     * Reverse the order of all the values in the list.
     *
     * ```typescript
     * const listInDescendingOrder = list.sort().reverse()
     * ```
     *
     * @returns The list instance.
     */
    reverse() {
      this.values.reverse();
      return this;
    }
    /**
     * ```typescript
     * if (list.isEmpty()) {
     *   // List is empty.
     * }
     * ```
     *
     * @returns True when there are no entries in the list.
     */
    isEmpty() {
      return this.values.length === 0;
    }
    /**
     * Test to see if the list contains the value or matches the filter at least once.
     *
     * ```typescript
     * const list = new HList([ HStr.make('a'), HStr.make('b'), HStr.make('c') ])
     *
     * if (list.any(HStr.make(a))) {
     *   // Do something
     * }
     *
     * // Or use a haystack filter...
     * if (list.any('item == "a"')) {
     *  // Do something
     * }
     *
     * // It use the shortened item name in a haystack filter...
     * if (list.any('it == "a"')) {
     *  // Do something
     * }
     * ```
     *
     * @param val The value to test, a haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the list contains the value.
     */
    any(val, cx) {
      let result = false;
      if (isHVal(val) || val === null) {
        for (const value2 of this.values) {
          if (valueEquals(val, value2)) {
            result = true;
            break;
          }
        }
      } else {
        this.runFilter(val, (match) => {
          if (match) {
            result = true;
            return false;
          }
          return true;
        }, cx);
      }
      return result;
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * This method is the same as `any`.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return this.any(filter, cx);
    }
    /**
     * Test to see if the list contains all the same value or the filter
     * matches all elements.
     *
     * ```typescript
     *
     * const list = new HList([ HStr.make('a'), HStr.make('a'), HStr.make('a') ])
     *
     * if (list.all(HStr.make('a'))) {
     *   // Do something
     * }
     *
     * // Also use a haystack filter...
     * if (list.all('item == "a"')) {
     *   // Do something
     * }
     *
     * // Same again but use the shorter 'it'...
     * if (list.all('it == "all"')) {
     *   // Do something
     * }
     *
     * list.push(HStr.make('b'))
     *
     * // All will now return false as the values aren't all the same...
     * if (list.all('it == "a"')) {
     *   // Do something
     * }
     * ```
     *
     * @param val The value to test, a haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the list contains the value.
     */
    all(val, cx) {
      if (this.isEmpty()) {
        return false;
      }
      let result = true;
      if (isHVal(val) || val === null) {
        for (const value2 of this.values) {
          if (!valueEquals(val, value2)) {
            result = false;
            break;
          }
        }
      } else {
        this.runFilter(val, (match) => {
          if (!match) {
            result = false;
            return false;
          }
          return true;
        }, cx);
      }
      return result;
    }
    /**
     * Filter the list via a haystack filter or callback function and return a new list.
     *
     * If a Haystack filter is used, the array list is referenced as either 'it' or 'item.
     *
     * ```typescript
     * const list = HList<HStr>.make([ HStr.make('foo'), HStr.make('boo'), HStr.make('foo') ])
     *
     * const filteredList = list.filter('item == "foo"')
     *
     * // Or use the shorter it...
     *
     * const anotherList = list.filter('it == "foo"')
     * ```
     *
     * A classic filter function callback can also be used...
     * ```typescript
     * const anotherList= list.filter((val: HStr): boolean => val.value === 'foo')
     * ```
     *
     * @param filter A haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns A new haystack list.
     */
    filter(filter, cx) {
      let newVals;
      if (typeof filter === "function") {
        newVals = this.values.filter(filter);
      } else {
        newVals = [];
        this.runFilter(filter, (match, val) => {
          if (match) {
            newVals.push(val);
          }
          return true;
        }, cx);
      }
      return _HList.make(newVals);
    }
    /**
     * Run the filter. For each match invoke the callback function.
     *
     * The callback takes a flag to indicate a match, value and an index argument.
     * If false is returned the filter stops running.
     *
     * @param filter The haystack filter to run or an AST node.
     * @param callback The callback invoked for each match.
     * @param cx Optional haystack filter evaluation context.
     */
    runFilter(filter, callback, cx) {
      const hfilter = new HFilter(filter);
      const dict = HDict.make({
        it: HMarker.make(),
        item: HMarker.make()
      });
      const context = { dict, namespace: cx?.namespace, resolve: cx?.resolve };
      for (let i = 0; i < this.values.length; ++i) {
        const val = this.values[i];
        dict.set("it", val);
        dict.set("item", val);
        if (!callback(hfilter.eval(context), val, i)) {
          break;
        }
      }
    }
    /**
     * Use an array style map function on a list.
     *
     * ```typescript
     * // Using React, map a list to some DOM elements...
     * list.make((str: HStr): any => <div>{str.value}</div>)
     * ```
     *
     * @param callback The map callback.
     * @returns A new list with the mapped value.
     */
    map(callback) {
      return this.values.map(callback);
    }
    /**
     * Use an array style reduce function on a list.
     *
     * ```typescript
     * const numList = new HList<HNum>([1, 2, 3])
     *
     * const total = numList.reduce(
     *   (prev, cur): number => prev + cur.value), 0
     * )
     * ```
     *
     * @param callback the reduce callback.
     * @param initialValue The initial value for the reduce operation.
     * @returns The reduced value.
     */
    reduce(callback, initialValue) {
      return initialValue === void 0 ? this.values.reduce(callback) : this.values.reduce(callback, initialValue);
    }
    /**
     * ```typescript
     * // Creates an HList with HNums - [1, 2, 3, 4, 5, 6]
     * const list = new HList<HNum>([[1, 2, 3], [4, 5], 6]).flat()
     * ```
     *
     * @returns A flattened list.
     */
    flat() {
      const newValues = [];
      for (const val of this.values) {
        if (valueIsKind(val, Kind.List)) {
          for (const innerVal of val) {
            newValues.push(innerVal);
          }
        } else {
          newValues.push(val);
        }
      }
      return _HList.make(newValues);
    }
    /**
     * ```typescript
     * // Create a unique list with HStr - [ 'a', 'b' ]
     * const list = new HList<HStr>('a', 'a', 'b').unique()
     * ```
     *
     * @returns A new filtered list of unique values.
     */
    unique() {
      return _HList.make(this.values.filter((val, index) => {
        for (let i = 0; i < index; ++i) {
          const value2 = this.values[i];
          if (valueEquals(value2, val)) {
            return false;
          }
        }
        return true;
      }));
    }
    /**
     * Find a value to search for and returns true if it's found.
     *
     * ```typescript
     * if (list.includes(HNum.make(24, 'm'))) {
     *   // Do something...
     * }
     * ```
     *
     * @param val The value to search for.
     * @param fromIndex Optional index number to search from.
     * @returns true if the value is found.
     */
    includes(val, fromIndex) {
      const newVal = makeValue(val);
      let included = false;
      for (let i = fromIndex || 0; i < this.values.length; ++i) {
        const value2 = this.values[i];
        if (valueEquals(newVal, value2)) {
          included = true;
          break;
        }
      }
      return included;
    }
    /**
     * Loop through a list's values.
     *
     * @param callback The function to execute on each haystack value.
     * @param thisArg Optional value to use as this when executing callback.
     */
    forEach(callback, thisArg) {
      this.values.forEach(callback, thisArg || this);
    }
    /**
     * Find an item in the list and return it or undefiend if not found.
     *
     * ```typescript
     * const foundItem = list.find((val) => val.someItem.equals(foo))
     * ```
     *
     * @param callback The find callback.
     * @param thisArg Optional this argument.
     * @returns The item or undefined.
     */
    find(callback, thisArg) {
      return this.values.find(callback, thisArg);
    }
    /**
     * Returns the list in a Hayson format.
     *
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return this.$store.toJSON();
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return this.$store.toJSONString();
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return this.$store.toJSONUint8Array();
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return this.values.map((val) => val?.toJSONv3() ?? null);
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return `[${this.values.map((val) => val?.toString() ?? String(val)).join(", ")}]`;
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A list isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * @returns The encoded zinc string.
     */
    toZinc() {
      return `[${this.values.map((val) => val?.toZinc(
        /*nested*/
        true
      ) ?? ZINC_NULL).join(",")}]`;
    }
    /**
     * @returns An Axon encoded string.
     */
    toAxon() {
      return `[${this.values.map((val) => val?.toAxon() ?? AXON_NULL).join(",")}]`;
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      if (!valueIsKind(value2, Kind.List)) {
        return false;
      }
      if (this.values.length !== value2.values.length) {
        return false;
      }
      for (let i = 0; i < this.values.length; ++i) {
        const val0 = this.values[i];
        const val1 = value2.values[i];
        if (!valueEquals(val0, val1)) {
          return false;
        }
      }
      return true;
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive.
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.List)) {
        return -1;
      }
      const zinc0 = this.toZinc();
      const zinc1 = value2.toZinc();
      if (zinc0 < zinc1) {
        return -1;
      }
      if (zinc0 === zinc1) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns A copy of the underlying array.
     */
    toArray() {
      return this.values;
    }
    /**
     * Iterate over a list.
     *
     * This enables a 'for ... of' loop to be used directly on an iterator.
     *
     * @returns A new iterator for a list.
     *
     * ```typescript
     * // Iterate a list
     * for (let value of list) {
     *   console.log(value)
     * }
     *
     * // Destructure a list into a real array
     * const array = [...list]
     * ```
     */
    [Symbol.iterator]() {
      return new ListValueIterator(this);
    }
    /**
     * @returns The list as an array like object.
     */
    asArrayLike() {
      return this;
    }
    /**
     * Returns a list of primitive numbers from the list.
     *
     * @returns A list of numbers.
     */
    toNumbers() {
      return this.values.filter((val) => valueIsKind(val, Kind.Number)).map((val) => val.value);
    }
    /**
     * Convience method for summing a list of numbers in a list.
     *
     * ```typescript
     * // Sums to 6
     * const sum = new HList<HNum>(1, 2, 3).sum
     * ```
     *
     * @returns A sum of all the numbers in the list.
     */
    get sum() {
      return this.toNumbers().reduce(
        (acc, cur) => acc + cur,
        /*initial value*/
        0
      );
    }
    /**
     * Convience method for getting the maximum number in a list.
     *
     * ```typescript
     * // 3
     * const max = new HList<HNum>(1, 2, 3).max
     * ```
     *
     * If there are no numbers then Number.MIN_SAFE_INTEGER is returned.
     *
     * @returns A maximum number in a list.
     */
    get max() {
      return this.toNumbers().reduce(
        (acc, cur) => acc > cur ? acc : cur,
        /*initial value*/
        Number.MIN_SAFE_INTEGER
      );
    }
    /**
     * Convience method for getting the minimum number in a list.
     *
     * ```typescript
     * // 1
     * const min = new HList<HNum>(1, 2, 3).min
     * ```
     *
     * If there are no numbers then Number.MAX_SAFE_INTEGER is returned.
     *
     * @returns A minimum number in a list.
     */
    get min() {
      return this.toNumbers().reduce(
        (acc, cur) => acc < cur ? acc : cur,
        /*initial value*/
        Number.MAX_SAFE_INTEGER
      );
    }
    /**
     * Convience method for averaging all the numbers in a list.
     *
     * If there are no numbers then Number.NaN is returned.
     *
     * ```typescript
     * // 2
     * const avg = new HList<HNum>(1, 2, 3).avg
     * ```
     *
     * @returns The average of all the numbers.
     */
    get avg() {
      const numbers = this.toNumbers();
      if (numbers.length === 0) {
        return Number.NaN;
      }
      return numbers.reduce(
        (acc, cur) => acc + cur,
        /*initial value*/
        0
      ) / numbers.length;
    }
    /**
     * Return the list as a dict.
     *
     * The dict has one key called 'val' that stores the list.
     *
     * @returns A dict.
     */
    toDict() {
      return HDict.make(this);
    }
    /**
     * Return the list as a grid.
     *
     * The grid has one row and one column called 'val'.
     *
     * @returns A grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return this;
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      if (message) {
        console.log(String(message));
      }
      console.table(this.values.map((val) => String(val)));
      return this;
    }
    /**
     * @returns Returns a copy of the list.
     */
    newCopy() {
      return _HList.make(this.values.map((val) => val === null ? null : val.newCopy()));
    }
  };
  var emptyStr;
  var _value8;
  var _HStr = class _HStr {
    /**
     * Constructs a new haystack string.
     *
     * @param value The value.
     */
    constructor(value2) {
      /**
       * The string value.
       */
      __privateAdd(this, _value8);
      __privateSet(this, _value8, value2);
    }
    /**
     * Makes a haystack string.
     *
     * @param value The value string.
     * @returns A haystack string.
     */
    static make(value2) {
      if (typeof value2 === "string") {
        return value2 ? new _HStr(value2) : emptyStr ?? Object.freeze(emptyStr = new _HStr(value2));
      } else {
        return value2;
      }
    }
    /**
     * @returns The string value.
     */
    get value() {
      return __privateGet(this, _value8);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Str;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * The encoding for a haystack filter is mostly zinc but contains
     * some exceptions.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.toZinc();
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Str) && this.value === value2.value;
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Str)) {
        return -1;
      }
      if (this.value < value2.value) {
        return -1;
      }
      if (this.value === value2.value) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns The object's value as a string.
     */
    valueOf() {
      return this.value;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return this.value;
    }
    /**
     * Encode to zinc encoding.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      let buf = '"';
      for (const c of this.value) {
        const code = c.charCodeAt(0);
        if (c < " " || c === '"' || c === "\\" || c === "$" || code >= 128) {
          buf += "\\";
          switch (c) {
            case "\b":
              buf += "b";
              break;
            case "\f":
              buf += "f";
              break;
            case "\n":
              buf += "n";
              break;
            case "\r":
              buf += "r";
              break;
            case "	":
              buf += "t";
              break;
            case '"':
              buf += '"';
              break;
            case "\\":
              buf += "\\";
              break;
            case "$":
              buf += "$";
              break;
            default:
              let seq = code.toString(16);
              while (seq.length < 4) {
                seq = `0${seq}`;
              }
              buf += `u${seq}`;
          }
        } else {
          buf += c;
        }
      }
      buf += '"';
      return buf;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return this.value;
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return this.value.includes(":") ? `s:${this.value}` : this.value;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return this.toZinc();
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make(this);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  _value8 = new WeakMap();
  var HStr = _HStr;
  var NodeType;
  (function(NodeType2) {
    NodeType2[NodeType2["condOr"] = 0] = "condOr";
    NodeType2[NodeType2["condAnd"] = 1] = "condAnd";
    NodeType2[NodeType2["has"] = 2] = "has";
    NodeType2[NodeType2["missing"] = 3] = "missing";
    NodeType2[NodeType2["parens"] = 4] = "parens";
    NodeType2[NodeType2["cmp"] = 5] = "cmp";
    NodeType2[NodeType2["isa"] = 6] = "isa";
    NodeType2[NodeType2["rel"] = 7] = "rel";
    NodeType2[NodeType2["wildcardEq"] = 8] = "wildcardEq";
  })(NodeType || (NodeType = {}));
  function isNode(node) {
    return !!(node && typeof node.accept === "function" && typeof node.eval === "function");
  }
  var EMPTY_HVAL_ARRAY = Object.freeze([]);
  function get(context, paths) {
    if (!paths.length) {
      return EMPTY_HVAL_ARRAY;
    }
    const hvalue = context.dict.get(paths[0]);
    if (!hvalue) {
      return EMPTY_HVAL_ARRAY;
    }
    let hvalList = [hvalue];
    for (let i = 1; i < paths.length; ++i) {
      const newHvalList = [];
      for (const hval of hvalList) {
        if (valueIsKind(hval, Kind.Dict)) {
          const newHval = hval.get(paths[i]);
          if (newHval) {
            newHvalList.push(newHval);
          }
        } else if (typeof context.resolve === "function") {
          if (valueIsKind(hval, Kind.Ref)) {
            const newHVal = context.resolve(hval)?.get(paths[i]);
            if (newHVal) {
              newHvalList.push(newHVal);
            }
          } else if (valueIsKind(hval, Kind.List)) {
            for (const val of hval) {
              if (valueIsKind(val, Kind.Ref)) {
                const newHVal = context.resolve(val)?.get(paths[i]);
                if (newHVal) {
                  newHvalList.push(newHVal);
                }
              }
            }
          }
        }
      }
      hvalList = newHvalList;
      if (!hvalList.length) {
        break;
      }
    }
    return hvalList;
  }
  var ParentNode = class {
    constructor(nodes) {
      __publicField(this, "$nodes");
      this.$nodes = nodes;
    }
    get tokens() {
      return [];
    }
    get nodes() {
      return this.$nodes;
    }
    toJSON() {
      const data = {
        type: NodeType[this.type]
      };
      const nodes = this.nodes;
      if (nodes && nodes.length) {
        data.nodes = nodes.map((node) => node.toJSON());
      }
      return data;
    }
    acceptChildNodes(visitor) {
      this.nodes.forEach((node) => node.accept(visitor));
    }
  };
  var LeafNode = class {
    constructor(tokens2) {
      __publicField(this, "$tokens");
      this.$tokens = tokens2;
    }
    get tokens() {
      return this.$tokens;
    }
    get nodes() {
      return [];
    }
    toJSON() {
      const data = {
        type: NodeType[this.type]
      };
      const tokens2 = this.tokens;
      if (tokens2 && tokens2.length) {
        data.tokens = tokens2.map((token) => token.toJSON());
      }
      return data;
    }
    acceptChildNodes() {
    }
  };
  var CondOrNode = class extends ParentNode {
    constructor(condAnds) {
      super(condAnds);
    }
    get type() {
      return NodeType.condOr;
    }
    get condAnds() {
      return this.$nodes;
    }
    set condAnds(condAnds) {
      this.$nodes = condAnds;
    }
    accept(visitor) {
      visitor.visitCondOr(this);
    }
    eval(context) {
      for (const condAnd of this.$nodes) {
        if (condAnd.eval(context)) {
          return true;
        }
      }
      return false;
    }
  };
  var CondAndNode = class extends ParentNode {
    constructor(terms) {
      super(terms);
    }
    get type() {
      return NodeType.condAnd;
    }
    get terms() {
      return this.$nodes;
    }
    set terms(terms) {
      this.$nodes = terms;
    }
    accept(visitor) {
      visitor.visitCondAnd(this);
    }
    eval(context) {
      if (this.$nodes.length) {
        for (const node of this.$nodes) {
          if (!node.eval(context)) {
            return false;
          }
        }
        return true;
      }
      return false;
    }
  };
  var ParensNode = class extends ParentNode {
    constructor(condOr) {
      super([condOr]);
    }
    get type() {
      return NodeType.parens;
    }
    get condOr() {
      return this.$nodes[0];
    }
    set condOr(condOr) {
      this.$nodes = [condOr];
    }
    accept(visitor) {
      visitor.visitParens(this);
    }
    eval(context) {
      return this.$nodes[0].eval(context);
    }
  };
  var HasNode = class extends LeafNode {
    constructor(path2) {
      super([path2]);
    }
    get type() {
      return NodeType.has;
    }
    get path() {
      return this.$tokens[0];
    }
    set path(path2) {
      this.$tokens[0] = path2;
    }
    accept(visitor) {
      visitor.visitHas(this);
    }
    eval(context) {
      return !!get(context, this.path.paths).length;
    }
  };
  var MissingNode = class extends LeafNode {
    constructor(path2) {
      super([path2]);
    }
    get type() {
      return NodeType.missing;
    }
    get path() {
      return this.$tokens[0];
    }
    set path(path2) {
      this.$tokens[0] = path2;
    }
    accept(visitor) {
      visitor.visitMissing(this);
    }
    eval(context) {
      return !get(context, this.path.paths).length;
    }
  };
  var CmpNode = class extends LeafNode {
    constructor(path2, cmpOp, val) {
      super([path2, cmpOp, val]);
    }
    get path() {
      return this.$tokens[0];
    }
    set path(path2) {
      this.$tokens[0] = path2;
    }
    get cmpOp() {
      return this.$tokens[1];
    }
    set cmpOp(cmpOp) {
      this.$tokens[1] = cmpOp;
    }
    get val() {
      return this.$tokens[2];
    }
    set val(val) {
      this.$tokens[2] = val;
    }
    get type() {
      return NodeType.cmp;
    }
    accept(visitor) {
      visitor.visitCmp(this);
    }
    eval(context) {
      const value2 = this.val.value;
      for (const pathValue of get(context, this.path.paths)) {
        if (pathValue.isKind(value2.getKind())) {
          switch (this.cmpOp.type) {
            case TokenType.equals:
              if (pathValue.equals(value2)) {
                return true;
              }
              break;
            case TokenType.notEquals:
              if (!pathValue.equals(value2)) {
                return true;
              }
              break;
            case TokenType.greaterThan:
              if (pathValue.compareTo(value2) === 1) {
                return true;
              }
              break;
            case TokenType.greaterThanOrEqual:
              if (pathValue.compareTo(value2) >= 0) {
                return true;
              }
              break;
            case TokenType.lessThan:
              if (pathValue.compareTo(value2) === -1) {
                return true;
              }
              break;
            case TokenType.lessThanOrEqual:
              if (pathValue.compareTo(value2) <= 0) {
                return true;
              }
              break;
          }
        }
      }
      return false;
    }
  };
  var IsANode = class extends LeafNode {
    constructor(val) {
      super([val]);
    }
    get type() {
      return NodeType.isa;
    }
    get val() {
      return this.$tokens[0];
    }
    set val(val) {
      this.$tokens[0] = val;
    }
    accept(visitor) {
      visitor.visitIsA(this);
    }
    eval(context) {
      const value2 = this.val.value;
      return !!context?.namespace?.reflect(context.dict)?.fits(value2);
    }
  };
  function toRelationshipTokens(rel, term, ref2) {
    const tokens2 = [rel];
    if (term) {
      tokens2.push(term);
    }
    if (ref2) {
      tokens2.push(ref2);
    }
    return tokens2;
  }
  var RelationshipNode = class extends LeafNode {
    constructor(rel, term, ref2) {
      super(toRelationshipTokens(rel, term, ref2));
    }
    get type() {
      return NodeType.rel;
    }
    get rel() {
      return this.$tokens[0];
    }
    set rel(val) {
      this.$tokens[0] = val;
    }
    get term() {
      return this.$tokens.find((t) => t.type === TokenType.symbol);
    }
    set term(term) {
      this.$tokens = toRelationshipTokens(this.rel, term, this.ref);
    }
    get ref() {
      return this.$tokens.find((t) => t.type === TokenType.ref);
    }
    set ref(ref2) {
      this.$tokens = toRelationshipTokens(this.rel, this.term, ref2);
    }
    accept(visitor) {
      visitor.visitRelationship(this);
    }
    eval(context) {
      const relName = this.rel.relationship;
      const relTerm = this.term?.value;
      const ref2 = this.ref?.value;
      return !!context?.namespace?.hasRelationship({
        subject: context.dict,
        relName,
        relTerm,
        ref: ref2,
        resolve: context?.resolve
      });
    }
  };
  var WildcardEqualsNode = class extends LeafNode {
    constructor(path2, ref2) {
      super([path2, ref2]);
    }
    get type() {
      return NodeType.wildcardEq;
    }
    get id() {
      return this.$tokens[0];
    }
    set id(path2) {
      this.$tokens[0] = path2;
    }
    get ref() {
      return this.$tokens[1];
    }
    accept(visitor) {
      visitor.visitWildcardEquals(this);
    }
    eval(context) {
      const wcRef = this.ref.value;
      const paths = this.id.paths;
      const allRefs = /* @__PURE__ */ new Set();
      let ref2 = get(context, paths)[0];
      let matched = false;
      while (valueIsKind(ref2, Kind.Ref)) {
        if (ref2.equals(wcRef)) {
          matched = true;
          break;
        }
        if (context.resolve) {
          if (allRefs.has(ref2.value)) {
            break;
          }
          allRefs.add(ref2.value);
          const dict = context.resolve(ref2);
          if (dict) {
            ref2 = get({ ...context, dict }, paths)[0];
          } else {
            break;
          }
        } else {
          break;
        }
      }
      return matched;
    }
  };
  var _a7;
  _a7 = GRID_STORE_SYMBOL;
  var GridObjStore = class {
    constructor(version, meta, columns, rows) {
      __publicField(this, "version");
      __publicField(this, "meta");
      __publicField(this, "columns");
      __publicField(this, "rows");
      __publicField(this, _a7, GRID_STORE_SYMBOL);
      this.version = version;
      this.meta = meta;
      this.columns = columns;
      this.rows = rows;
    }
    toJSON() {
      return {
        _kind: Kind.Grid,
        meta: {
          [GRID_VERSION_NAME]: this.version,
          ...this.meta.toJSON()
        },
        cols: this.columns.map((column) => ({
          name: column.name,
          meta: column.meta.isEmpty() ? void 0 : column.meta.toJSON()
        })),
        rows: this.rows.map((row) => row.toJSON())
      };
    }
    toJSONString() {
      return JSON.stringify(this.toJSON());
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
  };
  function toMetaZinc(meta) {
    const zinc = meta.toZinc();
    return zinc.substring(1, zinc.length - 1);
  }
  var _grid, _index2;
  var GridDictIterator = class {
    constructor(grid) {
      __privateAdd(this, _grid);
      __privateAdd(this, _index2, 0);
      __privateSet(this, _grid, grid);
    }
    next() {
      const dict = __privateGet(this, _grid).get(__privateWrapper(this, _index2)._++);
      return {
        done: !dict,
        value: dict ? dict : HDict.make()
      };
    }
  };
  _grid = new WeakMap();
  _index2 = new WeakMap();
  function isHaysonGrid(value2) {
    return value2?._kind === Kind.Grid;
  }
  var HGrid = class _HGrid {
    /**
     * Constructs a new grid.
     *
     * ```typescript
     * const grid = new HGrid({
     *   columns: [
     *     {
     *       name: 'name'
     *     },
     *     {
     *       name: 'height'
     *     }
     *   ],
     *   // rows
     *   rows: [
     *     new HDict({ name: HStr.make('Mall'),  height: HNum.make(200, 'm') }),
     *     new HDict({ name: HStr.make('House'), height: HNum.make(30, 'm') })
     *   ]
     * })
     *
     * // The same grid can be specified without any rows. The columns will be dynamically
     * // generated based upon the row data...
     * const grid0 = new HGrid({
     *   rows: [
     *     new HDict({ name: HStr.make('Mall'),  height: HNum.make(200, 'm') }),
     *     new HDict({ name: HStr.make('House'), height: HNum.make(30, 'm') })
     *   ]
     * })
     *
     * // The same grid can be created from a Hayson object.
     * // Again columns don't have to be specified unless precise order and meta data is required...
     * const grid1 = new HGrid({
     *   rows: [
     *     { name: 'Mall', height: { _kind: 'number', val: 200, unit: 'm' } },
     *     { name: 'House', height: { _kind: 'number', val: 30, unit: 'm' } },
     *   ]
     * })
     *
     * // Pass in a haystack value to create a grid...
     * const grid3 = new HGrid(HNum.make(24)) // Creates a grid with one column called 'val' and one row.
     *
     * // Pass in an array of dicts to create a grid...
     * const grid4 = new HGrid([
     *   new HDict({ name: HStr.make('Mall'),  height: HNum.make(200, 'm') }),
     *   new HDict({ name: HStr.make('House'), height: HNum.make(30, 'm') })
     * ])
     *
     * // Pass in an array of Hayson dicts to create a grid...
     * const grid5 = new HGrid([
     *   { name: 'Mall', height: { _kind: 'number', val: 200, unit: 'm' } },
     *   { name: 'House', height: { _kind: 'number', val: 30, unit: 'm' } },
     * ])
     * ```
     *
     * @param value The values used to create a grid.
     */
    constructor(arg) {
      /**
       * The internal grid storage.
       */
      __publicField(this, "$store");
      /**
       * An internal column index cache.
       *
       * This is used to increase the performance of column name look ups.
       */
      __publicField(this, "$columnNameCache");
      if (isHaysonGrid(arg)) {
        this.$store = new GridJsonStore(arg);
      } else if (isGridStore(arg)) {
        this.$store = arg;
      } else {
        let meta;
        let columns;
        let rows;
        let version = DEFAULT_GRID_VERSION;
        const value2 = arg;
        if (value2 === void 0) {
          rows = [];
        } else if (isHVal(value2) || value2 === null) {
          if (valueIsKind(value2, Kind.Grid)) {
            meta = value2.meta;
            columns = value2.getColumns();
            rows = value2.getRows();
            version = value2.version;
          } else if (valueIsKind(value2, Kind.Dict)) {
            rows = [value2];
          } else {
            rows = [HDict.make({ val: value2 })];
          }
        } else if (Array.isArray(value2)) {
          rows = value2.map((dict) => HDict.make(dict));
        } else {
          if (value2.meta) {
            meta = makeValue(value2.meta);
            if (meta.has(GRID_VERSION_NAME)) {
              version = meta.get(GRID_VERSION_NAME)?.value ?? DEFAULT_GRID_VERSION;
              meta.remove(GRID_VERSION_NAME);
            }
          }
          if (value2.columns || value2.cols) {
            columns = (value2.columns ?? value2.cols)?.map(({ name, meta: meta2 }) => ({
              name,
              meta: meta2 ? makeValue(meta2) : void 0
            })) ?? [];
          }
          if (value2.rows) {
            rows = value2.rows?.map((row) => makeValue(row)) ?? [];
          }
          if (value2.version) {
            version = value2.version || DEFAULT_GRID_VERSION;
          }
        }
        this.$store = new GridObjStore(version, meta ?? HDict.make(), (columns ?? []).map((column) => new GridColumn(column.name, column.meta)), rows ?? []);
        if (!columns?.length) {
          this.refreshColumns();
        }
      }
      return this.makeProxy();
    }
    /**
     * Implement proxy to make it easy to get and set internal values.
     */
    makeProxy() {
      const handler = {
        get: function(target, prop) {
          const anyTarget = target;
          return typeof prop === "string" && /^[0-9]+$/.test(prop) ? target.get(Number(prop)) : anyTarget[prop];
        },
        set(target, prop, value2) {
          const anyTarget = target;
          if (typeof prop === "string" && /^[0-9]+$/.test(prop)) {
            target.set(Number(prop), value2);
          } else {
            anyTarget[prop] = value2;
          }
          return true;
        }
      };
      return new Proxy(this, handler);
    }
    get columnNameCache() {
      if (!this.$columnNameCache) {
        this.rebuildColumnCache();
      }
      return this.$columnNameCache;
    }
    rebuildColumnCache() {
      if (!this.$columnNameCache) {
        this.$columnNameCache = {};
      }
      for (const key of Object.keys(this.$columnNameCache)) {
        delete this.$columnNameCache[key];
      }
      for (let i = 0; i < this.$store.columns.length; ++i) {
        this.$columnNameCache[this.$store.columns[i].name] = i;
      }
    }
    /**
     * Makes a new grid.
     *
     * @param value The values used to create a grid.
     * @returns A grid.
     */
    static make(arg) {
      return valueIsKind(arg, Kind.Grid) ? arg : new _HGrid(arg);
    }
    /**
     * @returns The grid's version number.
     */
    get version() {
      return this.$store.version;
    }
    /**
     * Sets the grid's version number.
     */
    set version(version) {
      this.$store.version = version;
    }
    /**
     * The grid's meta data.
     */
    get meta() {
      return this.$store.meta;
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Grid;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return this.$store.toJSON();
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return this.$store.toJSONString();
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return this.$store.toJSONUint8Array();
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return {
        meta: {
          [GRID_VERSION_NAME]: this.version,
          ...this.meta.toJSONv3()
        },
        cols: this.$store.columns.map((column) => ({
          name: column.name,
          ...column.meta.toJSONv3()
        })),
        rows: this.getRows().map((row) => row.toJSONv3())
      };
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A grid isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @param nested An optional flag used to indiciate whether the
     * value being encoded is nested.
     * @returns The encoded zinc string.
     */
    toZinc(nested) {
      let zinc = nested ? "<<\n" : "";
      zinc += `${GRID_VERSION_NAME}:${HStr.make(this.version).toZinc()}`;
      const metaZinc = toMetaZinc(this.meta);
      if (metaZinc) {
        zinc += ` ${metaZinc}`;
      }
      zinc += "\n";
      const rows = this.getRows();
      if (!rows.length && !this.$store.columns.length) {
        zinc += "empty\n";
      } else {
        zinc += this.$store.columns.map((col) => {
          let colZinc = col.name;
          const metaZinc2 = toMetaZinc(col.meta);
          if (metaZinc2) {
            colZinc += ` ${metaZinc2}`;
          }
          return colZinc;
        }).join(",") + "\n";
      }
      zinc += rows.map((row) => this.$store.columns.map((col, index) => {
        const val = row.get(col.name);
        return (index > 0 ? "," : "") + (val === void 0 ? "" : val?.toZinc(
          /*nested*/
          true
        ) ?? ZINC_NULL);
      }).join("")).join("\n") + "\n";
      if (nested) {
        zinc += ">>";
      }
      return zinc;
    }
    /**
     * @returns An Axon encoded string.
     */
    toAxon() {
      let axon = `${HList.make(this.getRows()).toAxon()}.toGrid`;
      if (!this.meta.isEmpty()) {
        axon += `.addMeta(${this.meta.toAxon()})`;
      }
      return axon;
    }
    /**
     * Grid equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      if (!valueIsKind(value2, Kind.Grid)) {
        return false;
      }
      if (this.version !== value2.version) {
        return false;
      }
      if (!this.meta.equals(value2.meta)) {
        return false;
      }
      if (this.$store.columns.length !== value2.$store.columns.length) {
        return false;
      }
      for (let i = 0; i < this.$store.columns.length; ++i) {
        if (!this.$store.columns[i].equals(value2.$store.columns[i])) {
          return false;
        }
      }
      if (this.length !== value2.length) {
        return false;
      }
      for (let i = 0; i < this.length; ++i) {
        const row0 = this.get(i);
        const row1 = value2.get(i);
        if (!row0?.equals(row1)) {
          return false;
        }
      }
      return true;
    }
    /**
     * Compares two grids.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive.
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Grid)) {
        return -1;
      }
      const zinc0 = this.toZinc();
      const zinc1 = value2.toZinc();
      if (zinc0 < zinc1) {
        return -1;
      }
      if (zinc0 === zinc1) {
        return 0;
      }
      return 1;
    }
    /**
     * Return all the rows of the grid.
     *
     * ```typescript
     * const anArrayOfDicts = grid.getRows()
     * ```
     *
     * @returns All rows in the grid.
     */
    getRows() {
      return this.$store.rows;
    }
    /**
     * Return a row or undefined if it can't find it via its
     * row number.
     *
     * ```typescript
     * // Get a dict at a given index or returned undefined if it can't be found.
     * const dict = grid.get(0)
     * if (dict) {
     *   // Do something
     * }
     * ```
     *
     * @param index The index number of the row.
     * @returns The dict or undefined if it does not exist.
     */
    get(index) {
      this.checkRowIndexNum(index);
      return this.$store.rows[index];
    }
    /**
     * Return the first row in the grid or undefined if it can't be found.
     *
     * ```typescript
     * const dict = grid.first
     * if (dict) {
     *   // Do something
     * }
     * ```
     *
     * @returns The dict or undefined if it does not exist.
     */
    get first() {
      return this.get(0);
    }
    /**
     * Return the last row in the grid or undefined if it can't be found.
     *
     * ```typescript
     * const dict = grid.last
     * if (dict) {
     *   // Do something
     * }
     * ```
     *
     * @returns The dict or undefined if it does not exist.
     */
    get last() {
      return this.get(Math.max(0, this.length - 1));
    }
    /**
     * Remove the row from the grid via its index number of a haystack filter.
     *
     * ```typescript
     * // Remove a row via its index
     * grid.remove(0)
     *
     * // Remove multiple rows via a Haystack Filter
     * grid.remove('foo == "baa"')
     * ```
     *
     * @param filter A haystack filter, index number or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns The rows that were removed. If no rows were removed then the is empty.
     */
    remove(filter, cx) {
      let removed;
      if (typeof filter === "string" || isNode(filter)) {
        removed = [];
        const toRemove = [];
        this.runFilter(filter, (match, row, index) => {
          if (match) {
            toRemove.push(index);
            removed.push(row);
          }
          return true;
        }, cx);
        for (let i = toRemove.length - 1; i >= 0; --i) {
          this.getRows().splice(toRemove[i], 1);
        }
      } else {
        const index = filter;
        this.checkRowIndexNum(index);
        removed = this.getRows().splice(index, 1);
      }
      return removed;
    }
    /**
     * Filter the grid with the haystack filter and return a new grid with the results.
     *
     * ```typescript
     * // Filter a grid with a haystack filter
     * const newGridWithFoo = grid.filter('foo')
     *
     * // Filter a grid with a function callback
     * const newGridWithFooAgain = grid.filter((row: HDict): boolean => row.has('foo'))
     * ```
     *
     * @param filter The haystack filter, AST node or filter function callback.
     * @param cx Optional haystack filter evaluation context.
     * @returns A new filtered grid.
     */
    filter(filter, cx) {
      const grid = _HGrid.make({
        meta: this.meta,
        rows: [],
        version: this.version
      });
      if (typeof filter === "function") {
        for (const row of this.getRows().filter(filter)) {
          grid.add(row);
        }
      } else {
        this.runFilter(filter, (match, row) => {
          if (match) {
            grid.add(row);
          }
          return true;
        }, cx);
      }
      this.syncColumnMeta(grid);
      return grid;
    }
    /**
     * Synchronize column meta information from this grid to the specified grid.
     *
     * @param grid The grid to synchronize data to.
     */
    syncColumnMeta(grid) {
      for (const col of this.getColumns()) {
        const newCol = grid.getColumn(col.name);
        if (newCol && !newCol.meta.equals(col.meta)) {
          newCol.meta.clear();
          newCol.meta.update(col.meta);
        }
      }
    }
    /**
     * Filters an individual column in a grid.
     *
     * For example, if a particular column in a grid holds a list.
     * The inner filter can be run against all of the list values
     * held in that column.
     *
     * The filter can be run against a list, dict or grid.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { list: [ 'foo', 'boo', 'goo' ] },
     *     { list: [ 'foo', 'boo1', 'goo1' ] },
     *     { list: [ 'doo', 'boo1', 'goo1' ] },
     *   ]
     * })
     *
     * // Returns a grid with only the first two rows.
     * const newGrid = grid.filterBy('list', 'item == "foo"')
     * ```
     *
     * @param name The name of the column that holds the list values.
     * @param innerFilter The haystack filter to run against the list.
     * @param cx Optional haystack filter evaluation context.
     * @returns A filtered grid.
     */
    filterBy(name, innerFilter, cx) {
      const node = typeof innerFilter === "string" ? HFilter.parse(innerFilter) : innerFilter;
      cx = {
        namespace: cx?.namespace,
        resolve: this.makeResolveFunc()
      };
      return this.filter((row) => {
        const val = row.get(name);
        if (valueIsKind(val, Kind.List) || valueIsKind(val, Kind.Grid)) {
          return val.any(node, cx);
        } else if (valueIsKind(val, Kind.Dict)) {
          return val.matches(node, cx);
        } else {
          return false;
        }
      });
    }
    /**
     * Provide a grid with unique values in the specified columns.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     * 	   { id: 1, name: 'Jason' },
     * 	   { id: 2, name: 'Gareth' },
     * 	   { id: 3, name: 'Gareth' },
     *   ]
     * })
     *
     * // Returns a new grid with rows 1 and 2.
     * const uniqueGrid = grid.unique('name')
     * ```
     *
     * @param names The column names.
     * @returns The filtered grid instance.
     */
    uniqueBy(names) {
      const uniqueNames = Array.isArray(names) ? names : [names];
      const grid = _HGrid.make({
        meta: this.meta,
        rows: [],
        version: this.version
      });
      let rows = this.getRows();
      rows = rows.filter((dict) => {
        for (const name of uniqueNames) {
          if (!dict.has(name)) {
            return false;
          }
        }
        return true;
      });
      rows = rows.filter((dict, index) => {
        for (let i = 0; i < index; ++i) {
          let duplicates = 0;
          for (const name of uniqueNames) {
            const val0 = dict.get(name);
            const val1 = rows[i].get(name);
            if (valueEquals(val0, val1)) {
              ++duplicates;
            } else {
              break;
            }
          }
          if (duplicates === uniqueNames.length) {
            return false;
          }
        }
        return true;
      });
      if (rows.length) {
        grid.add(rows);
        this.syncColumnMeta(grid);
      }
      return grid;
    }
    /**
     * Return true if the filter matches at least one row.
     *
     * ```typescript
     * if (grid.any('site')) {
     *   // The grid has some sites.
     * }
     * ```
     *
     * @param filter The haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns true if there's at least one match
     */
    any(filter, cx) {
      let result = false;
      this.runFilter(filter, (match) => {
        if (match) {
          result = true;
          return false;
        }
        return true;
      }, cx);
      return result;
    }
    /**
     * Return the first row dict that matches the filter or undefined if nothing is found.
     *
     * ```typescript
     * const dict = grid.find('site'))
     * ```
     *
     * @param filter The haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns The first row dict that matches the filter.
     */
    find(filter, cx) {
      let result;
      this.runFilter(filter, (match, row) => {
        if (match) {
          result = row;
          return false;
        }
        return true;
      }, cx);
      return result;
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * This is the same as the `any` method.
     *
     * ```typescript
     * if (grid.matches('site')) {
     *   // The grid has some sites.
     * }
     * ```
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return this.any(filter, cx);
    }
    /**
     * Return true if the filter matches at least one cell
     * in a particular column in the grid.
     *
     * This filter runs on the data held in the particular column.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { list: [ 'foo', 'boo', 'goo' ] },
     *     { list: [ 'foo', 'boo1', 'goo1' ] },
     *     { list: [ 'doo', 'boo1', 'goo1' ] },
     *   ]
     * })
     *
     * if (grid.anyBy('list', 'item === "foo"')) {
     *   // One or more of the items in the list contains 'foo'
     * }
     * ```
     *
     * @param filter The haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns true if there's at least one match
     */
    anyBy(name, innerFilter, cx) {
      const node = typeof innerFilter === "string" ? HFilter.parse(innerFilter) : innerFilter;
      cx = {
        namespace: cx?.namespace,
        resolve: this.makeResolveFunc()
      };
      for (const row of this) {
        const val = row.get(name);
        if (valueIsKind(val, Kind.List) || valueIsKind(val, Kind.Grid)) {
          if (val.any(node, cx)) {
            return true;
          }
        } else if (valueIsKind(val, Kind.Dict)) {
          if (val.matches(node, cx)) {
            return true;
          }
        }
      }
      return false;
    }
    /**
     * Return true if the filter matches at least one row.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { name: 'Fred' },
     *     { name: 'Fred' },
     *     { name: 'Fred' },
     *   ]
     * })
     *
     * if (grid.all('name == "Fred")) {
     *   // All rows in the grid have the name Fred.
     * }
     * ```
     *
     * @param filter The haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns true if there's at least one match
     */
    all(filter, cx) {
      if (this.isEmpty()) {
        return false;
      }
      let result = true;
      this.runFilter(filter, (match) => {
        if (!match) {
          result = false;
          return false;
        }
        return true;
      }, cx);
      return result;
    }
    /**
     * Return true if the filter matches all the values
     * in a particular column in the grid.
     *
     * This filter runs on the data held in the particular column.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { list: [ 'foo', 'foo', 'foo' ] },
     *     { list: [ 'foo', 'foo', 'foo' ] },
     *     { list: [ 'foo', 'foo', 'foo' ] },
     *   ]
     * })
     *
     * if (grid.allBy('list', 'item == "foo"')) {
     *   // True if all the lists contain all foos.
     * }
     * ```
     *
     * @param filter The haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns true if there's at least one match
     */
    allBy(name, innerFilter, cx) {
      const node = typeof innerFilter === "string" ? HFilter.parse(innerFilter) : innerFilter;
      if (this.isEmpty()) {
        return false;
      }
      cx = {
        namespace: cx?.namespace,
        resolve: this.makeResolveFunc()
      };
      for (const row of this) {
        const val = row.get(name);
        if (valueIsKind(val, Kind.List) || valueIsKind(val, Kind.Grid)) {
          if (!val.all(node, cx)) {
            return false;
          }
        } else if (valueIsKind(val, Kind.Dict)) {
          if (val.matches(node, cx)) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    }
    /**
     * Run the filter. For each match invoke the callback function.
     *
     * The callback takes a match flag, a row and an index argument. If false is returned
     * the filter stops running.
     *
     * @param filter The haystack filter to run or an AST node.
     * @param callback The callback invoked for each match.
     * @param cx Optional haystack filter evaluation context.
     */
    runFilter(filter, callback, cx) {
      const hfilter = new HFilter(filter);
      const context = {
        dict: HDict.make(),
        resolve: this.makeResolveFunc(),
        namespace: cx?.namespace
      };
      let i = 0;
      for (const dict of this) {
        context.dict = dict;
        if (!callback(hfilter.eval(context), dict, i++)) {
          break;
        }
      }
    }
    /**
     * Return a function that when called will search for a
     * dict (record) via its id.
     *
     * The method lazily optimizes the request by indexing the grid's id.
     *
     * @returns  The evaluation context resolve method for a grid.
     */
    makeResolveFunc() {
      let ids;
      return (ref2) => {
        if (!ids) {
          ids = /* @__PURE__ */ new Map();
          if (this.hasColumn("id")) {
            for (const row of this) {
              const id = row.get("id");
              if (valueIsKind(id, Kind.Ref)) {
                ids.set(id.value, row);
              }
            }
          }
        }
        return ids.get(ref2.value);
      };
    }
    /**
     * A mapping function that maps from an array of dicts into something else.
     *
     * ```typescript
     * // Map each row to a div using React...
     * grid.map((dict: HDict) => <div>{dict.toZinc()}</div>>)
     * ```
     *
     * @param callback A mapping callback that takes a row dict, an index number
     * and returns a new value.
     */
    map(callback) {
      return this.getRows().map(callback);
    }
    /**
     * Reduce the rows in a grid.
     *
     * ```typescript
     * // Reduce the grid down to one row...
     * grid = HGrid.make({
     *   rows: [
     *     { a: 1, b: 2 },
     *     { a: 3, b: 4 },
     *   ],
     * })
     *
     * grid.reduce((prev, cur): HGrid => {
     *   const dict = prev.get(0)
     *
     *   if (dict) {
     *     dict.set('a', Number(cur.get<HNum>('a')?.value) + Number(dict.get<HNum>('a')?.value))
     *     dict.set('b', Number(cur.get<HNum>('b')?.value) + Number(dict.get<HNum>('b')?.value))
     *   }
     *
     *   return prev
     *}, HGrid.make({ rows: [{ a: 0, b: 0 }] }))
     * ```
     *
     * @param callback The reducer callback. This method will be called with the previous and
     * current rows (dicts) as well as the index number.
     * @param initialValue Optional initial value for the reduce.
     */
    reduce(callback, initialValue) {
      return initialValue === void 0 ? this.getRows().reduce(callback) : this.getRows().reduce(callback, initialValue);
    }
    /**
     * ```typescript
     * // The number of rows in a grid.
     * console.log(grid.length)
     * ```
     *
     * @returns The total number of rows.
     */
    get length() {
      return this.$store.rows.length;
    }
    /**
     * Set the values or dict for an individual row.
     *
     * ```typescript
     * // Set a row in a grid.
     * grid.set(0, new HDict({ foo: HStr.make('foobar') }))
     *
     * // Set a row via Hayson.
     * grid.set(0, { foo: 'foobar' })
     * ```
     *
     * @param index The index number of the row.
     * @param values The dict or Hayson Dict.
     * @returns The grid instance.
     * @throws An error if the index is invalid or the number of rows incorrect.
     */
    set(index, values) {
      const dict = makeValue(values);
      if (!dict.isKind(Kind.Dict)) {
        throw new Error("Invalid value");
      }
      this.checkRowIndexNum(index);
      this.addMissingColumns(dict);
      this.getRows()[index] = dict;
      return this;
    }
    /**
     * Refreshes a grid's columns based upon the rows in the grid.
     */
    refreshColumns() {
      for (const row of this.getRows()) {
        this.addMissingColumns(row);
      }
    }
    /**
     * Adds any missing columns for the dict.
     *
     * @param dict The dict to check.
     */
    addMissingColumns(dict) {
      for (const key of dict.keys) {
        if (!this.hasColumn(key)) {
          this.addColumn(key);
        }
      }
    }
    /**
     * Add a single or multiple rows using dicts.
     *
     * This method can be called in different ways to add multiple rows at a time.
     *
     * ```typescript
     * // Add a single dict.
     * grid.add(new HDict({ foo: HStr.make('bar') }))
     *
     * // Add multiple dicts.
     * grid.add(new HDict({ foo: HStr.make('bar') }), new HDict({ foo: HStr.make('bar') }))
     *
     * // Add multiple dicts using an array...
     * grid.add([new HDict({ foo: HStr.make('bar') }), new HDict({ foo: HStr.make('bar') })])
     *
     * // Same but using Hayson...
     * grid.add({ foo: 'bar' }))
     * grid.add({ foo: 'bar' }), { foo: 'bar' })
     * grid.add([{ foo: 'bar' }), { foo: 'bar' }])
     * ```
     * @param rows The rows to add.
     * @returns The grid instance.
     * @throws If the values being added are not dicts.
     */
    add(...rows) {
      const toAdd = _HGrid.toDicts(rows);
      if (!toAdd.length) {
        throw new Error("No dicts to add to grid");
      }
      for (let row of toAdd) {
        row = makeValue(row);
        if (!valueIsKind(row, Kind.Dict)) {
          throw new Error("Row is not a dict");
        }
        this.addMissingColumns(row);
        this.getRows().push(row);
      }
      return this;
    }
    /**
     * Insert rows as dicts at the specified index.
     *
     * ```typescript
     * // Insert a single dict.
     * grid.insert(1, new HDict({ foo: HStr.make('bar') }))
     *
     * // Insert multiple dicts.
     * grid.insert(1, new HDict({ foo: HStr.make('bar') }), new HDict({ foo: HStr.make('bar') }))
     *
     * // Insert multiple dicts using an array...
     * grid.insert(1, [new HDict({ foo: HStr.make('bar') }), new HDict({ foo: HStr.make('bar') })])
     *
     * // Same but using Hayson...
     * grid.insert(1, { foo: 'bar' }))
     * grid.insert(1, { foo: 'bar' }), { foo: 'bar' })
     * grid.insert(1, [{ foo: 'bar' }), { foo: 'bar' }])
     * ```
     *
     * @param index The index number to insert the rows at.
     * @param rows The rows to insert.
     * @returns The grid instance.
     * @throws An error if the index is invalid or the rows are not dicts.
     */
    insert(index, ...rows) {
      const toInsert = _HGrid.toDicts(rows);
      if (!toInsert.length) {
        throw new Error("No dicts to insert into grid");
      }
      if (index < 0) {
        throw new Error("Index cannot be less than zero");
      }
      if (index > this.length) {
        throw new Error("Index not in range");
      }
      for (let row of toInsert) {
        row = makeValue(row);
        if (!valueIsKind(row, Kind.Dict)) {
          throw new Error("Row is not a dict");
        }
        this.addMissingColumns(row);
        this.getRows().splice(index++, 0, row);
      }
      return this;
    }
    /**
     * Sort the grid in ascending order via a column name. This also
     * supports sorting via multiple column names.
     *
     * Precedence is given to the first columns in the table.
     *
     * ```typescript
     * // Sorts the grid in ascending order by 'foo'
     * grid.sortBy('foo')
     *
     * // Sorts the grid in ascending order by 'foo' and then by 'boo'
     * grid.sortBy(['foo', 'boo'])
     * ```
     *
     * @param names The name of the column to sort by.
     * @returns The grid instance.
     */
    sortBy(names) {
      const sortNames = Array.isArray(names) ? names : [names];
      if (sortNames.length) {
        this.getRows().sort((first2, second) => {
          for (const name of sortNames) {
            const firstVal = first2.get(name);
            const secondVal = second.get(name);
            if (firstVal && secondVal) {
              const res = firstVal.compareTo(secondVal);
              if (res !== 0) {
                return res;
              }
            }
          }
          return -1;
        });
      }
      return this;
    }
    /**
     * Reverses the order of all the rows in the grid.
     *
     * ```typescript
     * // Sort the grid in descending order by foo
     * grid.sortBy('foo').reverse()
     * ```
     */
    reverse() {
      this.getRows().reverse();
    }
    /**
     * Returns a flattened array of dicts.
     *
     * @param rows The rows to flatten into an array of dicts.
     * @returns An array of dicts.
     */
    static toDicts(rows) {
      const dicts = [];
      for (const row of rows) {
        if (Array.isArray(row)) {
          for (const innerRow of row) {
            dicts.push(makeValue(innerRow));
          }
        } else {
          dicts.push(makeValue(row));
        }
      }
      return dicts;
    }
    /**
     * ```typescript
     * // Create a grid with no rows (still retains column and meta).
     * grid.clear()
     * ```
     *
     * Clear all the rows from the grid.
     */
    clear() {
      this.getRows().splice(0, this.length);
    }
    /**
     * Return an array of column information.
     *
     * ```typescript
     * // Return an array of column objects.
     * const cols = grid.getColumns()
     * ```
     *
     * @returns A copy of the grid's columns.
     */
    getColumns() {
      return [...this.$store.columns];
    }
    /**
     * Return the column names (not display names).
     *
     * @returns The column names.
     */
    getColumnNames() {
      return this.$store.columns.map((col) => col.name);
    }
    /**
     * Add a column and return its new instance.
     *
     * If the column is already available then update it.
     *
     * ```typescript
     * grid.addColumn('Address', new HDict({ length: 30 }))
     * ```
     *
     * @param name The name of the column.
     * @param meta The column's meta data.
     * @returns The new column or the one already found.
     */
    addColumn(name, meta) {
      const index = this.columnNameCache[name];
      if (typeof index === "number") {
        return this.setColumn(index, name, meta || HDict.make());
      } else {
        const column = new GridColumn(name, meta || HDict.make());
        this.$store.columns.push(column);
        this.rebuildColumnCache();
        return column;
      }
    }
    /**
     * Does the grid have the specified column?
     *
     * ```typescript
     * if (grid.hasColumn('Address)) {
     *   // The grid has a column called address.
     * }
     * ```
     *
     * @param name The name of the column.
     * @returns True if the grid has the column.
     */
    hasColumn(name) {
      return this.columnNameCache[name] !== void 0;
    }
    /**
     * Set the column at the specified index number.
     *
     * ```typescript
     * // Set the column at the specified index with the new name and length.
     * grid.setColumn(3, 'Address', new HDict({ length: 30 }))
     * ```
     *
     * @param index The zero based index number of the column.
     * @param name The name of the column.
     * @param meta Optional column's meta data.
     * @returns The updated column.
     * @throws An error if index does not exist in the columns.
     */
    setColumn(index, name, meta) {
      if (!this.$store.columns[index]) {
        throw new Error("Cannot set an invalid column");
      }
      const column = new GridColumn(name, meta || HDict.make());
      this.$store.columns[index] = column;
      this.columnNameCache[column.name] = index;
      return column;
    }
    /**
     * Returns a grid column via its name or index number. If it can't be found
     * then return undefined.
     *
     * ```typescript
     * // Get the column at the specified index or return undefined
     * const col = grid.getColumn('Address')
     * if (col) {
     *   // Do something
     * }
     *
     * // Alternatively use the column index to get the column
     * const col1 = grid.getColumn(3)
     * if (col1) {
     *   // Do something
     * }
     * ```
     *
     * @param index The column index number or name.
     * @returns The column or undefined if not found.
     */
    getColumn(index) {
      let column;
      if (typeof index === "number") {
        column = this.$store.columns[index];
      } else if (typeof index === "string") {
        const i = this.columnNameCache[index];
        if (i !== void 0) {
          column = this.$store.columns[i];
        }
      } else {
        throw new Error("Invalid input");
      }
      return column;
    }
    /**
     * Returns the number of columns.
     *
     * ```typescript
     * console.log('The table has this many columns: ' + grid.getColumnsLength())
     * ```
     *
     * @returns The number of columns.
     */
    getColumnsLength() {
      return this.$store.columns.length;
    }
    /**
     * Reorder the columns with the specified new order of names.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   columns: [
     *     { name: 'b' },
     *     { name: 'c' },
     *     { name: 'a' },
     *   ]
     * })
     *
     * // Reorder the columns to be a, b and then c.
     * grid.reorderColumns([ 'a', 'b', 'c' ])
     * ```
     *
     * @param names The new order of column names to use.
     */
    reorderColumns(names) {
      const colNames = Array.isArray(names) ? names : [names];
      this.$store.columns = this.$store.columns.sort((first2, second) => {
        let firstIndex = 0;
        let secondIndex = 0;
        for (let i = 0; i < colNames.length; ++i) {
          if (colNames[i] === first2.name) {
            firstIndex = i;
          }
          if (colNames[i] === second.name) {
            secondIndex = i;
          }
        }
        return firstIndex - secondIndex;
      });
      this.rebuildColumnCache();
    }
    /**
     * Return a haystack list for all the values in
     * the specified column.
     *
     * If the column can't be found then an empty list is returned.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { name: 'Gareth', id: 1 },
     *     { name: 'Jason', id: 2 },
     *     { name: 'Radu', id: 3 },
     *   ]
     * })
     *
     * // Returns an HList<HStr> of the names (Gareth, Jason and Radu).
     * const listOfNames = grid.listBy<HStr>('name')
     * ```
     *
     * @param column The column name, column index or instance to
     * create the list from.
     */
    listBy(column) {
      let name;
      if (isGridColumn(column)) {
        for (let i = 0; i < this.$store.columns.length; ++i) {
          if (column.name === this.$store.columns[i].name) {
            name = column.name;
            break;
          }
        }
      } else {
        switch (typeof column) {
          case "string":
            name = column;
            break;
          case "number":
            const col = this.$store.columns[column];
            if (col) {
              name = col.name;
            }
        }
      }
      if (name === void 0) {
        return HList.make([]);
      }
      const values = this.getRows().map((row) => row.get(name)).filter((value2) => value2 !== void 0);
      return HList.make(values);
    }
    /**
     * Limit the grid only to the specified columns.
     *
     * This will return a new instance of a grid.
     *
     * ```typescript
     * grid.filter('site').limitColumns(['id', 'dis']).inspect()
     * ```
     *
     * @param names The column names.
     * @returns A new grid instance with the specified columns.
     */
    limitColumns(names) {
      return _HGrid.make({
        version: this.version,
        meta: this.meta.newCopy(),
        rows: this.getRows().map((dict) => {
          const newDict = new HDict();
          for (const name of names) {
            if (dict.has(name)) {
              newDict.set(name, dict.get(name));
            }
          }
          return newDict;
        }),
        columns: this.getColumns().filter((col) => names.includes(col.name)).map((col) => ({ name: col.name, meta: col.meta.newCopy() }))
      });
    }
    /**
     * Iterate over a grid using dicts for rows.
     *
     * This enables a 'for ... of' loop to be used directly on an iterator.
     *
     * @returns A new iterator for a grid.
     *
     * ```typescript
     * // Iterate a grid
     * for (let dict of grid) {
     *   console.log(dict)
     * }
     *
     * // Destructure a grid into an array of dicts...
     * const fooDict = [...grid].filter((dict): boolean => dict.get('foo') === 'foo')[0]
     * ```
     */
    [Symbol.iterator]() {
      return new GridDictIterator(this);
    }
    /**
     * ```typescript
     * if (grid.isEmpty()) {
     *   // Grid is empty.
     * }
     * ```
     *
     * @returns true if the grid is empty.
     */
    isEmpty() {
      return this.length === 0;
    }
    /**
     * Selects a range from the grid.
     *
     * The start and end can be used to specify a range...
     * ```typescript
     * // from [0, 1, 2, 3, 4, 5] to [1, 2, 3, 4]
     * grid.filter('site').range(1, 4).inspect()
     * ```
     *
     * //If only the first argument then a quantity can be used...
     * ```typescript
     * // select the first 4 rows - [0, 1, 2, 4]...
     * grid.filter('site').range(4).inspect()
     * ```
     *
     * @param startOrQuantity The start of the range or quantity.
     * @param end Optional end range.
     * @returns This grid instance.
     */
    range(startOrQuantity, end) {
      const rows = this.getRows();
      if (end === void 0) {
        end = --startOrQuantity;
        startOrQuantity = 0;
      }
      if (startOrQuantity <= end) {
        for (let i = rows.length; i >= 0; --i) {
          if (i < startOrQuantity || i > end) {
            this.remove(i);
          }
        }
      }
      return this;
    }
    /**
     * Return the sum of values for the specified column.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { id: 34, num: 1 },
     *     { id: 35, num: 2 },
     *     { id: 36, num: 3 },
     *   ]
     * })
     * // Sum all the values in the num column (6)
     * const sum = grid.sumOf('num')
     * ```
     *
     * @param column The column name, column index or column instance.
     * @returns The sum of all the numeric values.
     */
    sumOf(column) {
      return this.listBy(column).sum;
    }
    /**
     * Return the maximum value in the specified column.
     *
     * If there are no numbers then Number.MIN_SAFE_INTEGER is returned.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { id: 34, num: 1 },
     *     { id: 35, num: 2 },
     *     { id: 36, num: 3 },
     *   ]
     * })
     * // Return the maximum value in the num column (3).
     * const max = grid.maxOf('num')
     * ```
     *
     * @param column The column name, column index or column instance.
     * @returns The maximum numerical value found.
     */
    maxOf(column) {
      return this.listBy(column).max;
    }
    /**
     * Return the minimum of value in the specified column.
     *
     * If there are no numbers then Number.MAX_SAFE_INTEGER is returned.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { id: 34, num: 1 },
     *     { id: 35, num: 2 },
     *     { id: 36, num: 3 },
     *   ]
     * })
     * // Return the maximum value in the num column (1).
     * const min = grid.minOf('num')
     * ```
     *
     * @param column The column name, column index or column instance.
     * @returns The minimum numerical value found.
     */
    minOf(column) {
      return this.listBy(column).min;
    }
    /**
     * Return the sum of values for the specified column.
     *
     * If there are no numbers then Number.NaN is returned.
     *
     * ```typescript
     * const grid = HGrid.make({
     *   rows: [
     *     { id: 34, num: 1 },
     *     { id: 35, num: 2 },
     *     { id: 36, num: 3 },
     *   ]
     * })
     * // Return average of the num column (2).
     * const avg = grid.avgOf('num')
     * ```
     *
     * @param column The column name, column index or column instance.
     * @returns The average of all the numeric values.
     */
    avgOf(column) {
      return this.listBy(column).avg;
    }
    /**
     * ```typescript
     * if (grid.isError()) {
     *   // Do something.
     * }
     * ```
     *
     * @returns true if the grid has an error associated with it.
     */
    isError() {
      return this.meta.has("err");
    }
    /**
     * ```typescript
     * const err = grid.getError()
     * if (err) {
     *   // Do something with the error.
     * }
     * ```
     *
     * @returns Error information or undefined if not available.
     */
    getError() {
      if (!this.isError()) {
        return void 0;
      }
      const errType = this.meta.get("errType");
      const errTrace = this.meta.get("errTrace");
      const dis2 = this.meta.get("dis");
      return {
        type: errType && errType.value || "",
        trace: errTrace && errTrace.value || "",
        dis: dis2 && dis2.value || ""
      };
    }
    /**
     * @returns The grid as an array like object.
     */
    asArrayLike() {
      return this;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return `[${this.getRows().map((dict) => String(dict)).join(", ")}]`;
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      if (message) {
        console.log(String(message));
      }
      console.table(this.getRows().map((row) => {
        const obj = {};
        for (const val of row) {
          obj[val.name] = String(val.value);
        }
        return obj;
      }));
      return this;
    }
    /**
     * Check whether the index number for the row is a valid number.
     *
     * @param index The row index number to check.
     * @throws An error if the index number is invalid.
     */
    checkRowIndexNum(index) {
      if (index < 0) {
        throw new Error("Row index must be greater than zero");
      }
    }
    /**
     * @returns Returns a copy of the grid.
     */
    newCopy() {
      return _HGrid.make({
        version: this.version,
        meta: this.meta.newCopy(),
        rows: this.getRows().map((dict) => dict.newCopy()),
        columns: this.getColumns().map((col) => ({ name: col.name, meta: col.meta.newCopy() }))
      });
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return this;
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make(this.getRows());
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      const rows = this.getRows();
      for (let i = 0; i < rows.length; ++i) {
        rows[i];
      }
      return HDict.make(this);
    }
  };
  var __decorate$1 = function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var TIMEZONE_PREFIXES = [
    "Africa",
    "America",
    "Antarctica",
    "Asia",
    "Atlantic",
    "Australia",
    "Brazil",
    "Canada",
    "Chile",
    "Etc",
    "Europe",
    "Indian",
    "Mexico",
    "Pacific",
    "US",
    "America/Argentina",
    "America/Indiana",
    "America/Kentucky",
    "America/North_Dakota"
  ];
  function defaultIsValidTimeZone(timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
      return true;
    } catch {
      return false;
    }
  }
  var _iso, _value9, _timezone;
  var _HDateTime = class _HDateTime {
    /**
     * Constructs a new haystack date time.
     *
     * @param value The date time as a string, a JS Date or Hayson date object.
     */
    constructor(value2) {
      /**
       * An internal cached date string value in an ISO 8601 format.
       */
      __privateAdd(this, _iso);
      /**
       * Internal implementation.
       */
      __privateAdd(this, _value9);
      /**
       * Internal timezone.
       */
      __privateAdd(this, _timezone);
      let val = "";
      let tz = "";
      if (value2) {
        if (typeof value2 === "string") {
          val = value2;
        } else if (value2 instanceof Date) {
          val = value2.toISOString();
        } else {
          const obj = value2;
          val = obj.val;
          if (obj.tz) {
            tz = obj.tz;
          }
        }
      }
      if (!val) {
        throw new Error("Invalid date");
      }
      const result = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.]\d+)?)(Z|(?:[-+]\d{2}:\d{2}))(?: (.+))?$/.exec(val) ?? [];
      let [, , offset, timezone] = result;
      const [, dateTime] = result;
      if (!dateTime || !offset) {
        throw new Error("Invalid date format");
      }
      if (tz) {
        timezone = tz;
      }
      if (!timezone) {
        timezone = _HDateTime.fromGmtOffset(offset);
        if (timezone === "UTC") {
          offset = "Z";
        }
      }
      __privateSet(this, _iso, `${dateTime}${offset}`);
      __privateSet(this, _value9, `${dateTime}${offset}${offset === "Z" ? "" : ` ${timezone}`}`);
      __privateSet(this, _timezone, timezone || "UTC");
    }
    /**
     * Calculate the GMT offset to use as a fallback timezone.
     *
     * @param offset The string encoded offset (-/+HH:MM) or Z.
     * @returns The calculated GMT offset.
     */
    static fromGmtOffset(offset) {
      if (offset === "Z") {
        return "UTC";
      }
      const negative = offset[0] === "-";
      const hours = Number(offset.substring(1, 3));
      return hours ? `GMT${negative ? "+" : "-"}${hours}` : "UTC";
    }
    /**
     * Factory method for a haystack date time.
     *
     * @param value The date time as a string, a JS Date or Hayson date object.
     * @returns A haystack date time.
     */
    static make(value2) {
      if (valueIsKind(value2, Kind.DateTime)) {
        return value2;
      } else {
        return new _HDateTime(value2);
      }
    }
    /**
     * @returns The date time value.
     */
    get value() {
      return __privateGet(this, _value9);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The date time in an ISO 8601 format.
     */
    get iso() {
      return __privateGet(this, _iso);
    }
    /**
     * @returns The timezone.
     */
    get timezone() {
      return __privateGet(this, _timezone);
    }
    /**
     * @returns The date time object as a JavaScript date.
     */
    get date() {
      return new Date(this.iso);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.DateTime;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /**
     * @returns Now as a date time object.
     */
    static now() {
      return _HDateTime.make(/* @__PURE__ */ new Date());
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return this.date.toLocaleString() + (this.timezone ? ` ${this.timezone}` : "");
    }
    /**
     * @returns The encoded date time value.
     */
    valueOf() {
      return this.value;
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return this.value;
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.DateTime) && value2.value === this.value;
    }
    /**
     * Compares two date times.
     *
     * @param value The value value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.DateTime)) {
        return -1;
      }
      if (this.date < value2.date) {
        return -1;
      } else if (this.date > value2.date) {
        return 1;
      } else {
        return 0;
      }
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A dict isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      const json = {
        _kind: this.getKind(),
        val: this.iso
      };
      const tz = this.timezone;
      if (tz !== "UTC") {
        json.tz = tz;
      }
      return json;
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return `t:${this.toZinc()}`;
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      const date = this.date;
      return `dateTime(${HDate.make(date).toAxon()},${HTime.make(date).toAxon()},"UTC")`;
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make([this]);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
    /**
     * Return the full IANA timezone name or an empty string if it can't be found.
     *
     * @param isValidTimeZone An optional callback invoked to see if the timezone is valid.
     * @returns The IANA timezone name or an empty string if the timezone name isn't valid.
     */
    getIANATimeZone(isValidTimeZone = defaultIsValidTimeZone) {
      return _HDateTime.getIANATimeZone(__privateGet(this, _timezone), isValidTimeZone);
    }
    /**
     * Return the full IANA timezone name or an empty string if it can't be found.
     *
     * The timezone name can be a full existing timezone or an alias.
     *
     * Since a vanilla JavaScript environment doesn't have support for querying the IANA database,
     * a callback function needs to be passed in to query the local database implementation.
     *
     * Here's an example that uses [Luxon](https://moment.github.io/luxon/index.html)...
     * ```typescript
     * import { DateTime } from 'luxon'
     * ...
     * const isValidTimeZone = (timezone: string): boolean =>
     *   !!DateTime.now().setZone(timezone).isValid
     *
     * const tz = getIANATimeZone('New_York', isValidTimeZone) // Returns 'America/New_York'.
     * ...
     * ```
     *
     * Here's an example that uses [Moment with timezones](https://momentjs.com/timezone/docs/)...
     * ```typescript
     * import * as moment from 'moment-timezone'
     * ...
     * const isValidTimeZone = (timezone: string): boolean =>
     *   !!moment.tz.zone(timezone)
     *
     * const tz = getIANATimeZone('New_York', isValidTimeZone) // Returns 'America/New_York'.
     * ```
     *
     * @see defaultIsValidTimeZone
     * @link [IANA timezone database](https://www.iana.org/time-zones)
     * @link [Fantom's DateTime with alias explanation](https://fantom.org/doc/docLang/DateTime)
     *
     * @param timezone A full timezone name or alias.
     * @param isValidTimeZone An optional callback invoked to see if the timezone is valid.
     * @returns The IANA timezone name or an empty string if the timezone name isn't valid.
     */
    static getIANATimeZone(timezone, isValidTimeZone = defaultIsValidTimeZone) {
      if (isValidTimeZone(timezone)) {
        return timezone;
      }
      for (const prefix of TIMEZONE_PREFIXES) {
        const tz = `${prefix}/${timezone}`;
        if (isValidTimeZone(tz)) {
          return tz;
        }
      }
      return "";
    }
    /**
     * @returns The timezone database.
     *
     * - https://project-haystack.org/download/tz.txt
     * - https://project-haystack.org/doc/docHaystack/TimeZones
     */
    static getTimezoneDb() {
      return HGrid.make({
        rows: [
          { name: "Abidjan", fullName: "Africa/Abidjan" },
          { name: "Accra", fullName: "Africa/Accra" },
          { name: "Adak", fullName: "America/Adak" },
          { name: "Adelaide", fullName: "Australia/Adelaide" },
          { name: "Algiers", fullName: "Africa/Algiers" },
          { name: "Almaty", fullName: "Asia/Almaty" },
          { name: "Amman", fullName: "Asia/Amman" },
          { name: "Amsterdam", fullName: "Europe/Amsterdam" },
          { name: "Anadyr", fullName: "Asia/Anadyr" },
          { name: "Anchorage", fullName: "America/Anchorage" },
          { name: "Andorra", fullName: "Europe/Andorra" },
          { name: "Apia", fullName: "Pacific/Apia" },
          { name: "Aqtau", fullName: "Asia/Aqtau" },
          { name: "Aqtobe", fullName: "Asia/Aqtobe" },
          { name: "Araguaina", fullName: "America/Araguaina" },
          { name: "Ashgabat", fullName: "Asia/Ashgabat" },
          { name: "Astrakhan", fullName: "Europe/Astrakhan" },
          { name: "Asuncion", fullName: "America/Asuncion" },
          { name: "Athens", fullName: "Europe/Athens" },
          { name: "Atikokan", fullName: "America/Atikokan" },
          { name: "Atyrau", fullName: "Asia/Atyrau" },
          { name: "Auckland", fullName: "Pacific/Auckland" },
          { name: "Azores", fullName: "Atlantic/Azores" },
          { name: "Baghdad", fullName: "Asia/Baghdad" },
          { name: "Bahia", fullName: "America/Bahia" },
          { name: "Bahia_Banderas", fullName: "America/Bahia_Banderas" },
          { name: "Baku", fullName: "Asia/Baku" },
          { name: "Bangkok", fullName: "Asia/Bangkok" },
          { name: "Barbados", fullName: "America/Barbados" },
          { name: "Barnaul", fullName: "Asia/Barnaul" },
          { name: "Beirut", fullName: "Asia/Beirut" },
          { name: "Belem", fullName: "America/Belem" },
          { name: "Belgrade", fullName: "Europe/Belgrade" },
          { name: "Belize", fullName: "America/Belize" },
          { name: "Berlin", fullName: "Europe/Berlin" },
          { name: "Bermuda", fullName: "Atlantic/Bermuda" },
          { name: "Beulah", fullName: "America/North_Dakota/Beulah" },
          { name: "Bishkek", fullName: "Asia/Bishkek" },
          { name: "Bissau", fullName: "Africa/Bissau" },
          { name: "Blanc-Sablon", fullName: "America/Blanc-Sablon" },
          { name: "Boa_Vista", fullName: "America/Boa_Vista" },
          { name: "Bogota", fullName: "America/Bogota" },
          { name: "Boise", fullName: "America/Boise" },
          { name: "Bougainville", fullName: "Pacific/Bougainville" },
          { name: "Brisbane", fullName: "Australia/Brisbane" },
          { name: "Broken_Hill", fullName: "Australia/Broken_Hill" },
          { name: "Brunei", fullName: "Asia/Brunei" },
          { name: "Brussels", fullName: "Europe/Brussels" },
          { name: "Bucharest", fullName: "Europe/Bucharest" },
          { name: "Budapest", fullName: "Europe/Budapest" },
          {
            name: "Buenos_Aires",
            fullName: "America/Argentina/Buenos_Aires"
          },
          { name: "CET", fullName: "CET" },
          { name: "CST6CDT", fullName: "CST6CDT" },
          { name: "Cairo", fullName: "Africa/Cairo" },
          { name: "Cambridge_Bay", fullName: "America/Cambridge_Bay" },
          { name: "Campo_Grande", fullName: "America/Campo_Grande" },
          { name: "Canary", fullName: "Atlantic/Canary" },
          { name: "Cancun", fullName: "America/Cancun" },
          { name: "Cape_Verde", fullName: "Atlantic/Cape_Verde" },
          { name: "Caracas", fullName: "America/Caracas" },
          { name: "Casablanca", fullName: "Africa/Casablanca" },
          { name: "Casey", fullName: "Antarctica/Casey" },
          { name: "Catamarca", fullName: "America/Argentina/Catamarca" },
          { name: "Cayenne", fullName: "America/Cayenne" },
          { name: "Center", fullName: "America/North_Dakota/Center" },
          { name: "Ceuta", fullName: "Africa/Ceuta" },
          { name: "Chagos", fullName: "Indian/Chagos" },
          { name: "Chatham", fullName: "Pacific/Chatham" },
          { name: "Chicago", fullName: "America/Chicago" },
          { name: "Chihuahua", fullName: "America/Chihuahua" },
          { name: "Chisinau", fullName: "Europe/Chisinau" },
          { name: "Chita", fullName: "Asia/Chita" },
          { name: "Choibalsan", fullName: "Asia/Choibalsan" },
          { name: "Christmas", fullName: "Indian/Christmas" },
          { name: "Chuuk", fullName: "Pacific/Chuuk" },
          { name: "Cocos", fullName: "Indian/Cocos" },
          { name: "Colombo", fullName: "Asia/Colombo" },
          { name: "Copenhagen", fullName: "Europe/Copenhagen" },
          { name: "Cordoba", fullName: "America/Argentina/Cordoba" },
          { name: "Costa_Rica", fullName: "America/Costa_Rica" },
          { name: "Creston", fullName: "America/Creston" },
          { name: "Cuiaba", fullName: "America/Cuiaba" },
          { name: "Curacao", fullName: "America/Curacao" },
          { name: "Currie", fullName: "Australia/Currie" },
          { name: "Damascus", fullName: "Asia/Damascus" },
          { name: "Danmarkshavn", fullName: "America/Danmarkshavn" },
          { name: "Darwin", fullName: "Australia/Darwin" },
          { name: "Davis", fullName: "Antarctica/Davis" },
          { name: "Dawson", fullName: "America/Dawson" },
          { name: "Dawson_Creek", fullName: "America/Dawson_Creek" },
          { name: "Denver", fullName: "America/Denver" },
          { name: "Detroit", fullName: "America/Detroit" },
          { name: "Dhaka", fullName: "Asia/Dhaka" },
          { name: "Dili", fullName: "Asia/Dili" },
          { name: "Dubai", fullName: "Asia/Dubai" },
          { name: "Dublin", fullName: "Europe/Dublin" },
          {
            name: "DumontDUrville",
            fullName: "Antarctica/DumontDUrville"
          },
          { name: "Dushanbe", fullName: "Asia/Dushanbe" },
          { name: "EET", fullName: "EET" },
          { name: "EST", fullName: "EST" },
          { name: "EST5EDT", fullName: "EST5EDT" },
          { name: "Easter", fullName: "Pacific/Easter" },
          { name: "Edmonton", fullName: "America/Edmonton" },
          { name: "Efate", fullName: "Pacific/Efate" },
          { name: "Eirunepe", fullName: "America/Eirunepe" },
          { name: "El_Aaiun", fullName: "Africa/El_Aaiun" },
          { name: "El_Salvador", fullName: "America/El_Salvador" },
          { name: "Enderbury", fullName: "Pacific/Enderbury" },
          { name: "Eucla", fullName: "Australia/Eucla" },
          { name: "Fakaofo", fullName: "Pacific/Fakaofo" },
          { name: "Famagusta", fullName: "Asia/Famagusta" },
          { name: "Faroe", fullName: "Atlantic/Faroe" },
          { name: "Fiji", fullName: "Pacific/Fiji" },
          { name: "Fort_Nelson", fullName: "America/Fort_Nelson" },
          { name: "Fortaleza", fullName: "America/Fortaleza" },
          { name: "Funafuti", fullName: "Pacific/Funafuti" },
          { name: "GMT", fullName: "Etc/GMT" },
          { name: "GMT+1", fullName: "Etc/GMT+1" },
          { name: "GMT+10", fullName: "Etc/GMT+10" },
          { name: "GMT+11", fullName: "Etc/GMT+11" },
          { name: "GMT+12", fullName: "Etc/GMT+12" },
          { name: "GMT+2", fullName: "Etc/GMT+2" },
          { name: "GMT+3", fullName: "Etc/GMT+3" },
          { name: "GMT+4", fullName: "Etc/GMT+4" },
          { name: "GMT+5", fullName: "Etc/GMT+5" },
          { name: "GMT+6", fullName: "Etc/GMT+6" },
          { name: "GMT+7", fullName: "Etc/GMT+7" },
          { name: "GMT+8", fullName: "Etc/GMT+8" },
          { name: "GMT+9", fullName: "Etc/GMT+9" },
          { name: "GMT-1", fullName: "Etc/GMT-1" },
          { name: "GMT-10", fullName: "Etc/GMT-10" },
          { name: "GMT-11", fullName: "Etc/GMT-11" },
          { name: "GMT-12", fullName: "Etc/GMT-12" },
          { name: "GMT-13", fullName: "Etc/GMT-13" },
          { name: "GMT-14", fullName: "Etc/GMT-14" },
          { name: "GMT-2", fullName: "Etc/GMT-2" },
          { name: "GMT-3", fullName: "Etc/GMT-3" },
          { name: "GMT-4", fullName: "Etc/GMT-4" },
          { name: "GMT-5", fullName: "Etc/GMT-5" },
          { name: "GMT-6", fullName: "Etc/GMT-6" },
          { name: "GMT-7", fullName: "Etc/GMT-7" },
          { name: "GMT-8", fullName: "Etc/GMT-8" },
          { name: "GMT-9", fullName: "Etc/GMT-9" },
          { name: "Galapagos", fullName: "Pacific/Galapagos" },
          { name: "Gambier", fullName: "Pacific/Gambier" },
          { name: "Gaza", fullName: "Asia/Gaza" },
          { name: "Gibraltar", fullName: "Europe/Gibraltar" },
          { name: "Glace_Bay", fullName: "America/Glace_Bay" },
          { name: "Godthab", fullName: "America/Godthab" },
          { name: "Goose_Bay", fullName: "America/Goose_Bay" },
          { name: "Grand_Turk", fullName: "America/Grand_Turk" },
          { name: "Guadalcanal", fullName: "Pacific/Guadalcanal" },
          { name: "Guam", fullName: "Pacific/Guam" },
          { name: "Guatemala", fullName: "America/Guatemala" },
          { name: "Guayaquil", fullName: "America/Guayaquil" },
          { name: "Guyana", fullName: "America/Guyana" },
          { name: "HST", fullName: "HST" },
          { name: "Halifax", fullName: "America/Halifax" },
          { name: "Havana", fullName: "America/Havana" },
          { name: "Hebron", fullName: "Asia/Hebron" },
          { name: "Helsinki", fullName: "Europe/Helsinki" },
          { name: "Hermosillo", fullName: "America/Hermosillo" },
          { name: "Ho_Chi_Minh", fullName: "Asia/Ho_Chi_Minh" },
          { name: "Hobart", fullName: "Australia/Hobart" },
          { name: "Hong_Kong", fullName: "Asia/Hong_Kong" },
          { name: "Honolulu", fullName: "Pacific/Honolulu" },
          { name: "Hovd", fullName: "Asia/Hovd" },
          {
            name: "Indianapolis",
            fullName: "America/Indiana/Indianapolis"
          },
          { name: "Inuvik", fullName: "America/Inuvik" },
          { name: "Iqaluit", fullName: "America/Iqaluit" },
          { name: "Irkutsk", fullName: "Asia/Irkutsk" },
          { name: "Istanbul", fullName: "Europe/Istanbul" },
          { name: "Jakarta", fullName: "Asia/Jakarta" },
          { name: "Jamaica", fullName: "America/Jamaica" },
          { name: "Jayapura", fullName: "Asia/Jayapura" },
          { name: "Jerusalem", fullName: "Asia/Jerusalem" },
          { name: "Johannesburg", fullName: "Africa/Johannesburg" },
          { name: "Juba", fullName: "Africa/Juba" },
          { name: "Jujuy", fullName: "America/Argentina/Jujuy" },
          { name: "Juneau", fullName: "America/Juneau" },
          { name: "Kabul", fullName: "Asia/Kabul" },
          { name: "Kaliningrad", fullName: "Europe/Kaliningrad" },
          { name: "Kamchatka", fullName: "Asia/Kamchatka" },
          { name: "Karachi", fullName: "Asia/Karachi" },
          { name: "Kathmandu", fullName: "Asia/Kathmandu" },
          { name: "Kerguelen", fullName: "Indian/Kerguelen" },
          { name: "Khandyga", fullName: "Asia/Khandyga" },
          { name: "Khartoum", fullName: "Africa/Khartoum" },
          { name: "Kiev", fullName: "Europe/Kiev" },
          { name: "Kiritimati", fullName: "Pacific/Kiritimati" },
          { name: "Kirov", fullName: "Europe/Kirov" },
          { name: "Knox", fullName: "America/Indiana/Knox" },
          { name: "Kolkata", fullName: "Asia/Kolkata" },
          { name: "Kosrae", fullName: "Pacific/Kosrae" },
          { name: "Krasnoyarsk", fullName: "Asia/Krasnoyarsk" },
          { name: "Kuala_Lumpur", fullName: "Asia/Kuala_Lumpur" },
          { name: "Kuching", fullName: "Asia/Kuching" },
          { name: "Kwajalein", fullName: "Pacific/Kwajalein" },
          { name: "La_Paz", fullName: "America/La_Paz" },
          { name: "La_Rioja", fullName: "America/Argentina/La_Rioja" },
          { name: "Lagos", fullName: "Africa/Lagos" },
          { name: "Lima", fullName: "America/Lima" },
          { name: "Lindeman", fullName: "Australia/Lindeman" },
          { name: "Lisbon", fullName: "Europe/Lisbon" },
          { name: "London", fullName: "Europe/London" },
          { name: "Lord_Howe", fullName: "Australia/Lord_Howe" },
          { name: "Los_Angeles", fullName: "America/Los_Angeles" },
          { name: "Louisville", fullName: "America/Kentucky/Louisville" },
          { name: "Luxembourg", fullName: "Europe/Luxembourg" },
          { name: "MET", fullName: "MET" },
          { name: "MST", fullName: "MST" },
          { name: "MST7MDT", fullName: "MST7MDT" },
          { name: "Macau", fullName: "Asia/Macau" },
          { name: "Maceio", fullName: "America/Maceio" },
          { name: "Macquarie", fullName: "Antarctica/Macquarie" },
          { name: "Madeira", fullName: "Atlantic/Madeira" },
          { name: "Madrid", fullName: "Europe/Madrid" },
          { name: "Magadan", fullName: "Asia/Magadan" },
          { name: "Mahe", fullName: "Indian/Mahe" },
          { name: "Majuro", fullName: "Pacific/Majuro" },
          { name: "Makassar", fullName: "Asia/Makassar" },
          { name: "Maldives", fullName: "Indian/Maldives" },
          { name: "Malta", fullName: "Europe/Malta" },
          { name: "Managua", fullName: "America/Managua" },
          { name: "Manaus", fullName: "America/Manaus" },
          { name: "Manila", fullName: "Asia/Manila" },
          { name: "Maputo", fullName: "Africa/Maputo" },
          { name: "Marengo", fullName: "America/Indiana/Marengo" },
          { name: "Marquesas", fullName: "Pacific/Marquesas" },
          { name: "Martinique", fullName: "America/Martinique" },
          { name: "Matamoros", fullName: "America/Matamoros" },
          { name: "Mauritius", fullName: "Indian/Mauritius" },
          { name: "Mawson", fullName: "Antarctica/Mawson" },
          { name: "Mazatlan", fullName: "America/Mazatlan" },
          { name: "Melbourne", fullName: "Australia/Melbourne" },
          { name: "Mendoza", fullName: "America/Argentina/Mendoza" },
          { name: "Menominee", fullName: "America/Menominee" },
          { name: "Merida", fullName: "America/Merida" },
          { name: "Metlakatla", fullName: "America/Metlakatla" },
          { name: "Mexico_City", fullName: "America/Mexico_City" },
          { name: "Minsk", fullName: "Europe/Minsk" },
          { name: "Miquelon", fullName: "America/Miquelon" },
          { name: "Monaco", fullName: "Europe/Monaco" },
          { name: "Moncton", fullName: "America/Moncton" },
          { name: "Monrovia", fullName: "Africa/Monrovia" },
          { name: "Monterrey", fullName: "America/Monterrey" },
          { name: "Montevideo", fullName: "America/Montevideo" },
          { name: "Monticello", fullName: "America/Kentucky/Monticello" },
          { name: "Moscow", fullName: "Europe/Moscow" },
          { name: "Nairobi", fullName: "Africa/Nairobi" },
          { name: "Nassau", fullName: "America/Nassau" },
          { name: "Nauru", fullName: "Pacific/Nauru" },
          { name: "Ndjamena", fullName: "Africa/Ndjamena" },
          {
            name: "New_Salem",
            fullName: "America/North_Dakota/New_Salem"
          },
          { name: "New_York", fullName: "America/New_York" },
          { name: "Nicosia", fullName: "Asia/Nicosia" },
          { name: "Nipigon", fullName: "America/Nipigon" },
          { name: "Niue", fullName: "Pacific/Niue" },
          { name: "Nome", fullName: "America/Nome" },
          { name: "Norfolk", fullName: "Pacific/Norfolk" },
          { name: "Noronha", fullName: "America/Noronha" },
          { name: "Noumea", fullName: "Pacific/Noumea" },
          { name: "Novokuznetsk", fullName: "Asia/Novokuznetsk" },
          { name: "Novosibirsk", fullName: "Asia/Novosibirsk" },
          { name: "Ojinaga", fullName: "America/Ojinaga" },
          { name: "Omsk", fullName: "Asia/Omsk" },
          { name: "Oral", fullName: "Asia/Oral" },
          { name: "Oslo", fullName: "Europe/Oslo" },
          { name: "PST8PDT", fullName: "PST8PDT" },
          { name: "Pago_Pago", fullName: "Pacific/Pago_Pago" },
          { name: "Palau", fullName: "Pacific/Palau" },
          { name: "Palmer", fullName: "Antarctica/Palmer" },
          { name: "Panama", fullName: "America/Panama" },
          { name: "Pangnirtung", fullName: "America/Pangnirtung" },
          { name: "Paramaribo", fullName: "America/Paramaribo" },
          { name: "Paris", fullName: "Europe/Paris" },
          { name: "Perth", fullName: "Australia/Perth" },
          { name: "Petersburg", fullName: "America/Indiana/Petersburg" },
          { name: "Phoenix", fullName: "America/Phoenix" },
          { name: "Pitcairn", fullName: "Pacific/Pitcairn" },
          { name: "Pohnpei", fullName: "Pacific/Pohnpei" },
          { name: "Pontianak", fullName: "Asia/Pontianak" },
          { name: "Port-au-Prince", fullName: "America/Port-au-Prince" },
          { name: "Port_Moresby", fullName: "Pacific/Port_Moresby" },
          { name: "Port_of_Spain", fullName: "America/Port_of_Spain" },
          { name: "Porto_Velho", fullName: "America/Porto_Velho" },
          { name: "Prague", fullName: "Europe/Prague" },
          { name: "Puerto_Rico", fullName: "America/Puerto_Rico" },
          { name: "Punta_Arenas", fullName: "America/Punta_Arenas" },
          { name: "Pyongyang", fullName: "Asia/Pyongyang" },
          { name: "Qatar", fullName: "Asia/Qatar" },
          { name: "Qostanay", fullName: "Asia/Qostanay" },
          { name: "Qyzylorda", fullName: "Asia/Qyzylorda" },
          { name: "Rainy_River", fullName: "America/Rainy_River" },
          { name: "Rankin_Inlet", fullName: "America/Rankin_Inlet" },
          { name: "Rarotonga", fullName: "Pacific/Rarotonga" },
          { name: "Recife", fullName: "America/Recife" },
          { name: "Regina", fullName: "America/Regina" },
          { name: "Rel", fullName: "Etc/Rel" },
          { name: "Resolute", fullName: "America/Resolute" },
          { name: "Reunion", fullName: "Indian/Reunion" },
          { name: "Reykjavik", fullName: "Atlantic/Reykjavik" },
          { name: "Riga", fullName: "Europe/Riga" },
          { name: "Rio_Branco", fullName: "America/Rio_Branco" },
          {
            name: "Rio_Gallegos",
            fullName: "America/Argentina/Rio_Gallegos"
          },
          { name: "Riyadh", fullName: "Asia/Riyadh" },
          { name: "Rome", fullName: "Europe/Rome" },
          { name: "Rothera", fullName: "Antarctica/Rothera" },
          { name: "Sakhalin", fullName: "Asia/Sakhalin" },
          { name: "Salta", fullName: "America/Argentina/Salta" },
          { name: "Samara", fullName: "Europe/Samara" },
          { name: "Samarkand", fullName: "Asia/Samarkand" },
          { name: "San_Juan", fullName: "America/Argentina/San_Juan" },
          { name: "San_Luis", fullName: "America/Argentina/San_Luis" },
          { name: "Santarem", fullName: "America/Santarem" },
          { name: "Santiago", fullName: "America/Santiago" },
          { name: "Santo_Domingo", fullName: "America/Santo_Domingo" },
          { name: "Sao_Paulo", fullName: "America/Sao_Paulo" },
          { name: "Sao_Tome", fullName: "Africa/Sao_Tome" },
          { name: "Saratov", fullName: "Europe/Saratov" },
          { name: "Scoresbysund", fullName: "America/Scoresbysund" },
          { name: "Seoul", fullName: "Asia/Seoul" },
          { name: "Shanghai", fullName: "Asia/Shanghai" },
          { name: "Simferopol", fullName: "Europe/Simferopol" },
          { name: "Singapore", fullName: "Asia/Singapore" },
          { name: "Sitka", fullName: "America/Sitka" },
          { name: "Sofia", fullName: "Europe/Sofia" },
          { name: "South_Georgia", fullName: "Atlantic/South_Georgia" },
          { name: "Srednekolymsk", fullName: "Asia/Srednekolymsk" },
          { name: "St_Johns", fullName: "America/St_Johns" },
          { name: "Stanley", fullName: "Atlantic/Stanley" },
          { name: "Stockholm", fullName: "Europe/Stockholm" },
          { name: "Swift_Current", fullName: "America/Swift_Current" },
          { name: "Sydney", fullName: "Australia/Sydney" },
          { name: "Syowa", fullName: "Antarctica/Syowa" },
          { name: "Tahiti", fullName: "Pacific/Tahiti" },
          { name: "Taipei", fullName: "Asia/Taipei" },
          { name: "Tallinn", fullName: "Europe/Tallinn" },
          { name: "Tarawa", fullName: "Pacific/Tarawa" },
          { name: "Tashkent", fullName: "Asia/Tashkent" },
          { name: "Tbilisi", fullName: "Asia/Tbilisi" },
          { name: "Tegucigalpa", fullName: "America/Tegucigalpa" },
          { name: "Tehran", fullName: "Asia/Tehran" },
          { name: "Tell_City", fullName: "America/Indiana/Tell_City" },
          { name: "Thimphu", fullName: "Asia/Thimphu" },
          { name: "Thule", fullName: "America/Thule" },
          { name: "Thunder_Bay", fullName: "America/Thunder_Bay" },
          { name: "Tijuana", fullName: "America/Tijuana" },
          { name: "Tirane", fullName: "Europe/Tirane" },
          { name: "Tokyo", fullName: "Asia/Tokyo" },
          { name: "Tomsk", fullName: "Asia/Tomsk" },
          { name: "Tongatapu", fullName: "Pacific/Tongatapu" },
          { name: "Toronto", fullName: "America/Toronto" },
          { name: "Tripoli", fullName: "Africa/Tripoli" },
          { name: "Troll", fullName: "Antarctica/Troll" },
          { name: "Tucuman", fullName: "America/Argentina/Tucuman" },
          { name: "Tunis", fullName: "Africa/Tunis" },
          { name: "UTC", fullName: "Etc/UTC" },
          { name: "Ulaanbaatar", fullName: "Asia/Ulaanbaatar" },
          { name: "Ulyanovsk", fullName: "Europe/Ulyanovsk" },
          { name: "Urumqi", fullName: "Asia/Urumqi" },
          { name: "Ushuaia", fullName: "America/Argentina/Ushuaia" },
          { name: "Ust-Nera", fullName: "Asia/Ust-Nera" },
          { name: "Uzhgorod", fullName: "Europe/Uzhgorod" },
          { name: "Vancouver", fullName: "America/Vancouver" },
          { name: "Vevay", fullName: "America/Indiana/Vevay" },
          { name: "Vienna", fullName: "Europe/Vienna" },
          { name: "Vilnius", fullName: "Europe/Vilnius" },
          { name: "Vincennes", fullName: "America/Indiana/Vincennes" },
          { name: "Vladivostok", fullName: "Asia/Vladivostok" },
          { name: "Volgograd", fullName: "Europe/Volgograd" },
          { name: "Vostok", fullName: "Antarctica/Vostok" },
          { name: "WET", fullName: "WET" },
          { name: "Wake", fullName: "Pacific/Wake" },
          { name: "Wallis", fullName: "Pacific/Wallis" },
          { name: "Warsaw", fullName: "Europe/Warsaw" },
          { name: "Whitehorse", fullName: "America/Whitehorse" },
          { name: "Winamac", fullName: "America/Indiana/Winamac" },
          { name: "Windhoek", fullName: "Africa/Windhoek" },
          { name: "Winnipeg", fullName: "America/Winnipeg" },
          { name: "Yakutat", fullName: "America/Yakutat" },
          { name: "Yakutsk", fullName: "Asia/Yakutsk" },
          { name: "Yangon", fullName: "Asia/Yangon" },
          { name: "Yekaterinburg", fullName: "Asia/Yekaterinburg" },
          { name: "Yellowknife", fullName: "America/Yellowknife" },
          { name: "Yerevan", fullName: "Asia/Yerevan" },
          { name: "Zaporozhye", fullName: "Europe/Zaporozhye" },
          { name: "Zurich", fullName: "Europe/Zurich" }
        ]
      });
    }
  };
  _iso = new WeakMap();
  _value9 = new WeakMap();
  _timezone = new WeakMap();
  var HDateTime = _HDateTime;
  __decorate$1([
    memoize()
  ], HDateTime, "getTimezoneDb", null);
  var ZincReader = class _ZincReader {
    /**
     * Constructors a new reader.
     *
     * @param input The scanner used for the input.
     */
    constructor(input) {
      /**
       * The input string to read from.
       *
       * All state for the reader is delegated to this object. This is because the
       * scanner can be shared between readers/lexers accordingly (i.e. haystack filters use some
       * Zinc encoding).
       *
       * No state should ever be stored in the zinc reader directly.
       */
      __publicField(this, "scanner");
      this.scanner = typeof input === "string" ? new Scanner(input) : input;
    }
    /**
     * Read the input zinc encoded string and return the haystack value for it.
     *
     * @param input The input string or scanner.
     * @returns The haystack value.
     */
    static readValue(input) {
      return new _ZincReader(input).readValue();
    }
    /**
     * Read the value and return it.
     *
     * @returns The next value.
     */
    readValue() {
      while (!this.scanner.isEof()) {
        switch (this.scanner.current) {
          case " ":
          case "	":
          case "\n":
          case "\r":
            this.whiteSpace();
            continue;
          case '"':
            return this.string();
          case "`":
            return this.uri();
          case "@":
            return this.ref();
          case "^":
            return this.symbol();
          case "{":
            return this.dict();
          case "[":
            return this.list();
          case "<":
          case "v":
            return this.grid();
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
          case "-":
            if (this.scanner.next === "I") {
              return this.numberNegativeInfinity();
            } else {
              return this.numberDateTime();
            }
          case "A":
          case "B":
          case "C":
          case "D":
          case "E":
          case "F":
          case "G":
          case "H":
          case "I":
          case "J":
          case "K":
          case "L":
          case "M":
          case "N":
          case "O":
          case "P":
          case "Q":
          case "R":
          case "S":
          case "T":
          case "U":
          case "V":
          case "W":
          case "X":
          case "Y":
          case "Z":
            const id = this.id();
            if (this.scanner.is("(")) {
              if (id === "C") {
                return this.coord();
              } else {
                return this.xstr(id);
              }
            } else if (id === ZINC_NULL) {
              return null;
            } else if (id === "NA") {
              return HNa.make();
            } else if (id === "M") {
              return HMarker.make();
            } else if (id === "R") {
              return HRemove.make();
            } else if (id === "T") {
              return HBool.make(true);
            } else if (id === "F") {
              return HBool.make(false);
            } else if (id === "NaN") {
              return HNum.make(Number.NaN);
            } else if (id === "INF") {
              return HNum.make(Number.POSITIVE_INFINITY);
            } else {
              this.throwInvalidCharacter();
              break;
            }
          default:
            this.throwInvalidCharacter();
        }
      }
      throw new LocalizedError({
        message: "Could not find a value",
        lex: "lexerNoValueFound",
        index: this.scanner.index
      });
    }
    /**
     * Throws an invalid character error.
     *
     * @throws Always throws an invalid character error.
     */
    throwInvalidCharacter() {
      throw new LocalizedError({
        message: "Invalid character",
        lex: "lexerInvalidChar",
        index: this.scanner.index
      });
    }
    /**
     * Consume any white space characters.
     */
    whiteSpace() {
      while (this.scanner.isWhiteSpace()) {
        this.scanner.consume();
      }
    }
    /**
     * Consume the data stream and return a string value.
     *
     * @returns A string value.
     * @throws If the end of the string can't be found.
     */
    string() {
      let str = "";
      this.scanner.expect('"', Kind.Str).consume();
      while (!this.scanner.is('"')) {
        if (this.scanner.isEof()) {
          throw new LocalizedError({
            message: `Cannot find end of string: ${str}. The end of a string must end with a "`,
            lex: "lexerCannotFindEndOfString",
            args: { arg: str },
            index: this.scanner.index
          });
        }
        if (this.scanner.is("\\")) {
          str += this.escape(
            /*escapeStrChars*/
            true
          );
        } else {
          str += this.scanner.current;
        }
        this.scanner.consume();
      }
      this.scanner.consume();
      return HStr.make(str);
    }
    /**
     * Consume the data stream and return an uri value.
     *
     * @returns A uri value.
     * @throws If the end of the uri can't be found if an invalid character is found.
     */
    uri() {
      let str = "";
      this.scanner.consume();
      while (!this.scanner.is("`")) {
        if (this.scanner.isEof()) {
          throw new LocalizedError({
            message: `Cannot find end of URI: ${str}. The end of a URI must end with a \``,
            lex: "lexerCannotFindEndOfUri",
            args: { arg: str },
            index: this.scanner.index
          });
        }
        if (this.scanner.is("\\")) {
          switch (this.scanner.next) {
            case ":":
            case "/":
            case "?":
            case "#":
            case "[":
            case "]":
            case "@":
            case "`":
            case "\\":
            case "&":
            case "=":
            case ";":
              str += this.scanner.current;
              str += this.scanner.next;
              this.scanner.consume();
              break;
            default:
              str += this.escape(
                /*escapeStrChars*/
                false
              );
          }
        } else {
          str += this.scanner.current;
        }
        this.scanner.consume();
      }
      this.scanner.consume();
      return HUri.make(str);
    }
    /**
     * Consume the data stream and return an ref value.
     *
     * @returns A ref value.
     * @throws If there's an error parsing the ref.
     */
    ref() {
      let str = "";
      this.scanner.consume();
      while (this.scanner.isDigit() || this.scanner.isLetter() || this.scanner.is("_") || this.scanner.is(":") || this.scanner.is("-") || this.scanner.is(".") || this.scanner.is("~")) {
        str += this.scanner.current;
        this.scanner.consume();
      }
      if (!str) {
        throw new LocalizedError({
          message: `Empty ref`,
          lex: "lexerEmptyRef",
          args: { arg: str },
          index: this.scanner.index
        });
      }
      let displayName;
      if (this.scanner.isSpaceOrTab() && this.scanner.next === '"') {
        this.scanner.consume();
        displayName = this.string().value;
      }
      return HRef.make(str, displayName);
    }
    /**
     * Consume an escape sequence within a string.
     *
     * @returns The unescaped character.
     * @throws If the escape sequence is invalid.
     */
    escape(escapeStrChars) {
      this.scanner.consume();
      if (escapeStrChars) {
        switch (this.scanner.current) {
          case "b":
            return "\b";
          case "f":
            return "\f";
          case "n":
            return "\n";
          case "r":
            return "\r";
          case "t":
            return "	";
          case '"':
            return '"';
          case "$":
            return "$";
          case "'":
            return "'";
          case "`":
            return "`";
          case "\\":
            return "\\";
        }
      }
      if (this.scanner.is("u")) {
        let esc = "";
        for (let i = 0; i < 4; ++i) {
          this.scanner.consume();
          esc += this.scanner.current;
          if (!this.scanner.isHex()) {
            throw new LocalizedError({
              message: `Invalid unicode escape ${esc}`,
              lex: "lexerInvalidUnicodeEscape",
              args: { arg: esc },
              index: this.scanner.index
            });
          }
        }
        return String.fromCharCode(parseInt(esc, 16));
      } else {
        throw new LocalizedError({
          message: `Invalid escape sequence ${this.scanner.current}`,
          lex: "lexerInvalidEscapeSequence",
          args: { arg: this.scanner.current || "" },
          index: this.scanner.index
        });
      }
    }
    /**
     * Consume the data stream and return a number, date or time value.
     *
     * @returns A number, date, date time or time value.
     * @throws If we don't have a valid number.
     */
    numberDateTime() {
      let str = String(this.scanner.current);
      let colons = 0;
      let dashes = 0;
      let unitIndex = 0;
      let exp = false;
      this.scanner.consume();
      while (!this.scanner.isEof()) {
        if (!this.scanner.isDigit()) {
          if (exp && (this.scanner.is("+") || this.scanner.is("-"))) ;
          else if (this.scanner.is("-")) {
            ++dashes;
          } else if (this.scanner.is(":") && Scanner.isDigit(this.scanner.next)) {
            ++colons;
          } else if ((exp || colons >= 1) && this.scanner.is("+")) ;
          else if (this.scanner.is(".")) {
            if (!Scanner.isDigit(this.scanner.next)) {
              break;
            }
          } else if ((this.scanner.is("e") || this.scanner.is("E")) && (this.scanner.next === "-" || this.scanner.next === "+" || Scanner.isDigit(this.scanner.next))) {
            exp = true;
          } else if (
            // Do we have some units?
            this.scanner.isLetter() || this.scanner.is("%") || this.scanner.is("$") || this.scanner.is("/") || String(this.scanner.current).charCodeAt(0) > 128
          ) {
            if (unitIndex === 0) {
              unitIndex = str.length;
            }
          } else if (this.scanner.is("_")) {
            if (unitIndex === 0 && Scanner.isDigit(this.scanner.next)) {
              this.scanner.consume();
              continue;
            } else {
              if (unitIndex === 0) {
                unitIndex = str.length;
              }
            }
          } else {
            break;
          }
        }
        str += this.scanner.current;
        this.scanner.consume();
      }
      if (dashes === 2 && colons === 0) {
        return HDate.make(str);
      } else if (dashes === 0 && colons >= 1) {
        if (str[1] === ":") {
          str = "0" + str;
        }
        if (colons === 1) {
          str += ":00";
        }
        return HTime.make(str);
      } else if (dashes >= 2) {
        return this.dateTime(str);
      } else {
        let unit;
        if (unitIndex > 0) {
          unit = str.substring(unitIndex);
          str = str.substring(0, unitIndex);
        }
        if (isNaN(Number(str))) {
          throw new LocalizedError({
            message: `Invalid number: ${str}`,
            lex: "lexerInvalidNumber",
            args: { arg: str },
            index: this.scanner.index
          });
        }
        return HNum.make(Number(str), unit);
      }
    }
    /**
     * Read negative infinity.
     *
     * @returns A number for negative infinity.
     */
    numberNegativeInfinity() {
      this.scanner.expect("-", Kind.Number).consume().expect("I", Kind.Number).consume().expect("N", Kind.Number).consume().expect("F", Kind.Number).consume();
      return HNum.make(Number.NEGATIVE_INFINITY);
    }
    /**
     * Parse the date time into a value.
     *
     * @param dateTime The date time string.
     * @returns The haystack date time.
     * @throws An error if the date time can't be parsed.
     */
    dateTime(dateTime) {
      if (!this.scanner.isSpaceOrTab() || !Scanner.isUpperCase(this.scanner.next)) {
        if (dateTime[dateTime.length - 1] === "Z") {
          dateTime += " UTC";
        } else {
          throw new LocalizedError({
            message: `Expecting timezone in date time`,
            lex: "lexerExpectingTimezone",
            index: this.scanner.index
          });
        }
      } else {
        this.scanner.consume();
        dateTime += " ";
        while (this.scanner.isLetter() || this.scanner.isDigit() || this.scanner.is("_") || // Tz containing "_" (ex.: Los_Angeles)
        this.scanner.is("-") || // GMT-n or tz containing "-" (ex.: Port-au-Prince)
        this.scanner.is("+")) {
          dateTime += this.scanner.current;
          this.scanner.consume();
          while (this.scanner.isDigit()) {
            dateTime += this.scanner.current;
            this.scanner.consume();
          }
        }
      }
      try {
        return HDateTime.make(dateTime);
      } catch {
        throw new LocalizedError({
          message: `Invalid date ${dateTime}`,
          lex: "lexerInvalidDate",
          args: { arg: dateTime },
          index: this.scanner.index
        });
      }
    }
    /**
     * @returns A coordinate value.
     */
    coord() {
      this.scanner.expect("(", Kind.Coord);
      const latitude = this.decimal();
      this.scanner.expect(",", Kind.Coord);
      const longitude = this.decimal();
      this.scanner.expect(")", Kind.Coord).consume();
      try {
        return HCoord.make({ latitude, longitude });
      } catch (err) {
        const error = err;
        throw new LocalizedError({
          message: error.message,
          lex: error.message,
          index: this.scanner.index
        });
      }
    }
    /**
     * @returns A decimal number.
     */
    decimal() {
      let buf = "";
      this.scanner.consume();
      while (this.scanner.isDigit() || this.scanner.is(".") || this.scanner.is("-")) {
        buf += this.scanner.current;
        this.scanner.consume();
      }
      const num = Number(buf);
      if (isNaN(num)) {
        throw new LocalizedError({
          message: `Invalid decimal number ${buf}`,
          lex: "lexerInvalidDecimal",
          args: { arg: buf },
          index: this.scanner.index
        });
      }
      return num;
    }
    /**
     * @returns The id string.
     */
    id() {
      let id = String(this.scanner.current);
      this.scanner.consume();
      while (this.scanner.isLetter() || this.scanner.isDigit() || this.scanner.is("_")) {
        id += String(this.scanner.current);
        this.scanner.consume();
      }
      return id;
    }
    /**
     * Returns an xstring.
     *
     * @param type The XStr or Bin type.
     * @returns A haystack xstring.
     */
    xstr(type) {
      this.scanner.expect("(", Kind.XStr).consume();
      const hvalue = this.string();
      this.scanner.expect(")", Kind.XStr).consume();
      try {
        const value2 = hvalue.valueOf();
        return HXStr.make(type, value2);
      } catch (err) {
        const error = err;
        throw new LocalizedError({
          message: error.message,
          lex: error.message,
          index: this.scanner.index
        });
      }
    }
    /**
     * @returns A dict value
     */
    dict() {
      this.scanner.expect("{", Kind.Dict).consume();
      const tags = {};
      while (!this.scanner.isEof() && !this.scanner.is("}")) {
        this.scanner.consumeSpacesAndTabs();
        this.tag(tags);
        if (this.scanner.consumeSpacesAndTabs().is(",")) {
          this.scanner.consume();
        }
      }
      this.scanner.expect("}", Kind.Dict).consume();
      return HDict.make(tags);
    }
    /**
     * Consume a tag and add it to the tags object.
     *
     * @param tags The tags object.
     */
    tag(tags) {
      const tagName = this.tagName();
      this.scanner.consumeSpacesAndTabs();
      let hval = HMarker.make();
      if (this.scanner.is(":")) {
        this.scanner.consume();
        hval = this.readValue();
      }
      if (hval !== void 0) {
        tags[tagName] = hval;
      }
      this.scanner.consumeSpacesAndTabs();
    }
    /**
     * @returns A tag name.
     */
    tagName() {
      let tagName = "";
      if (!this.scanner.isLetter() || !this.scanner.isLowerCase()) {
        throw new LocalizedError({
          message: "Invalid tag name",
          lex: "lexerInvalidTagName",
          index: this.scanner.index
        });
      }
      tagName += this.scanner.current;
      this.scanner.consume();
      while (this.scanner.isLetter() || this.scanner.isDigit() || this.scanner.is("_")) {
        tagName += this.scanner.current;
        this.scanner.consume();
      }
      return tagName;
    }
    /**
     * @returns A symbol value.
     */
    symbol() {
      this.scanner.expect("^", Kind.Symbol).consume();
      let symbol = "";
      while (this.scanner.isLetter() || this.scanner.isDigit() || this.scanner.is("_") || this.scanner.is(":") || this.scanner.is("-") || this.scanner.is(".") || this.scanner.is("~")) {
        symbol += this.scanner.current;
        this.scanner.consume();
      }
      if (!symbol) {
        throw new LocalizedError({
          message: `Empty symbol`,
          lex: "lexerEmptySymbol",
          args: { arg: symbol },
          index: this.scanner.index
        });
      }
      return HSymbol.make(symbol);
    }
    /**
     * @returns A list value.
     */
    list() {
      const list = [];
      this.scanner.expect("[", Kind.List).consume();
      while (!this.scanner.isEof() && !this.scanner.is("]")) {
        const hval = this.readValue();
        if (hval !== void 0) {
          list.push(hval);
        }
        this.scanner.consumeSpacesAndTabs();
        if (!this.scanner.is("]")) {
          this.scanner.expect(",", Kind.List).consume();
        }
        this.scanner.consumeSpacesAndTabs();
      }
      this.scanner.expect("]", Kind.List).consume();
      return HList.make(list);
    }
    /**
     * @returns a grid value.
     */
    grid() {
      const nested = this.scanner.is("<");
      if (nested) {
        this.scanner.expect("<", Kind.Grid).consume().expect("<", Kind.Grid).consume().consumeWhiteSpace();
      }
      this.scanner.expect("v", Kind.Grid).consume().expect("e", Kind.Grid).consume().expect("r", Kind.Grid).consume().consumeSpacesAndTabs().expect(":", Kind.Grid).consume().consumeSpacesAndTabs();
      const version = this.string().value;
      if (!version) {
        throw new LocalizedError({
          message: "Grid does not contain version (ver) in meta data",
          lex: "lexerGridDoesNotContainVersion",
          index: this.scanner.index
        });
      }
      const meta = this.gridMeta();
      this.scanner.expectAndConsumeNewLine(Kind.Grid);
      const columns = [];
      while (!this.scanner.isEof()) {
        this.scanner.consumeSpacesAndTabs();
        const name = this.tagName();
        const meta2 = this.gridColumnMeta();
        columns.push(new GridColumn(name, meta2));
        this.scanner.consumeSpacesAndTabs();
        if (this.scanner.isNewLine()) {
          this.scanner.expectAndConsumeNewLine(Kind.Grid);
          break;
        } else {
          this.scanner.expect(",", Kind.Grid).consume();
        }
      }
      const rows = [];
      while (!this.scanner.isEof()) {
        if (nested && this.scanner.consumeSpacesAndTabs().is(">")) {
          break;
        }
        if (this.scanner.isNewLine()) {
          this.scanner.consume();
          break;
        }
        const cells = HDict.make();
        let lastWasValue = false;
        let index = 0;
        while (!this.scanner.isEof()) {
          this.scanner.consumeSpacesAndTabs();
          if (this.scanner.isNewLine()) {
            if (!lastWasValue) {
              ++index;
            }
            this.scanner.expectAndConsumeNewLine(Kind.Grid);
            break;
          } else if (this.scanner.is(",")) {
            if (!lastWasValue) {
              ++index;
            }
            lastWasValue = false;
            this.scanner.consume();
          } else {
            if (lastWasValue) {
              this.scanner.expect(",", Kind.Grid);
            }
            lastWasValue = true;
            const value2 = this.readValue();
            if (value2 !== void 0) {
              cells.set(columns[index].name, value2);
            }
            ++index;
          }
        }
        rows.push(cells);
      }
      if (nested) {
        this.scanner.consumeWhiteSpace().expect(">", Kind.Grid).consume().expect(">", Kind.Grid).consume();
      }
      if (!rows.length && columns.length === 1 && columns[0].name === "empty") {
        columns.splice(0, 1);
      }
      return new HGrid(new GridObjStore(version, meta, columns, rows));
    }
    /**
     * @returns The grid meta data.
     */
    gridMeta() {
      let meta;
      if (this.scanner.isSpaceOrTab()) {
        this.scanner.consumeSpacesAndTabs();
        const tags = {};
        while (!this.scanner.isEof() && !this.scanner.isNewLine()) {
          this.tag(tags);
        }
        meta = HDict.make(tags);
      } else {
        meta = HDict.make();
      }
      return meta;
    }
    /**
     * @returns The grid column meta data.
     */
    gridColumnMeta() {
      let meta;
      if (this.scanner.isSpaceOrTab()) {
        this.scanner.consumeSpacesAndTabs();
        const tags = {};
        while (!this.scanner.isEof() && !this.scanner.isNewLine() && !this.scanner.is(",")) {
          this.tag(tags);
        }
        meta = HDict.make(tags);
      } else {
        meta = HDict.make();
      }
      return meta;
    }
  };
  var __decorate = function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var Reflection = class {
    constructor(defs, subject, namespace) {
      /**
       * The resultant defs.
       */
      __publicField(this, "defs");
      /**
       * The source dict analysed.
       */
      __publicField(this, "subject");
      /**
       * The associated namespace.
       */
      __publicField(this, "namespace");
      this.defs = defs;
      this.subject = subject;
      this.namespace = namespace;
    }
    /**
     * Return true if any of the subject's tags fit the given base def.
     *
     * @param base The base def.
     * @returns True if the subject's tags fit the base.
     */
    fits(base) {
      for (const def of this.defs) {
        if (this.namespace.fits(def.defName, base)) {
          return true;
        }
      }
      return false;
    }
    /**
     * Return the reflection result as a grid.
     */
    toGrid() {
      return HGrid.make({ rows: this.defs });
    }
    /**
     * Return the primary entity type of `dict` if no entity markers
     * are implemented.
     */
    get type() {
      const entity = this.namespace.byName("entity");
      let type;
      if (entity) {
        const typesWithInheritance = /* @__PURE__ */ new Map();
        for (const def of this.defs) {
          const inheritance = this.namespace.inheritance(def.defName);
          if (inheritance.includes(entity)) {
            typesWithInheritance.set(def, inheritance);
          }
        }
        const allDefs = [...typesWithInheritance.keys()];
        if (typesWithInheritance.size === 1) {
          type = allDefs[0];
        } else {
          for (const def of allDefs) {
            let included = false;
            for (const [innerDef, inheritance] of typesWithInheritance) {
              if (innerDef !== def && inheritance.includes(def)) {
                included = true;
                break;
              }
            }
            if (!included) {
              type = def;
              break;
            }
          }
          if (!type) {
            type = allDefs[0];
          }
        }
      }
      return type ?? this.namespace.byName("dict");
    }
  };
  __decorate([
    memoize()
  ], Reflection.prototype, "type", null);
  var defaultNamespace;
  var HNamespace = class _HNamespace {
    /**
     * Constructs a new namespace.
     *
     * @param defs A grid of normalized defined defs.
     */
    constructor(grid) {
      /**
       * The underlying grid containing the defs.
       */
      __publicField(this, "$grid");
      /**
       * Maps a name to a def as a reducer function.
       *
       * This method has been designed to be used in an Array's reducer function
       * to convert names to defs.
       */
      __publicField(this, "reduceNameToDef", (dicts, name) => {
        if (name) {
          const def = this.byName(String(name));
          if (def) {
            dicts.push(def);
          }
        }
        return dicts;
      });
      this.$grid = grid;
    }
    /**
     * @returns The default namespace for the environment.
     */
    static get defaultNamespace() {
      return defaultNamespace ?? (defaultNamespace = new _HNamespace(HGrid.make({})));
    }
    /**
     * Set the default namespace for the environment.
     *
     * @param namespace The new default namespace.
     */
    static set defaultNamespace(namespace) {
      defaultNamespace = namespace;
    }
    /**
     * Returns a defs lookup map.
     *
     * Since defs are keyed by a symbol this map provides fast look up.
     *
     * @returns A object with key to value defs.
     */
    get defs() {
      const defs = {};
      for (const dict of this.$grid) {
        const name = dict.defName;
        if (name) {
          defs[String(name)] = dict;
        }
      }
      return defs;
    }
    /**
     * Return a def via its name or undefined if it can't be found.
     *
     * @param name The name of the def to look up.
     * @returns The def or undefined if it can't be found.
     */
    byName(name) {
      return this.defs[String(name)];
    }
    /**
     * Return a def via its name or undefined if it can't be found.
     *
     * This method is a duplicate of `byName`.
     *
     * @param name The name of the def to look up.
     * @returns The def or undefined if it can't be found.
     */
    get(name) {
      return this.byName(name);
    }
    /**
     * Return true if the def exists in the namespace.
     *
     * @param name The name of the def to look up.
     * @returns True if the def exists.
     */
    hasName(name) {
      return !!this.defs[String(name)];
    }
    /**
     * Return true if the def exists in the namespace.
     *
     * This method is a duplicate of `hasName`.
     *
     * @param name The name of the def to look up.
     * @returns True if the def exists.
     */
    has(name) {
      return this.hasName(name);
    }
    /**
     * Return an array of dicts via their names. If a name can't
     * be found then throw an error.
     *
     * @param names The names of the defs to look up.
     * @returns A array of defs.
     * @throws An error if the def can't be found.
     */
    byAllNames(...names) {
      const nameList = names.reduce((ns, name) => (
        // Flatten the name list.
        ns.concat(Array.isArray(name) ? name.map((nm) => String(nm)) : [String(name)])
      ), []);
      const dicts = [];
      for (const name of nameList) {
        const dict = this.byName(name);
        if (dict) {
          dicts.push(dict);
        } else {
          throw new Error(`Could not find ${name}`);
        }
      }
      return dicts;
    }
    /**
     * @returns A list of all available conjunct defs.
     */
    get conjuncts() {
      const defs = this.defs;
      return Object.keys(defs).filter(_HNamespace.isConjunct).map((name) => defs[name]);
    }
    /**
     * Return true if the name is for a conjunct.
     *
     * @param name The name to test.
     * @returns True if the name is for a conjunct.
     */
    static isConjunct(name) {
      return String(name).includes("-");
    }
    /**
     * Split the conjunct name into its component parts.
     *
     * @param name The name to split.
     * @returns The split marker tag names for the conjunct.
     */
    static splitConjunct(name) {
      return String(name).split("-");
    }
    /**
     * Decomposes a conjunct into its respective defs and returns them.
     *
     * If the def is not a conjunct then it will just return itself.
     *
     * @param name The conjunct def to breakdown.
     * @returns The defs the conjunct references.
     * @throws An error if any of the defs are invalid.
     */
    conjunctDefs(name) {
      return this.byAllNames(_HNamespace.splitConjunct(name));
    }
    /**
     * Cache built to speed calculation of conjuncts.
     *
     * Example:
     * ```
     * {
     *   "ac": [
     *   	["elec"],
     *   	["elec", "meter"],
     *   	["freq"]
     *   ],
     *   "active": [
     *   	["power"]
     *   ],
     *   "air": [
     *   	["temp"]
     *   ],
     *   ...
     * }
     * ```
     */
    get $conjunctsKeyMap() {
      return this.conjuncts.map((d) => _HNamespace.splitConjunct(d.defName)).reduce((a, c) => {
        const key = c[0];
        if (!a[key]) {
          a[key] = [];
        }
        a[key].push(c.slice(1));
        return a;
      }, {});
    }
    /**
     * Find all the conjuncts for the markers.
     *
     * @param markers The markers
     * @param conjuncts The found conjuncts.
     */
    findConjuncts(markers, conjuncts) {
      const map = this.$conjunctsKeyMap;
      for (const marker2 of markers) {
        const match = map[marker2];
        if (match) {
          match.forEach((m) => {
            if (m.every((t) => markers.includes(t))) {
              const def = this.byName([marker2, ...m].join("-"));
              if (def) {
                conjuncts.push(def);
              }
            }
          });
        }
      }
    }
    /**
     * @returns A list of feature defs.
     */
    get features() {
      const defs = this.defs;
      return Object.keys(defs).filter(_HNamespace.isFeature).map((name) => defs[name]);
    }
    /**
     * Return true if the name is for a feature.
     *
     * @param name The name to test.
     * @returns True if the name is for a feature.
     */
    static isFeature(name) {
      return String(name).includes(":");
    }
    /**
     * Return the feature from the feature key. An empty
     * string is returned if no feature can be found.
     *
     * For example, `lib:foo` would return `lib`.
     *
     * @param name The name to parse.
     * @returns The feature.
     */
    static getFeature(name) {
      return _HNamespace.isFeature(name) ? String(name).split(":")[0] : "";
    }
    /**
     * Return the feature name from the feature key. An empty
     * string is returned if no feature name can be found.
     *
     * For example, `lib:foo` would return `foo`.
     *
     * @param name The name to parse.
     * @returns The feature name.
     */
    static getFeatureName(name) {
      return _HNamespace.isFeature(name) ? String(name).split(":")[1] : "";
    }
    /**
     * @returns A list of all the libs implemented by this namespace.
     */
    get libs() {
      return this.subTypesOf("lib");
    }
    /**
     * Returns the subtypes of the type.
     *
     * @param name The def name.
     * @returns The subtypes.
     */
    subTypesOf(name) {
      return this.subTypes[String(name)] ?? [];
    }
    /**
     * Returns true if the def has subtypes.
     *
     * @param name The def name.
     * @returns True if the def has subtypes.
     */
    hasSubTypes(name) {
      return !!this.subTypes[String(name)];
    }
    /**
     * Returns a flattened list of all the subtypes.
     *
     * @param name The def name.
     * @returns A list of subtypes.
     */
    allSubTypesOf(name) {
      const subTypes = /* @__PURE__ */ new Set();
      this.findSubTypes(name, subTypes);
      return [...subTypes];
    }
    /**
     * Find all the specified subtypes.
     *
     * @param name The def name.
     * @param subTypes The subtypes Set.
     */
    findSubTypes(name, subTypes) {
      const defs = this.subTypesOf(name);
      for (const dict of defs) {
        subTypes.add(dict);
        this.findSubTypes(dict.defName, subTypes);
      }
    }
    /**
     * Returns an object with name to subtype defs.
     *
     * This enables quick look up of a type's subtypes.
     *
     * @returns A name to subtype def object.
     */
    get subTypes() {
      const subTypes = {};
      const defs = this.defs;
      for (const name in defs) {
        const def = this.byName(name);
        if (def) {
          const is = def.get("is");
          if (is) {
            for (const superName of is) {
              if (superName) {
                const subs = subTypes[superName.value] ?? (subTypes[superName.value] = []);
                subs.push(def);
              }
            }
          }
        }
      }
      return subTypes;
    }
    /**
     * Returns the supertypes of a def or an empty array if it can't be found.
     *
     * @param name The def name.
     * @returns The supertype defs.
     */
    superTypesOf(name) {
      return this.has(name) ? this.doSuperTypesOf(name) : [];
    }
    doSuperTypesOf(name) {
      return this.byName(name)?.get("is")?.reduce(this.reduceNameToDef, []) ?? [];
    }
    /**
     * Returns a flattened list of all the supertypes in the whole supertype chain.
     *
     * @param name The def name.
     * @returns A list of supertypes.
     */
    allSuperTypesOf(name) {
      const superTypes = /* @__PURE__ */ new Set();
      this.findSuperTypes(name, superTypes);
      return [...superTypes];
    }
    /**
     * Find all the specified supertypes.
     *
     * @param name The def name.
     * @param superTypes The supertypes Set.
     */
    findSuperTypes(name, superTypes) {
      const defs = this.superTypesOf(name);
      for (const dict of defs) {
        superTypes.add(dict);
        this.findSuperTypes(dict.defName, superTypes);
      }
    }
    /**
     * Returns the choices for def.
     *
     * @param name The def name.
     * @returns The choices for a def.
     */
    choicesFor(name) {
      return this.isChoice(name) ? this.subTypesOf(name) : [];
    }
    /**
     * @returns An object containing names to subtypes for
     * all defs that are choices.
     */
    get choices() {
      const choices = {};
      const defs = this.defs;
      for (const name in defs) {
        if (this.isChoice(name)) {
          choices[name] = this.choicesFor(name);
        }
      }
      return choices;
    }
    isChoice(name) {
      return !!this.superTypesOf(name).find((superType) => superType.defName === "choice");
    }
    /**
     * @returns The name of the available features.
     */
    get featureNames() {
      const names = /* @__PURE__ */ new Set();
      const defs = this.defs;
      for (const name in defs) {
        if (_HNamespace.isFeature(name)) {
          const colon = name.indexOf(":");
          if (colon > -1) {
            const featureName = name.substring(0, colon);
            if (featureName) {
              names.add(featureName);
            }
          }
        }
      }
      return [...names];
    }
    /**
     * @returns A list of all the tagOn names.
     */
    get tagOnNames() {
      const names = /* @__PURE__ */ new Set();
      const defs = this.defs;
      for (const name in defs) {
        const tagOn = this.byName(name)?.get("tagOn");
        if (tagOn) {
          for (const tagName of tagOn) {
            if (tagName) {
              names.add(tagName.value);
            }
          }
        }
      }
      return [...names];
    }
    /**
     * @returns A object that maps def names to their respective tagOn defs.
     */
    get tagOnIndices() {
      return Object.keys(this.defs).reduce((obj, name) => {
        const defs = this.byName(name)?.get("tagOn")?.reduce(this.reduceNameToDef, []);
        if (defs && defs.length) {
          obj[name] = defs;
        }
        return obj;
      }, {});
    }
    /**
     * Return the defs inheritance as a flattened array of defs.
     *
     * @param name The def name.
     * @returns The def's inheritance.
     */
    inheritance(name) {
      return this.has(name) ? this.doInheritance(name) : [];
    }
    doInheritance(name) {
      const defs = /* @__PURE__ */ new Set();
      const def = this.byName(name);
      if (def) {
        defs.add(def);
        this.findSuperTypes(name, defs);
      }
      return [...defs];
    }
    /**
     * Return an array of defs for the given association on the parent.
     *
     * @param parent The parent def.
     * @param association The association.
     * @returns An array of associated defs.
     */
    associations(parent, association) {
      const assocDef = this.byName(association);
      if (!assocDef?.get("is")?.includes(HSymbol.make("association"))) {
        return [];
      }
      if (!this.hasComputedFromReciprocal(assocDef)) {
        return this.byName(parent)?.get(String(association))?.reduce(this.reduceNameToDef, []) ?? [];
      }
      const reciprocalOf = assocDef.get("reciprocalOf");
      if (!reciprocalOf) {
        return [];
      }
      const recipDef = this.byName(reciprocalOf);
      if (!recipDef) {
        return [];
      }
      return this.findReciprocalAssociations(parent, reciprocalOf);
    }
    /**
     * Return true if the def has the `computedFromReciprocal` tag.
     *
     * If the `computedFromReciprocal` tag is not found at all then assume we're using
     * an older version of haystack and look for the `computed` tag instead.
     *
     * @param def The def to check.
     * @returns True if the `computedFromReciprocal` tag is found.
     */
    hasComputedFromReciprocal(def) {
      return def.has(this.has("computedFromReciprocal") ? "computedFromReciprocal" : "computed");
    }
    /**
     * Return the assocations for the parent for the reciprocal assocation.
     *
     * @param parent The parent def.
     * @param reciprocalOf The reciprocal association.
     * @returns An array of associated defs.
     */
    findReciprocalAssociations(parent, reciprocalOf) {
      const inheritance = this.inheritance(parent);
      const matches = /* @__PURE__ */ new Set();
      const recipStr = String(reciprocalOf);
      for (const name in this.defs) {
        const def = this.byName(name);
        const list = def?.get(recipStr);
        if (def && list) {
          for (const symbol of list) {
            if (symbol) {
              const target = this.byName(symbol);
              if (target && inheritance.includes(target)) {
                matches.add(def);
              }
            }
          }
        }
      }
      return [...matches];
    }
    /**
     * Return an array of defs for the `is` association on the parent.
     *
     * @param parent The parent def.
     * @returns An array of associated defs.
     */
    is(parent) {
      return this.associations(parent, "is");
    }
    /**
     * Return an array of defs for the `tagOn` association on the parent.
     *
     * @param parent The parent def.
     * @returns An array of associated defs.
     */
    tagOn(parent) {
      return this.associations(parent, "tagOn");
    }
    /**
     * Return an array of defs for the `tags` association on the parent.
     *
     * @param parent The parent def.
     * @returns An array of associated defs.
     */
    tags(parent) {
      return this.associations(parent, "tags");
    }
    /**
     * Analyze the subject dict and return its implemented defs.
     *
     * @param subject The subject dict.
     * @returns The reflected defs.
     */
    reflect(subject) {
      const foundDefs = [];
      const markers = [];
      this.findDefs(subject, foundDefs, markers);
      this.findConjuncts(markers, foundDefs);
      const reflected = this.findSuperTypesFromDefs(foundDefs);
      return new Reflection([...reflected], subject, this);
    }
    /**
     * Match the most specific marker entity type for the specified dict.
     *
     * @param subject The subject dict.
     * @returns The entity def or `dict` if one cannot be found.
     */
    defOfDict(subject) {
      return this.reflect(subject).type;
    }
    /**
     * Find the defs on the subject.
     *
     * @param subject The subject to search for defs.
     * @param foundDefs The found defs.
     * @param markers Any marker tags found.
     */
    findDefs(subject, foundDefs, markers) {
      for (const name of subject.keys) {
        const def = this.byName(name);
        if (def) {
          foundDefs.push(def);
          if (subject.get(name)?.isKind(Kind.Marker)) {
            markers.push(name);
          }
        }
      }
    }
    /**
     * Return all the super types from the specified defs.
     *
     * @param defs The defs to search.
     * @returns The supertype defs.
     */
    findSuperTypesFromDefs(defs) {
      const reflected = /* @__PURE__ */ new Set();
      for (const dict of defs) {
        reflected.add(dict);
        this.findSuperTypes(dict.defName, reflected);
      }
      return [...reflected];
    }
    /**
     * Return true if the specified def `fits` the base def.
     *
     * If true this means that `def` is assignable to types of `base`.
     * This is effectively the same as checking if `inheritance(def)` contains
     * base.
     *
     * @param name The def name.
     * @param base The name of the base def.
     * @returns True if the def fits.
     */
    fits(name, base) {
      const baseDef = this.byName(base);
      return !!(baseDef && this.inheritance(name).includes(baseDef));
    }
    /**
     * Return true if the specified def is a marker.
     *
     * @param name The def name.
     * @returns True if the def is a marker.
     */
    fitsMarker(name) {
      return this.fits(name, "marker");
    }
    /**
     * Return true if the specified def is a val.
     *
     * @param name The def name.
     * @returns True if the def is a val.
     */
    fitsVal(name) {
      return this.fits(name, "val");
    }
    /**
     * Return true if the specified def is a choice.
     *
     * @param name The def name.
     * @returns True if the def is a choice.
     */
    fitsChoice(name) {
      return this.fits(name, "choice");
    }
    /**
     * Return true if the specified def is a entity.
     *
     * @param name The def name.
     * @returns True if the def is a entity.
     */
    fitsEntity(name) {
      return this.fits(name, "entity");
    }
    /**
     * Return the tags that should be added for implementation.
     *
     * @param name The def name.
     * @returns An array of defs to be added.
     */
    implementation(name) {
      let dicts = this.conjunctDefs(name);
      dicts = dicts.filter((def) => !_HNamespace.isFeature(def.defName));
      const superTypes = /* @__PURE__ */ new Set();
      for (const dict of dicts) {
        this.findSuperTypes(dict.defName, superTypes);
      }
      for (const superType of superTypes) {
        if (superType.get("mandatory")?.equals(HMarker.make())) {
          dicts.push(superType);
        }
      }
      for (const tag of this.tags(name)) {
        if (tag.get("compulsory")?.equals(HMarker.make())) {
          dicts.push(tag);
        }
      }
      return dicts;
    }
    /**
     * Return the Haystack kind value from the def. If the def is invalid or a kind
     * cannot be ascertained then return undefined.
     *
     * Please note, `curVal` and `writeVal` are scalars but don't extend
     * a def that could relate to a concrete type (i.e. number or bool). This implies
     * these values can be any scalar and hence match multiple kinds. In this case undefined
     * will be returned for the kind.
     *
     * @param name The name of the def to get the kind for.
     * @returns The kind or undefined it one cannot be found.
     */
    defToKind(name) {
      const def = this.byName(name);
      if (!def) {
        return void 0;
      }
      const hsTypeDefs = this.hsTypeDefs;
      const types = /* @__PURE__ */ new Set();
      types.add(def);
      this.allSuperTypesOf(def.defName).forEach(types.add, types);
      let kind;
      if (types.has(hsTypeDefs.marker)) {
        kind = Kind.Marker;
      } else if (types.has(hsTypeDefs.bool)) {
        kind = Kind.Bool;
      } else if (types.has(hsTypeDefs.number)) {
        kind = Kind.Number;
      } else if (types.has(hsTypeDefs.str)) {
        kind = Kind.Str;
      } else if (types.has(hsTypeDefs.coord)) {
        kind = Kind.Coord;
      } else if (types.has(hsTypeDefs.date)) {
        kind = Kind.Date;
      } else if (types.has(hsTypeDefs.dateTime)) {
        kind = Kind.DateTime;
      } else if (types.has(hsTypeDefs.dict)) {
        kind = Kind.Dict;
      } else if (types.has(hsTypeDefs.grid)) {
        kind = Kind.Grid;
      } else if (types.has(hsTypeDefs.list)) {
        kind = Kind.List;
      } else if (types.has(hsTypeDefs.na)) {
        kind = Kind.NA;
      } else if (types.has(hsTypeDefs.ref)) {
        kind = Kind.Ref;
      } else if (types.has(hsTypeDefs.symbol)) {
        kind = Kind.Symbol;
      } else if (types.has(hsTypeDefs.time)) {
        kind = Kind.Time;
      } else if (types.has(hsTypeDefs.uri)) {
        kind = Kind.Uri;
      } else if (types.has(hsTypeDefs.xstr)) {
        kind = Kind.XStr;
      }
      return kind;
    }
    /**
     * @returns The defs for all of the core haystack value types.
     */
    get hsTypeDefs() {
      return {
        bool: this.byName("bool"),
        coord: this.byName("coord"),
        date: this.byName("date"),
        dateTime: this.byName("dateTime"),
        dict: this.byName("dict"),
        grid: this.byName("grid"),
        list: this.byName("list"),
        marker: this.byName("marker"),
        na: this.byName("na"),
        number: this.byName("number"),
        ref: this.byName("ref"),
        str: this.byName("str"),
        symbol: this.byName("symbol"),
        time: this.byName("time"),
        uri: this.byName("uri"),
        xstr: this.byName("xstr")
      };
    }
    /**
     * Return a reflected array of children prototypes for the parent dict.
     *
     * @param name The parent dict.
     * @returns An array of children.
     */
    protos(parent) {
      return parent.keys.map((name) => this.protosForDef(parent, name)).reduce((dicts, children) => {
        for (const child of children) {
          if (!dicts.find((d) => d.equals(child))) {
            dicts.push(child);
          }
        }
        return dicts;
      }, []);
    }
    /**
     * Return a reflected array of children prototypes for the def.
     *
     * @param parent The parent dict.
     * @param name The def name.
     * @returns An array of children.
     */
    protosForDef(parent, name) {
      let protos;
      const def = this.byName(name);
      const children = def?.get("children");
      if (def && children) {
        protos = valueIsKind(children, Kind.Str) ? _HNamespace.parseMultiLineStringToDicts(children) : children.toArray().filter((dict) => !!dict);
        const flattened = this.findFlattenedChildren(def, parent);
        protos = protos.map((dict) => HDict.merge(flattened, dict));
      }
      return protos ?? [];
    }
    /**
     * Parse the multi-line values into a list of dict.
     *
     * @param val The value string to parse.
     * @returns A list of dicts.
     */
    static parseMultiLineStringToDicts(val) {
      return val.value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("//")).map((line) => ZincReader.readValue(`{${line}}`));
    }
    /**
     * Find the flattened children on the parent dict.
     *
     * @param def The def that may have the `childrenFlatten` tag.
     * @param parent The parent to search for values.
     * @returns A dict with the flattened children information.
     */
    findFlattenedChildren(def, parent) {
      return def?.get("childrenFlatten")?.reduce((dict, name) => {
        for (const key of parent.keys) {
          if (name && this.fits(key, name)) {
            dict.set(key, parent.get(key));
          }
        }
        return dict;
      }, HDict.make({})) ?? HDict.make({});
    }
    /**
     * @returns The underlying grid for the namespace.
     */
    get grid() {
      return this.$grid;
    }
    /**
     * Return a grid for the namespace.
     *
     * @returns A grid with all the definitions.
     */
    toGrid() {
      return this.grid;
    }
    /**
     * @returns A list of available timezones.
     */
    get timezones() {
      return this.byName("tz")?.get("enum")?.value?.split("\n").reduce((cur, prev) => cur.push(prev), HList.make([])) ?? HList.make([]);
    }
    /**
     * Query a subject's relationship.
     *
     * Relationships model how entities are related to one another via instance to instance
     * relationships versus def to def associations.
     *
     * https://project-haystack.dev/doc/docHaystack/Relationships#querying
     *
     * @param options.subject The subject dict being queried.
     * @param options.relName The name of the relationship to query.
     * @param options.relTerm An optional relationship term to query against.
     * @param options.ref An optional reference target.
     * @param options.resolve An optional function that can resolve dicts (records) from a ref.
     * @param options.queried An internally passed collection used for stopping infinite loops.
     * @returns True if a match is made.
     */
    hasRelationship({ subject, relName, relTerm, ref: ref2, resolve, queried }) {
      const relationship = this.byName(relName);
      if (!relationship) {
        return false;
      }
      const relNameStr = HSymbol.make(relName).value;
      if (!this.inheritance(relName).some((def) => def.defName === "relationship")) {
        return false;
      }
      const transitive = relationship.has("transitive");
      const reciprocalOf = relationship.get("reciprocalOf");
      const id = subject.get("id");
      for (const subjectKey of subject.keys) {
        const subjectVal = subject.get(subjectKey);
        const subjectDef = this.byName(subjectKey);
        let relVal = subjectDef?.get(relNameStr);
        if (!relVal && reciprocalOf && ref2 && valueIsKind(id, Kind.Ref) && ref2.equals(id) && valueIsKind(subjectVal, Kind.Ref)) {
          relVal = subjectDef?.get(reciprocalOf.value);
          if (relVal) {
            ref2 = subjectVal;
          }
        }
        if (relVal) {
          let match = false;
          if (relTerm) {
            if (valueIsKind(relVal, Kind.Symbol)) {
              match = this.fits(relVal, relTerm);
            }
          } else {
            match = true;
          }
          if (match && ref2) {
            match = false;
            if (ref2.equals(subjectVal)) {
              match = true;
            } else if (transitive && resolve && valueIsKind(subjectVal, Kind.Ref)) {
              if (!queried) {
                queried = /* @__PURE__ */ new Set();
              }
              if (!queried.has(subjectVal.value)) {
                queried.add(subjectVal.value);
                const newSubject = resolve(subjectVal);
                if (newSubject) {
                  match = this.hasRelationship({
                    subject: newSubject,
                    relName,
                    relTerm,
                    ref: ref2,
                    resolve,
                    queried
                  });
                }
              }
            }
          }
          if (match) {
            return true;
          }
        }
      }
      return false;
    }
    /**
     * Validates a dict for a tag.
     *
     * ```
     * try {
     *   namespace.validate('site', new HDict({ site: HMarker.make() }))
     * }
     * catch(err) {
     *   console.error(err)
     * }
     * ```
     *
     * @param name The name of the tag to validate.
     * @param dict The dict to validate against.
     * @throws An error if the tags on the dict are not valid.
     */
    validate(name, dict) {
      if (!valueIsKind(dict, Kind.Dict)) {
        throw new LocalizedError({
          message: "Invalid dict",
          lex: "invalidDict"
        });
      }
      const tagName = String(name);
      if (!this.reflect(dict)?.fits(tagName)) {
        throw new LocalizedError({
          message: `'${tagName}' does not fit dict`,
          lex: "doesNotFitDict",
          args: { name: tagName }
        });
      }
      const mandatoryTags = [
        this.byName(tagName),
        ...this.allSuperTypesOf(tagName)
      ].filter((superDef) => superDef.get("mandatory")?.equals(HMarker.make()));
      for (const { defName } of mandatoryTags) {
        if (!dict.has(defName)) {
          throw new LocalizedError({
            message: `Cannot find mandatory tag '${defName}'`,
            lex: "cannotFindMandatory",
            args: { name: defName }
          });
        }
        this.validateKind(defName, dict);
      }
      const compulsoryTags = this.tags(tagName).filter((def) => def.get("compulsory")?.equals(HMarker.make()));
      for (const { defName } of compulsoryTags) {
        if (!dict.has(defName)) {
          throw new LocalizedError({
            message: `Cannot find compulsory tag '${defName}'`,
            lex: "cannotFindCompulsory",
            args: { name: defName }
          });
        }
        this.validateKind(defName, dict);
      }
    }
    /**
     * Validates kind for a tag. Tag values that are null are skipped.
     *
     * @param name The name of the tag.
     * @param dict The dict used for validation.
     * @throws An error if the kind is invalid.
     */
    validateKind(name, dict) {
      const kind = this.defToKind(name);
      if (!kind) {
        throw new LocalizedError({
          message: `Cannot find kind for '${name}'`,
          lex: "cannotFindKind",
          args: { name }
        });
      }
      const value2 = dict.get(name);
      if (value2 && !value2.isKind(kind)) {
        throw new LocalizedError({
          message: `Kind mismatch. '${name}' is ${value2.getKind()} not ${kind}`,
          lex: "kindMismatch",
          args: { name, kind, valueKind: value2.getKind() }
        });
      }
    }
    /**
     * Validates all of the tags on the dict. Any tags that don't exist in the namespcae
     * will be skipped.
     *
     * ```
     * try {
     *   namespace.validateAll(new HDict({ site: HMarker.make() }))
     * }
     * catch(err) {
     *   console.error(err)
     * }
     * ```
     *
     * @param dict The dict to validate.
     * @throws An error if the tags on the dict are not valid.
     */
    validateAll(dict) {
      if (!valueIsKind(dict, Kind.Dict)) {
        throw new LocalizedError({
          message: "Invalid dict",
          lex: "invalidDict"
        });
      }
      for (const { name } of dict) {
        if (this.has(name)) {
          this.validate(name, dict);
          this.validateKind(name, dict);
        }
      }
    }
    /**
     * Return true if the dict is valid for the specified tag.
     *
     * @param name The tag name.
     * @param dict The dict to validate against.
     * @returns true if the dict is valid.
     */
    isValid(name, dict) {
      try {
        this.validate(name, dict);
        return true;
      } catch {
        return false;
      }
    }
    /**
     * Create a new dict with all the default required tags.
     *
     * @param names The names of the tags to add.
     * @returns The new dict with all the default requirement tags.
     */
    newDict(names) {
      const dict = new HDict();
      for (const name of names) {
        const defs = this.implementation(name);
        for (const def of [this.byName(name), ...defs]) {
          if (def) {
            const kind = this.defToKind(def.defName);
            if (kind) {
              const value2 = makeDefaultValue(kind);
              if (value2) {
                dict.set(def.defName, value2);
              }
            }
          }
        }
      }
      return dict;
    }
    /**
     * Return all the containment refs available.
     *
     * @returns A list of all the containment refs.
     */
    getContainmentRefs() {
      return this.allSubTypesOf("ref").filter((def) => def.has("containedBy"));
    }
    /**
     * Return the first containment ref def that matches the specified name.
     *
     * Please note, this will filter out any defs that are marked as deprecated.
     *
     * @param name The name of the def to search the ref for.
     * @returns The containment ref def.
     */
    findContainmentRef(name) {
      return this.getContainmentRefs().find((def) => !def.has("deprecated") && this.fits(name, def.get("containedBy")));
    }
  };
  __decorate([
    memoize()
  ], HNamespace.prototype, "defs", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "conjuncts", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "$conjunctsKeyMap", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "features", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "libs", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "subTypes", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "doSuperTypesOf", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "choices", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "featureNames", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "tagOnNames", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "tagOnIndices", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "doInheritance", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "findReciprocalAssociations", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "hsTypeDefs", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "timezones", null);
  __decorate([
    memoize()
  ], HNamespace.prototype, "getContainmentRefs", null);
  var DictValueIterator = class {
    constructor(dict) {
      __publicField(this, "$values");
      __publicField(this, "$keys");
      __publicField(this, "$index", 0);
      this.$values = dict.toObj();
      this.$keys = Object.keys(this.$values);
    }
    next() {
      if (this.$index >= this.$keys.length) {
        return {
          done: true,
          value: void 0
        };
      }
      const name = this.$keys[this.$index++];
      return {
        done: false,
        value: {
          name,
          value: this.$values[name]
        }
      };
    }
  };
  var HDict = class _HDict {
    /**
     * Create a dict using a set of object values.
     *
     * There are multiple ways to create a dict...
     *
     * ```typescript
     * // Create an empty dict
     * const dict0 = new HDict()
     *
     * // Create a dict from a bunch of key haystack value pairs
     * const dict1 = new HDict({ foo: HStr.make('foovalue;), boo: HNum.make(123) })
     *
     * // Same but with Hayson
     * const dict2 = new HDict({ foo: 'foovalue', boo: 123 })
     *
     * // Create a grid from any haystack value...
     * const dict3 = new HDict(HStr.make('foovalue')) // Create with one row and one column as 'val'.
     * ```
     *
     * @param values dict values to create a dict with.
     * @returns A dict.
     */
    constructor(values) {
      /**
       * The dict values.
       */
      __publicField(this, "$store");
      if (isDictStore(values)) {
        this.$store = values;
      } else {
        let hvalObjs;
        if (isHVal(values) || values === null) {
          if (valueIsKind(values, Kind.Dict)) {
            hvalObjs = values.toObj();
          } else if (valueIsKind(values, Kind.Grid)) {
            hvalObjs = {};
            for (let i = 0; i < values.length; ++i) {
              hvalObjs[`row${i}`] = values.get(i);
            }
          } else {
            hvalObjs = { val: values };
          }
        } else if (values) {
          hvalObjs = toHValObj(values);
        } else {
          hvalObjs = {};
        }
        this.$store = new DictHValObjStore(hvalObjs);
      }
      return this.makeProxy();
    }
    /**
     * Implement proxy to make it easy to get and set internal values.
     */
    makeProxy() {
      const handler = {
        get: function(target, prop) {
          const anyTarget = target;
          if (typeof prop === "string" && anyTarget[prop] === void 0) {
            if (!target.has(prop) && /^[0-9]+$/.test(prop)) {
              const name = target.keys[Number(prop)];
              if (name) {
                return {
                  name,
                  value: target.get(name)
                };
              }
            }
            return target.get(prop);
          }
          return anyTarget[prop];
        },
        set(target, prop, value2) {
          const anyTarget = target;
          if (typeof prop === "string" && anyTarget[prop] === void 0) {
            target.set(prop, value2);
          } else {
            anyTarget[prop] = value2;
          }
          return true;
        }
      };
      return new Proxy(this, handler);
    }
    /**
     * Make a dict using a set of object values.
     *
     * @param values dict values to create a dict with.
     * @returns A dict.
     */
    static make(values) {
      return valueIsKind(values, Kind.Dict) ? values : new _HDict(values);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Dict;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /**
     * Returns a haystack value from the dict or undefined
     * if it can't be found.
     *
     * ```typescript
     * // Gets the value as an HVal so cast to an HStr.
     * const str = dict.get('foo') as HStr
     *
     * if (str) {
     *   // Do something.
     * }
     *
     * // Method is generic to make it easier on the eye for casting.
     * const str1 = dict.get<HStr>('foo')
     * ```
     *
     * @param name The name of the value to find.
     * @return The value or undefined if it can't be found.
     */
    get(name) {
      return this.$store.get(name);
    }
    /**
     * Set a haystack value.
     *
     * ```typescript
     * dict.set('foo', HStr.make('New value'))
     *
     * // Set the value using Hayson
     * dict.set('foo', 'New value')
     * ```
     *
     * @param name The name to set.
     * @param value The haystack value to set.
     * @returns The dict instance.
     */
    set(name, value2) {
      this.$store.set(name, makeValue(value2));
      return this;
    }
    /**
     * Update a dict from another dict(s) or Hayson dict(s).
     *
     * ```typescript
     * dict.update(otherDict, anotherDict)
     *
     * // Update using a Hayson object
     * dict.update({ dis: 'A new display string', curVal: 20 })
     * ```
     *
     * @param dicts The dicts to update from.
     * @returns The dict instance.
     */
    update(...dicts) {
      for (const dict of dicts) {
        const updateDict = makeValue(dict);
        for (const name of updateDict.keys) {
          const val = updateDict.get(name);
          if (val !== void 0) {
            this.set(name, val);
          }
        }
      }
      return this;
    }
    /**
     * Returns true if the dict has the specified key.
     *
     * ```typescript
     * if (dict.has('foo')) {
     *   // Do something
     * }
     * ```
     *
     * @param name The name of the key.
     * @returns True if the value exists in the dict.
     */
    has(name) {
      return this.$store.has(name);
    }
    /**
     * Return true if the dict matches the specified filter or if
     * the value exists in the dict at least once.
     *
     * ```typescript
     * if (dict.any('site and geoCity == "London"')) {
     *   ...
     * }
     * ```
     *
     * @param filter The haystack value, haystack filter or AST node.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the property value exists in the dict.
     * @throws An error for a invalid haystack filter.
     */
    any(filter, cx) {
      if (isHVal(filter) || filter === null) {
        for (const key of this.keys) {
          const val = this.get(key);
          if (valueEquals(val, filter)) {
            return true;
          }
        }
        return false;
      } else if (
        // Skip the full filter check if we just have a property name.
        typeof filter === "string" && /^[a-zA-Z0-9_]+$/g.test(filter)
      ) {
        return !!this.get(filter);
      } else {
        return new HFilter(filter).eval({
          dict: this,
          namespace: cx?.namespace,
          resolve: cx?.resolve
        });
      }
    }
    /**
     * Returns true if the haystack filter matches the value.
     *
     * This method is the same as `any`.
     *
     * ```typescript
     * if (dict.matches('site and geoCity == "London"')) {
     *   // Do something
     * }
     * ```
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return this.any(filter, cx);
    }
    /**
     * Removes a property from the dict.
     *
     * ```typescript
     * // Removes the tag named foo.
     * dict.remove('foo')
     * ```
     *
     * @param name The property name.
     */
    remove(name) {
      this.$store.remove(name);
    }
    /**
     * Clear all entries from the dict.
     *
     * ```typescript
     * // Clear all the entries from the dict.
     * dict.clear()
     * ```
     */
    clear() {
      this.$store.clear();
    }
    /**
     * ```typescript
     * console.log('Size: ' + dict.length)
     * ```
     *
     * @returns The number of entries in the dict.
     */
    get length() {
      return this.keys.length;
    }
    /**
     * ```typescript
     * for (let key of dict.keys) {
     *   console.log(key)
     * }
     * ```
     *
     * @returns All keys used in the dict.
     */
    get keys() {
      return this.$store.getKeys();
    }
    /**
     * ```typescript
     * for (let value of dict.values) {
     *   console.log(value.getKind())
     * }
     * ```
     * @returns All values for the dict.
     */
    get values() {
      return this.keys.map((key) => this.$store.get(key));
    }
    /**
     * ```typescript
     * if (dict.isEmpty()) {
     *   // There are no entries in the dict.
     * }
     * ```
     *
     * @returns True when there are no entries in the dict.
     */
    isEmpty() {
      return this.$store.getKeys().length === 0;
    }
    /**
     * Returns the underlying object being managed by the store.
     *
     * ```typescript
     * // Gets a JS Object with the keys as strings and the values as HVals.
     * const obj = dict.toObj()
     * ```
     *
     * @returns A the underlying object.
     */
    toObj() {
      return this.$store.toObj();
    }
    /**
     * ```typescript
     * // Convert the dict to an HList of haystack strings.
     * const hlist = dict.toList<HStr>()
     * ```
     *
     * @returns All the dict's values as a haystack list
     */
    toList() {
      return HList.make(this.values);
    }
    /**
     * ```typescript
     * // Convert the dict to an HGrid with one row.
     * const hgrid = dict.toGrid()
     * ```
     * @returns The dict as a grid.
     */
    toGrid() {
      return HGrid.make({ rows: [this] });
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return this;
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return this.$store.toJSON();
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return this.$store.toJSONString();
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return this.$store.toJSONUint8Array();
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      const obj = {};
      for (const key of this.keys) {
        obj[key] = this.get(key)?.toJSONv3() ?? null;
      }
      return obj;
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * A dict isn't supported in filter so throw an error.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      throw new Error(NOT_SUPPORTED_IN_FILTER_MSG);
    }
    /**
     * Encodes to an encoding zinc value.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      let zinc = "{";
      for (const key of this.keys) {
        const value2 = this.get(key);
        if (zinc.length > 1) {
          zinc += " ";
        }
        zinc += valueIsKind(value2, Kind.Marker) ? key : `${key}:${value2?.toZinc(
          /*nested*/
          true
        ) ?? ZINC_NULL}`;
      }
      zinc += "}";
      return zinc;
    }
    /**
     * @returns An Axon encoded string.
     */
    toAxon() {
      let zinc = "{";
      for (const key of this.keys) {
        const value2 = this.get(key);
        if (zinc.length > 1) {
          zinc += ",";
        }
        zinc += valueIsKind(value2, Kind.Marker) ? key : `${key}:${value2?.toAxon() ?? AXON_NULL}`;
      }
      zinc += "}";
      return zinc;
    }
    /**
     * Value equality check.
     *
     * @param value The value to test.
     * @returns True if the value is the same.
     */
    equals(value2) {
      if (!valueIsKind(value2, Kind.Dict)) {
        return false;
      }
      const keys0 = this.$store.getKeys().sort();
      const keys1 = value2.$store.getKeys().sort();
      if (keys0.length !== keys1.length) {
        return false;
      }
      for (let i = 0; i < keys0.length; ++i) {
        if (keys0[i] !== keys1[i]) {
          return false;
        }
        const val0 = this.get(keys0[i]);
        const val1 = value2.get(keys1[i]);
        if (!valueEquals(val0, val1)) {
          return false;
        }
      }
      return true;
    }
    /**
     * Compares two values.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive.
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Dict)) {
        return -1;
      }
      const zinc0 = this.toZinc();
      const zinc1 = value2.toZinc();
      if (zinc0 < zinc1) {
        return -1;
      }
      if (zinc0 === zinc1) {
        return 0;
      }
      return 1;
    }
    /**
     * Iterate over a dict.
     *
     * This enables a 'for ... of' loop to be used directly on an iterator.
     *
     * @returns A new iterator for a dict.
     *
     * ```typescript
     * // Iterate a dict
     * for (let row of dict) {
     *   console.log(row.name)
     *   console.log(row.value)
     * }
     * ```
     */
    [Symbol.iterator]() {
      return new DictValueIterator(this);
    }
    /**
     * @returns The dict as an array like object.
     */
    asArrayLike() {
      return this;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      let str = "{";
      for (const key of this.keys) {
        const value2 = this.get(key);
        if (str.length > 1) {
          str += ", ";
        }
        str += valueIsKind(value2, Kind.Marker) ? key : `${key}: ${String(value2)}`;
      }
      str += "}";
      return str;
    }
    /**
     * Get the display string for the dict or the given tag. If 'name'
     * is undefined, then return display text for the entire dict. If 'name'
     * is non-null then format the tag value. If 'name' is not defined
     * by this dict then return 'def'.
     *
     * ```typescript
     * // Returns the record's dis tag string value...
     * myDict.toDis()
     *
     * // Returns the record's tag value string value for foo...
     * myDict.toDis({ name: 'foo' })
     *
     * // Returns a localized string based on `disKey`...
     * myDict.toDis({
     *   i18n: (pod: string, key: string): string | undefined => pods.get(pod)?.key(key)
     * })
     * ```
     *
     * @see {@link dictToDis}
     *
     * @param options.name Optional tag name.
     * @param options.def Optional default value.
     * @param options.i18n Optional function to get localized strings.
     * @param options.short Optional flag to automatically shorten the display name.
     * @returns The display string.
     */
    toDis({ name, def, i18n, short } = {}) {
      return name ? this.get(name)?.toString() ?? def ?? "" : dictToDis(this, def, i18n, short);
    }
    /**
     * Dump the value to the local console output.
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      if (message) {
        console.log(String(message));
      }
      const obj = {};
      for (const val of this) {
        obj[val.name] = String(val.value);
      }
      console.table(obj);
      return this;
    }
    /**
     * @returns Returns a copy of the dict.
     */
    newCopy() {
      const obj = {};
      for (const key of this.keys) {
        const val = this.get(key);
        obj[key] = val?.newCopy() ?? null;
      }
      return _HDict.make(obj);
    }
    /**
     * Merge multiple dicts into one.
     *
     * ```typescript
     * // The merged dict has all the tags from dict0, dict1 and dict2.
     * const mergedDict = HDict.merge(dict0, dict1, dict2)
     * ```
     *
     * @param dicts The dicts to merge.
     * @returns A merged dict.
     */
    static merge(...dicts) {
      return dicts.reduce((acc, cur) => {
        for (const key of cur.keys) {
          const val = cur.get(key);
          if (val !== void 0) {
            acc.set(key, val);
          }
        }
        return acc;
      }, _HDict.make({})) ?? _HDict.make({});
    }
    /**
     * Create a diff (difference) dict that can be used in an update.
     *
     * This will return a new dict with any changed values and
     * removed tags having an `HRemove` value.
     *
     * @param dict The newly updated dict that will be checked for differences.
     * These differences will be incorporated into the returned dict.
     * @returns A diff dict.
     */
    diff(dict) {
      const diff = new _HDict();
      for (const name of _HDict.merge(this, dict).keys) {
        const dictVal = dict.get(name);
        const val = this.get(name);
        if (!dictVal) {
          diff.set(name, HRemove.make());
        } else if (!val || !dictVal.equals(val)) {
          diff.set(name, dictVal);
        }
      }
      return diff;
    }
    /**
     * If this dict is for a def then return its
     * name otherwise return an empty string.
     *
     * @returns The def name or an empty string.
     */
    get defName() {
      const val = this.get("def");
      return val ? String(val) : "";
    }
    /**
     * Analyze this dict and return its implemented defs.
     *
     * If a namespace isn't specified then the default environment namespace
     * will be used.
     *
     * @param namespace An optional namespace to perform the reflect from.
     * @returns An array of dicts.
     */
    reflect(namespace) {
      const ns = namespace ?? HNamespace.defaultNamespace;
      return ns.reflect(this);
    }
    /**
     * Return a reflected array of children prototypes.
     *
     * If a namespace isn't specified then the default environment namespace
     * will be used.
     *
     * @param namespace An optional namespace to perform the protos call from.
     * @returns An array of dicts.
     */
    protos(namespace) {
      const ns = namespace ?? HNamespace.defaultNamespace;
      return ns.protos(this);
    }
    /**
     * Returns true if this dict is newer than the specified dict.
     * The `mod` timestamp is used to perform the check.
     *
     * @param dict The other dict to compare to this dict.
     * @return True if this dict is newer.
     */
    isNewer(dict) {
      const a = this.get("mod") ?? HDateTime.make(/* @__PURE__ */ new Date(0));
      const b = dict.get("mod") ?? HDateTime.make(/* @__PURE__ */ new Date(0));
      return a.compareTo(b) > 0;
    }
  };
  var NOT_SUPPORTED_IN_FILTER_MSG = "Not supported in haystack filter";
  var CANNOT_CHANGE_READONLY_VALUE = "Cannot change readonly value";
  function isHVal(val) {
    return !!(val && typeof val.isKind === "function");
  }
  function valueIsKind(value2, kind) {
    return isHVal(value2) && value2.getKind() === kind;
  }
  function valueInspect(value2, message) {
    if (message) {
      console.log(String(message));
    }
    console.log(String(value2));
    return value2;
  }
  function valueEquals(val0, val1) {
    if (!val0 || !val1) {
      return val0 === val1;
    } else {
      return val0.equals(val1);
    }
  }
  function valueMatches(value2, filter, cx) {
    return new HFilter(filter).eval({
      dict: HDict.make({
        item: value2,
        it: value2
      }),
      namespace: cx?.namespace,
      resolve: cx?.resolve
    });
  }
  var ZINC_NULL = "N";
  var AXON_NULL = "null";
  var TEXT_ENCODER = new TextEncoder();
  var TEXT_DECODER = new TextDecoder();
  var trueInstance;
  var falseInstance;
  var _value10;
  var _HBool = class _HBool {
    /**
     * Constructs a new haystack boolean.
     *
     * @param value The value.
     */
    constructor(value2) {
      /**
       * The boolean value.
       */
      __privateAdd(this, _value10);
      __privateSet(this, _value10, !!value2);
    }
    /**
     * Factory method for a haystack boolean.
     *
     * @param value The value.
     * @returns A haystack boolean value.
     */
    static make(value2) {
      if (typeof value2 === "boolean") {
        if (value2) {
          return trueInstance ?? Object.freeze(trueInstance = new _HBool(true));
        } else {
          return falseInstance ?? Object.freeze(falseInstance = new _HBool(false));
        }
      } else {
        return value2;
      }
    }
    /**
     * @returns The boolean value.
     */
    get value() {
      return __privateGet(this, _value10);
    }
    set value(value2) {
      throw new Error(CANNOT_CHANGE_READONLY_VALUE);
    }
    /**
     * @returns The value's kind.
     */
    getKind() {
      return Kind.Bool;
    }
    /**
     * Compares the value's kind.
     *
     * @param kind The kind to compare against.
     * @returns True if the kind matches.
     */
    isKind(kind) {
      return valueIsKind(this, kind);
    }
    /* Returns true if the haystack filter matches the value.
     *
     * @param filter The filter to test.
     * @param cx Optional haystack filter evaluation context.
     * @returns True if the filter matches ok.
     */
    matches(filter, cx) {
      return valueMatches(this, filter, cx);
    }
    /**
     *
     * @param message An optional message to display before the value.
     * @returns The value instance.
     */
    inspect(message) {
      return valueInspect(this, message);
    }
    /*
     * @returns The object's value as a boolean string.
     */
    valueOf() {
      return __privateGet(this, _value10);
    }
    /**
     * Value equality check.
     *
     * @param value The value to compare.
     * @returns True if the value is the same.
     */
    equals(value2) {
      return valueIsKind(value2, Kind.Bool) && this.valueOf() === value2.valueOf();
    }
    /**
     * Compares two booleans.
     *
     * @param value The value to compare against.
     * @returns The sort order as negative, 0, or positive
     */
    compareTo(value2) {
      if (!valueIsKind(value2, Kind.Bool)) {
        return -1;
      }
      if (this.valueOf() < value2.valueOf()) {
        return -1;
      }
      if (this.valueOf() === value2.valueOf()) {
        return 0;
      }
      return 1;
    }
    /**
     * @returns A string representation of the value.
     */
    toString() {
      return String(this.value);
    }
    /**
     * Encodes to an encoded zinc value that can be used
     * in a haystack filter string.
     *
     * The encoding for a haystack filter is mostly zinc but contains
     * some exceptions.
     *
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.valueOf() ? "true" : "false";
    }
    /**
     * Encode to zinc encoding.
     *
     * @returns The encoded zinc string.
     */
    toZinc() {
      return this.valueOf() ? "T" : "F";
    }
    /**
     * @returns A JSON reprentation of the object.
     */
    toJSON() {
      return this.valueOf();
    }
    /**
     * @returns A string containing the JSON representation of the object.
     */
    toJSONString() {
      return JSON.stringify(this);
    }
    /**
     * @returns A byte buffer that has an encoded JSON string representation of the object.
     */
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    /**
     * @returns A JSON v3 representation of the object.
     */
    toJSONv3() {
      return this.toJSON();
    }
    /**
     * @returns An Axon encoded string of the value.
     */
    toAxon() {
      return String(this.valueOf());
    }
    /**
     * @returns Returns the value instance.
     */
    newCopy() {
      return this;
    }
    /**
     * @returns The value as a grid.
     */
    toGrid() {
      return HGrid.make(this);
    }
    /**
     * @returns The value as a list.
     */
    toList() {
      return HList.make([this]);
    }
    /**
     * @returns The value as a dict.
     */
    toDict() {
      return HDict.make(this);
    }
  };
  _value10 = new WeakMap();
  var HBool = _HBool;
  var TokenValue = class _TokenValue {
    /**
     * Contructs a new token value.
     *
     * @param type The token type.
     * @param text The token's text.
     * @param value The tokens value.
     */
    constructor(type, value2) {
      /**
       * The token type.
       */
      __publicField(this, "type");
      /**
       * The haystack value.
       */
      __publicField(this, "value");
      /**
       * Flag used to identify a token value.
       */
      __publicField(this, "_isATokenValue", true);
      this.type = type;
      this.value = value2;
    }
    /**
     * Return a boolean token value.
     *
     * @param value The boolean value.
     * @returns The token value.
     */
    static makeBool(value2) {
      return new _TokenValue(TokenType.boolean, HBool.make(value2));
    }
    /**
     * Returns true if the type matches this token's type.
     *
     * @param type The token type.
     * @return True if the type matches.
     */
    is(type) {
      return this.type === type;
    }
    /**
     * Returns true if the object matches this one.
     *
     * @param type The token type.
     * @param text The text.
     * @return True if the objects are equal.
     */
    equals(token) {
      if (!isTokenValue(token)) {
        return false;
      }
      return this.type === token.type && this.value.equals(token.value);
    }
    /**
     * @returns A string representation of the token.
     */
    toString() {
      return this.value.toString();
    }
    /**
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.value.toFilter();
    }
    /**
     * @returns A JSON representation of the token.
     */
    toJSON() {
      return {
        type: TokenType[this.type],
        val: this.value.toJSON()
      };
    }
  };
  function isTokenValue(value2) {
    return !!(value2 && value2._isATokenValue);
  }
  var { eof: eof$1, or: or$1, and: and$1, not: not$1 } = tokens;
  var FilterParser = class {
    /**
     * Construct a new parser with a function that supplies tokens.
     *
     * @param nextToken A function that supplies tokens for the parser to use.
     */
    constructor(nextToken) {
      __publicField(this, "nextToken");
      __publicField(this, "current", eof$1);
      __publicField(this, "next", eof$1);
      this.nextToken = nextToken;
      this.current = this.nextToken();
      this.next = this.nextToken();
    }
    /**
     * Consumes the next token.
     */
    consume() {
      this.current = this.next;
      this.next = this.nextToken();
    }
    /**
     * Match at least one of the token types (OR).
     *
     * If a match is found then advance otherwise throw an error.
     *
     * @param types The types to match against.
     * @throws An error if a match can't be found.
     */
    match(...types) {
      if (types.filter((type) => this.current.is(type)).length) {
        this.consume();
      } else {
        const typesStr = types.map((type) => TokenType[type]).join(", ");
        throw new LocalizedError({
          message: `Invalid expression. Could not find ${typesStr}`,
          lex: "parserInvalidExpression",
          args: { typesStr }
        });
      }
    }
    /**
     * Match the token type and text.
     *
     * If a match is found then advance otherwise throw an error.
     *
     * @param type The token type.
     * @param text The token text.
     * @throws An error if a match can't be found.
     */
    equalsToken(token) {
      if (this.current.equals(token)) {
        this.consume();
      } else {
        throw new LocalizedError({
          message: `Invalid expression. Could not find ${TokenType[token.type]}`,
          lex: "parserInvalidExpression",
          args: { arg: TokenType[token.type] }
        });
      }
    }
    /**
     * Parse each token an return the resultant AST node.
     *
     * @returns The abstract syntax tree for the filter.
     * @throws If there's an error parsing the filter.
     */
    parse() {
      const node = this.condOr();
      if (!this.current.is(TokenType.eof)) {
        throw new LocalizedError({
          message: `Unexpected token: ${this.current.toFilter()}`,
          lex: "parserUnexpectedToken",
          args: { arg: this.current.toFilter() }
        });
      }
      return node;
    }
    //////////////////////////////////////////////////////////////////////////
    // AST parsing methods
    //////////////////////////////////////////////////////////////////////////
    condOr() {
      const condAnds = [this.condAnd()];
      while (this.current.equals(or$1)) {
        this.equalsToken(or$1);
        condAnds.push(this.condAnd());
      }
      return new CondOrNode(condAnds);
    }
    condAnd() {
      const terms = [this.term()];
      while (this.current.equals(and$1)) {
        this.equalsToken(and$1);
        terms.push(this.term());
      }
      return new CondAndNode(terms);
    }
    term() {
      let term;
      if (this.current.is(TokenType.leftBrace)) {
        term = this.parens();
      } else if (this.current.equals(not$1) && (this.next.is(TokenType.text) || this.next.is(TokenType.paths))) {
        term = this.missing();
      } else if ((this.current.is(TokenType.text) || this.current.is(TokenType.paths)) && (this.next.is(TokenType.equals) || this.next.is(TokenType.notEquals) || this.next.is(TokenType.lessThan) || this.next.is(TokenType.lessThanOrEqual) || this.next.is(TokenType.greaterThan) || this.next.is(TokenType.greaterThanOrEqual))) {
        term = this.cmp();
      } else if (this.current.is(TokenType.text) && this.next.is(TokenType.wildcardEq)) {
        term = this.wildcard();
      } else if (this.current.is(TokenType.text) || this.current.is(TokenType.paths)) {
        term = this.has();
      } else if (this.current.is(TokenType.symbol)) {
        term = this.isa();
      } else if (this.current.is(TokenType.rel)) {
        term = this.rel();
      } else {
        throw new LocalizedError({
          message: "Invalid expression. Could not find valid term",
          lex: "parserInvalidExpressionTerm"
        });
      }
      return term;
    }
    parens() {
      this.match(TokenType.leftBrace);
      const parens = new ParensNode(this.condOr());
      this.match(TokenType.rightBrace);
      return parens;
    }
    missing() {
      this.equalsToken(not$1);
      const missing = new MissingNode(this.current);
      this.match(TokenType.text, TokenType.paths);
      return missing;
    }
    cmp() {
      const path2 = this.current;
      this.match(TokenType.text, TokenType.paths);
      const cmpOp = this.current;
      this.match(TokenType.equals, TokenType.notEquals, TokenType.lessThan, TokenType.lessThanOrEqual, TokenType.greaterThan, TokenType.greaterThanOrEqual);
      let val = this.current;
      this.match(TokenType.string, TokenType.number, TokenType.text, TokenType.boolean, TokenType.date, TokenType.time, TokenType.uri, TokenType.ref, TokenType.symbol);
      if (val.type === TokenType.text && isTokenObj(val)) {
        if (val.text === "true" || val.text === "false") {
          val = TokenValue.makeBool(val.text === "true");
        } else {
          throw new LocalizedError({
            message: `Expected boolean but found ${val.text}`,
            lex: "parserExpectedBoolean",
            args: { arg: val.text }
          });
        }
      }
      return new CmpNode(path2, cmpOp, val);
    }
    has() {
      const has2 = new HasNode(this.current);
      this.match(TokenType.text, TokenType.paths);
      return has2;
    }
    isa() {
      const isa = new IsANode(this.current);
      this.match(TokenType.symbol);
      return isa;
    }
    rel() {
      const rel = this.current;
      this.match(TokenType.rel);
      let term;
      let ref2;
      if (isTokenValue(this.current) && valueIsKind(this.current.value, Kind.Symbol)) {
        term = this.current;
        this.match(TokenType.symbol);
      }
      if (isTokenValue(this.current) && valueIsKind(this.current.value, Kind.Ref)) {
        ref2 = this.current;
        this.match(TokenType.ref);
      }
      return new RelationshipNode(rel, term, ref2);
    }
    wildcard() {
      const id = this.current;
      this.match(TokenType.text);
      this.match(TokenType.wildcardEq);
      const ref2 = this.current;
      this.match(TokenType.ref);
      return new WildcardEqualsNode(id, ref2);
    }
  };
  var TokenPaths = class {
    /**
     * Contructs a new token value.
     *
     * @param paths The paths.
     * @param value The tokens value.
     */
    constructor(paths) {
      /**
       * The token type.
       */
      __publicField(this, "type", TokenType.paths);
      /**
       * The token text value.
       */
      __publicField(this, "paths");
      /**
       * Flag used to identify a token paths object.
       */
      __publicField(this, "_isATokenPaths", true);
      this.paths = paths;
    }
    /**
     * Returns true if the type matches this token's type.
     *
     * @param type The token type.
     * @return True if the type matches.
     */
    is(type) {
      return this.type === type;
    }
    /**
     * Returns true if the object matches this one.
     *
     * @param type The token type.
     * @param text The text.
     * @return True if the objects are equal.
     */
    equals(token) {
      if (!isTokenPaths(token)) {
        return false;
      }
      if (this.type !== token.type) {
        return false;
      }
      if (this.paths.length !== token.paths.length) {
        return false;
      }
      for (let i = 0; i < this.paths.length; ++i) {
        if (this.paths[i] !== token.paths[i]) {
          return false;
        }
      }
      return true;
    }
    /**
     * @returns A string representation of the token.
     */
    toString() {
      return this.toFilter();
    }
    /**
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return this.paths.join("->");
    }
    /**
     * @returns A JSON representation of the token.
     */
    toJSON() {
      return {
        type: TokenType[this.type],
        paths: this.paths
      };
    }
  };
  function isTokenPaths(value2) {
    return !!(value2 && value2._isATokenPaths);
  }
  var TokenRelationship = class {
    /**
     * Contructs a new token value.
     *
     * @param relationship The relationship.
     * @param term The relationship term.
     */
    constructor(relationship) {
      /**
       * The token type.
       */
      __publicField(this, "type", TokenType.rel);
      /**
       * The relationship.
       */
      __publicField(this, "relationship");
      /**
       * Flag used to identify a token relationship object.
       */
      __publicField(this, "_isATokenRelationship", true);
      this.relationship = relationship;
    }
    /**
     * Returns true if the type matches this token's type.
     *
     * @param type The token type.
     * @return True if the type matches.
     */
    is(type) {
      return this.type === type;
    }
    /**
     * Returns true if the object matches this one.
     *
     * @param type The token type.
     * @param text The text.
     * @return True if the objects are equal.
     */
    equals(token) {
      if (!_isATokenRelationship(token)) {
        return false;
      }
      if (this.type !== token.type) {
        return false;
      }
      if (this.relationship !== token.relationship) {
        return false;
      }
      return true;
    }
    /**
     * @returns A string representation of the token.
     */
    toString() {
      return this.toFilter();
    }
    /**
     * @returns The encoded value that can be used in a haystack filter.
     */
    toFilter() {
      return `${this.relationship}?`;
    }
    /**
     * @returns A JSON representation of the token.
     */
    toJSON() {
      return {
        type: TokenType[this.type],
        relationship: this.relationship
      };
    }
  };
  function _isATokenRelationship(value2) {
    return !!(value2 && value2._isATokenRelationship);
  }
  var { eof, equals, notEquals, lessThan, lessThanOrEqual, greaterThan, greaterThanOrEqual, leftBrace, rightBrace, and, or, not, wildcardEq } = tokens;
  var constTextTokens = /* @__PURE__ */ new Map();
  constTextTokens.set("and", and);
  constTextTokens.set("or", or);
  constTextTokens.set("not", not);
  var FilterLexer = class {
    /**
     * Constructors a new lexer.
     *
     * @param scanner The scanner used for the input.
     * @param zinc Optional zinc lexer.
     */
    constructor(scanner) {
      /**
       * The input string to read from.
       *
       * All state for the lexer is delegated to this object. It's shared between the filter
       * and Zinc lexers accordingly.
       *
       * No state regarding parsing should be directly held in the filter lexer.
       */
      __publicField(this, "scanner");
      /**
       * The underlying zinc reader.
       *
       * Haystack filters use 'some' standard encoded zinc parsing. Therefore we delegate
       * some parsing to a Zinc reader where appropriate.
       */
      __publicField(this, "zinc");
      this.scanner = scanner;
      this.zinc = new ZincReader(scanner);
    }
    /**
     * Return a function that when invoked returns the next token.
     *
     * This is designed to be feed into a parser.
     *
     * @returns A function that when invoked, returns the next token.
     */
    toNextTokenFunc() {
      return () => this.nextToken();
    }
    /**
     * Process the next token to return.
     *
     * @returns The next token.
     */
    nextToken() {
      while (!this.scanner.isEof()) {
        switch (this.scanner.current) {
          case " ":
          case "	":
          case "\n":
          case "\r":
            this.scanner.consumeWhiteSpace();
            continue;
          case '"':
            return this.string();
          case "`":
            return this.uri();
          case "@":
            return this.ref();
          case "^":
            return this.symbol();
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
          case "-":
            return this.numberDateTime();
          case "a":
          case "b":
          case "c":
          case "d":
          case "e":
          case "f":
          case "g":
          case "h":
          case "i":
          case "j":
          case "k":
          case "l":
          case "m":
          case "n":
          case "o":
          case "p":
          case "q":
          case "r":
          case "s":
          case "t":
          case "u":
          case "v":
          case "w":
          case "x":
          case "y":
          case "z":
            return this.textOrRelationship();
          case "(":
            return this.leftBrace();
          case ")":
            return this.rightBrace();
          case "=":
            return this.equality();
          case "!":
            return this.notEquals();
          case "<":
            return this.lessThan();
          case ">":
            return this.greaterThan();
          case "*":
            return this.wildcardEq();
          default:
            throw new LocalizedError({
              message: "Invalid character",
              lex: "lexerInvalidChar",
              index: this.scanner.index
            });
        }
      }
      return eof;
    }
    /**
     * Consume the data stream and return a string token.
     *
     * @returns A string token.
     * @throws If the end of the string can't be found.
     */
    string() {
      return new TokenValue(TokenType.string, this.zinc.string());
    }
    /**
     * Consume the data stream and return an uri token.
     *
     * @returns A uri token.
     * @throws If the end of the uri can't be found if an invalid character is found.
     */
    uri() {
      return new TokenValue(TokenType.uri, this.zinc.uri());
    }
    /**
     * Consume the data stream and return n ref token.
     *
     * @returns A ref token.
     * @throws If there's an error parsing the ref.
     */
    ref() {
      return new TokenValue(TokenType.ref, this.zinc.ref());
    }
    /**
     * Consume the data stream and return a symbol token.
     *
     * @returns A symbol token.
     * @throws If there's an error parsing the symbol.
     */
    symbol() {
      return new TokenValue(TokenType.symbol, this.zinc.symbol());
    }
    /**
     * Consume the data stream and return a number, date or time token.
     *
     * @returns A number, date or time token.
     * @throws If we don't have a valid number.
     */
    numberDateTime() {
      const value2 = this.zinc.numberDateTime();
      if (value2.isKind(Kind.Number)) {
        return new TokenValue(TokenType.number, value2);
      } else if (value2.isKind(Kind.Date)) {
        return new TokenValue(TokenType.date, value2);
      } else if (value2.isKind(Kind.Time)) {
        return new TokenValue(TokenType.time, value2);
      } else {
        throw new LocalizedError({
          message: `Unsupported kind ${value2.getKind()}`,
          lex: "lexerUnsupportedKind",
          args: { arg: value2.getKind() },
          index: this.scanner.index
        });
      }
    }
    /**
     * Consume the data stream and return a text or relationship token.
     *
     * @returns A text or relationship token.
     */
    textOrRelationship() {
      let str = String(this.scanner.current);
      let paths;
      let relationship = "";
      while (!this.scanner.isEof()) {
        this.scanner.consume();
        if (this.scanner.isLetter() || this.scanner.isDigit() || this.scanner.is("_")) {
          str += this.scanner.current;
        } else if (this.scanner.is("?")) {
          relationship = str;
        } else if (this.scanner.current === "-" && this.scanner.next === ">") {
          this.scanner.consume();
          if (str && (Scanner.isLetter(this.scanner.next) || Scanner.isDigit(this.scanner.next) || String(this.scanner.next) === "_")) {
            paths = paths || [];
            paths.push(str);
            str = "";
          } else {
            throw new LocalizedError({
              message: `Invalid dereference path. There must be a path following ->`,
              lex: "lexerInvalidDeref",
              args: { arg: str },
              index: this.scanner.index
            });
          }
        } else {
          break;
        }
      }
      let token;
      if (relationship) {
        token = new TokenRelationship(relationship);
      } else {
        if (paths) {
          if (str) {
            paths.push(str);
          }
          token = new TokenPaths(paths);
        } else {
          token = constTextTokens.get(str) || new TokenObj(TokenType.text, str);
        }
      }
      return token;
    }
    /**
     * Consume the data stream to the left brace token.
     *
     * @returns A left brace token.
     */
    leftBrace() {
      this.scanner.consume();
      return leftBrace;
    }
    /**
     * Consume the data stream to the equals token.
     *
     * @returns A equals token.
     */
    rightBrace() {
      this.scanner.consume();
      return rightBrace;
    }
    /**
     * Consume the data stream to the equals token.
     *
     * @returns A equals token.
     */
    equality() {
      this.scanner.consume();
      if (this.scanner.is("=")) {
        this.scanner.consume();
        return equals;
      } else {
        throw new LocalizedError({
          message: "Expected equals operator (==)",
          lex: "lexerExpectedEquals",
          index: this.scanner.index
        });
      }
    }
    /**
     * Consume the data stream and return a not equals token.
     *
     * @returns A not equals token.
     * @throws An error if we don't have a not equals operator.
     */
    notEquals() {
      this.scanner.consume();
      if (this.scanner.is("=")) {
        this.scanner.consume();
        return notEquals;
      } else {
        throw new LocalizedError({
          message: "Expected not equals operator (!=)",
          lex: "lexerExpectedNotEquals",
          index: this.scanner.index
        });
      }
    }
    /**
     * Consume the data stream and return either a less than or less than or equal
     * to operator.
     *
     * @returns A less than or less than or equals to token.
     * @throws An error if we don't have a valid less than or less than or equals to operator.
     */
    lessThan() {
      this.scanner.consume();
      if (this.scanner.is("=")) {
        this.scanner.consume();
        return lessThanOrEqual;
      } else {
        return lessThan;
      }
    }
    /**
     * Consume the data stream and return either a greater than or greater than or equal
     * to operator.
     *
     * @returns A greater than or greater than or equals to token.
     * @throws An error if we don't have a valid greater than or greater than or equals to operator.
     */
    greaterThan() {
      this.scanner.consume();
      if (this.scanner.is("=")) {
        this.scanner.consume();
        return greaterThanOrEqual;
      } else {
        return greaterThan;
      }
    }
    /**
     * Consume a wildcard equality operator and return the token.
     *
     * @returns A wildcard equality token.
     * @throws An error if the wildcard equality operator isn't found.
     */
    wildcardEq() {
      if (this.scanner.consume().is("=") && this.scanner.consume().is("=")) {
        this.scanner.consume();
        return wildcardEq;
      } else {
        throw new LocalizedError({
          message: "Expected wildcard equality operator (*==)",
          lex: "lexerExpectedWildcardEquality",
          index: this.scanner.index
        });
      }
    }
  };
  var GenerateHaystackFilterVisitor = class {
    constructor() {
      __publicField(this, "$filter", "");
    }
    get filter() {
      return this.$filter;
    }
    visitCondOr(node) {
      const condAnds = node.condAnds;
      for (let i = 0; i < condAnds.length; ++i) {
        if (i > 0) {
          this.append("or");
        }
        condAnds[i].accept(this);
      }
    }
    visitCondAnd(node) {
      const terms = node.terms;
      for (let i = 0; i < terms.length; ++i) {
        if (i > 0) {
          this.append("and");
        }
        terms[i].accept(this);
      }
    }
    visitParens(node) {
      this.append("(");
      node.acceptChildNodes(this);
      this.$filter += ")";
    }
    visitHas(node) {
      this.append(node.path.toFilter());
    }
    visitMissing(node) {
      this.append("not");
      this.append(node.path.toFilter());
    }
    visitCmp(node) {
      this.append(node.path.toFilter());
      this.append(node.cmpOp.text);
      this.append(node.val.toFilter());
    }
    visitIsA(node) {
      this.append(node.val.toFilter());
    }
    visitRelationship(node) {
      this.append(node.rel.toFilter());
      if (node.term) {
        this.append(node.term.toFilter());
      }
      if (node.ref) {
        this.append(node.ref.toFilter());
      }
    }
    visitWildcardEquals(node) {
      this.append(node.id.toFilter());
      this.append("*==");
      this.append(node.ref.toFilter());
    }
    append(str) {
      if (this.$filter && this.lastChar !== "(") {
        this.$filter += " ";
      }
      this.$filter += str;
    }
    get lastChar() {
      return this.$filter[this.$filter.length - 1];
    }
  };
  var HFilter = class _HFilter {
    /**
     * Constructs a new haystack filter from the string.
     *
     * This will parse the filter string to a node.
     *
     * @param filter The haystack filter or an already parsed AST node.
     * @throws An error if the filter is invalid.
     */
    constructor(filter) {
      /**
       * The internal parsed node of the current haystack filter.
       */
      __publicField(this, "node");
      /**
       * Used for a type guard check.
       */
      __publicField(this, "_isHFilter", true);
      this.node = isNode(filter) ? filter : _HFilter.parse(filter);
    }
    /**
     * Return true if the value is a haystack filter object.
     *
     * @param value The value to test.
     * @returns True if the value is a haystack filter.
     */
    static isHFilter(value2) {
      return !!value2?._isHFilter;
    }
    /**
     * Parse a Haystack Filter and returns it's base AST node.
     *
     * @param filter The Haystack Filter to parse.
     * @returns The base AST node for the haystack filter.
     * @throws An error if the haystack filter isn't valid.
     */
    static parse(filter) {
      return new FilterParser(new FilterLexer(new Scanner(filter)).toNextTokenFunc()).parse();
    }
    /**
     * Evalulate a node against an object. The object contains properties used
     * in the evaluation.
     *
     * @param node The AST node to evaluate.
     * @param context The evaluation context.
     * @returns The result of the evaluation.
     */
    static eval(node, context) {
      return node.eval(context);
    }
    /**
     * Evalulate a node against an object. The object contains properties used
     * in the evaluation.
     *
     * @param context The evaluation context.
     * @returns The result of the evaluation.
     */
    eval(context) {
      return _HFilter.eval(this.node, context);
    }
    /**
     * Generate a Haystack Filter string from a node.
     *
     * @param node The AST node to generate the Haystack Filter string from.
     * @returns The haystack filter.
     * @throws An error is thrown if the haystack filter is invalid.
     */
    static toFilter(node) {
      const visitor = new GenerateHaystackFilterVisitor();
      node.accept(visitor);
      const filter = visitor.filter;
      _HFilter.parse(filter);
      return filter;
    }
    /**
     * Generate a Haystack Filter string from a node.
     *
     * @returns The haystack filter.
     * @throws An error is thrown if the haystack filter is invalid.
     */
    toFilter() {
      return _HFilter.toFilter(this.node);
    }
  };
  var HAYSON_MIME_TYPE = "application/vnd.haystack+json";
  var ItemType;
  (function(ItemType2) {
    ItemType2[ItemType2["Dict"] = 0] = "Dict";
    ItemType2[ItemType2["NewLine"] = 1] = "NewLine";
    ItemType2[ItemType2["Comment"] = 2] = "Comment";
  })(ItemType || (ItemType = {}));
  Object.defineProperties(Array.prototype, {
    /**
     * @returns The array as a grid.
     */
    toGrid: {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return HGrid.make(this);
      }
    },
    /**
     * @returns The array as a list.
     */
    toList: {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return HList.make(this);
      }
    },
    /**
     * @returns The array as a dict.
     */
    toDict: {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return HList.make(this).toDict();
      }
    },
    /**
     * @returns The array as Hayson.
     */
    toHayson: {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return HList.make(this).toJSON();
      }
    }
  });
  var SpanMode;
  (function(SpanMode2) {
    SpanMode2["today"] = "today";
    SpanMode2["yesterday"] = "yesterday";
    SpanMode2["thisWeek"] = "thisWeek";
    SpanMode2["lastWeek"] = "lastWeek";
    SpanMode2["thisMonth"] = "thisMonth";
    SpanMode2["lastMonth"] = "lastMonth";
    SpanMode2["thisQuarter"] = "thisQuarter";
    SpanMode2["lastQuarter"] = "lastQuarter";
    SpanMode2["thisYear"] = "thisYear";
    SpanMode2["lastYear"] = "lastYear";
  })(SpanMode || (SpanMode = {}));
  var _a8, _values4, _store;
  _a8 = DICT_STORE_SYMBOL;
  var DictJsonStringStore = class {
    constructor(values) {
      /**
       * The original Hayson dict encoded as a string.
       */
      __privateAdd(this, _values4);
      /**
       * The inner JSON store that's lazily created.
       */
      __privateAdd(this, _store);
      __publicField(this, _a8, DICT_STORE_SYMBOL);
      __privateSet(this, _values4, values);
    }
    get(name) {
      return this.getStore().get(name);
    }
    has(name) {
      return this.getStore().has(name);
    }
    set(name, value2) {
      this.getStore().set(name, value2);
    }
    remove(name) {
      this.getStore().remove(name);
    }
    clear() {
      this.getStore().clear();
    }
    getKeys() {
      return this.getStore().getKeys();
    }
    toObj() {
      return this.getStore().toObj();
    }
    toJSON() {
      return this.getStore().toJSON();
    }
    toJSONString() {
      return __privateGet(this, _store) ? __privateGet(this, _store).toJSONString() : __privateGet(this, _values4);
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    getStore() {
      if (!__privateGet(this, _store)) {
        __privateSet(this, _store, new DictJsonStore(JSON.parse(__privateGet(this, _values4))));
        __privateSet(this, _values4, "");
      }
      return __privateGet(this, _store);
    }
  };
  _values4 = new WeakMap();
  _store = new WeakMap();
  var _a9, _values5, _store2;
  _a9 = DICT_STORE_SYMBOL;
  var DictJsonUint8ArrayStore = class {
    constructor(values) {
      /**
       * The original Hayson dict encoded as a string in a byte buffer.
       */
      __privateAdd(this, _values5);
      /**
       * The inner JSON store that's lazily created.
       */
      __privateAdd(this, _store2);
      __publicField(this, _a9, DICT_STORE_SYMBOL);
      __privateSet(this, _values5, values);
    }
    get(name) {
      return this.getStore().get(name);
    }
    has(name) {
      return this.getStore().has(name);
    }
    set(name, value2) {
      this.getStore().set(name, value2);
    }
    remove(name) {
      this.getStore().remove(name);
    }
    clear() {
      this.getStore().clear();
    }
    getKeys() {
      return this.getStore().getKeys();
    }
    toObj() {
      return this.getStore().toObj();
    }
    toJSON() {
      return this.getStore().toJSON();
    }
    toJSONString() {
      return this.getStore().toJSONString();
    }
    toJSONUint8Array() {
      return __privateGet(this, _store2) ? __privateGet(this, _store2).toJSONUint8Array() : __privateGet(this, _values5) ?? new Uint8Array();
    }
    getStore() {
      if (!__privateGet(this, _store2)) {
        __privateSet(this, _store2, new DictJsonStringStore(TEXT_DECODER.decode(__privateGet(this, _values5))));
        __privateSet(this, _values5, void 0);
      }
      return __privateGet(this, _store2);
    }
  };
  _values5 = new WeakMap();
  _store2 = new WeakMap();
  var _a10, _grid2, _store3;
  _a10 = GRID_STORE_SYMBOL;
  var GridJsonStringStore = class {
    constructor(grid) {
      __privateAdd(this, _grid2);
      __privateAdd(this, _store3);
      __publicField(this, _a10, GRID_STORE_SYMBOL);
      __privateSet(this, _grid2, grid);
    }
    get version() {
      return this.getStore().version;
    }
    set version(version) {
      this.getStore().version = version;
    }
    get meta() {
      return this.getStore().meta;
    }
    set meta(meta) {
      this.getStore().meta = meta;
    }
    get columns() {
      return this.getStore().columns;
    }
    set columns(columns) {
      this.getStore().columns = columns;
    }
    get rows() {
      return this.getStore().rows;
    }
    set rows(rows) {
      this.getStore().rows = rows;
    }
    toJSON() {
      return this.getStore().toJSON();
    }
    toJSONString() {
      return __privateGet(this, _store3) ? __privateGet(this, _store3).toJSONString() : __privateGet(this, _grid2);
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    getStore() {
      if (!__privateGet(this, _store3)) {
        __privateSet(this, _store3, new GridJsonStore(JSON.parse(__privateGet(this, _grid2))));
        __privateSet(this, _grid2, "");
      }
      return __privateGet(this, _store3);
    }
  };
  _grid2 = new WeakMap();
  _store3 = new WeakMap();
  var _a11, _grid3, _store4;
  _a11 = GRID_STORE_SYMBOL;
  var GridJsonUint8ArrayStore = class {
    constructor(grid) {
      __privateAdd(this, _grid3);
      __privateAdd(this, _store4);
      __publicField(this, _a11, GRID_STORE_SYMBOL);
      __privateSet(this, _grid3, grid);
    }
    get version() {
      return this.getStore().version;
    }
    set version(version) {
      this.getStore().version = version;
    }
    get meta() {
      return this.getStore().meta;
    }
    set meta(meta) {
      this.getStore().meta = meta;
    }
    get columns() {
      return this.getStore().columns;
    }
    set columns(columns) {
      this.getStore().columns = columns;
    }
    get rows() {
      return this.getStore().rows;
    }
    set rows(rows) {
      this.getStore().rows = rows;
    }
    toJSON() {
      return this.getStore().toJSON();
    }
    toJSONString() {
      return this.getStore().toJSONString();
    }
    toJSONUint8Array() {
      return __privateGet(this, _store4) ? __privateGet(this, _store4).toJSONUint8Array() : __privateGet(this, _grid3) ?? new Uint8Array();
    }
    getStore() {
      if (!__privateGet(this, _store4)) {
        __privateSet(this, _store4, new GridJsonStringStore(TEXT_DECODER.decode(__privateGet(this, _grid3))));
        __privateSet(this, _grid3, void 0);
      }
      return __privateGet(this, _store4);
    }
  };
  _grid3 = new WeakMap();
  _store4 = new WeakMap();
  var _a12, _list2, _store5;
  _a12 = LIST_STORE_SYMBOL;
  var ListJsonStringStore = class {
    constructor(list) {
      /**
       * The original Hayson list encoded as a string.
       */
      __privateAdd(this, _list2);
      /**
       * The inner JSON store that's lazily created.
       */
      __privateAdd(this, _store5);
      __publicField(this, _a12, LIST_STORE_SYMBOL);
      __privateSet(this, _list2, list);
    }
    get values() {
      return this.getStore().values;
    }
    set values(values) {
      this.getStore().values = values;
    }
    toJSON() {
      return this.getStore().toJSON();
    }
    toJSONString() {
      return __privateGet(this, _store5) ? __privateGet(this, _store5).toJSONString() : __privateGet(this, _list2);
    }
    toJSONUint8Array() {
      return TEXT_ENCODER.encode(this.toJSONString());
    }
    getStore() {
      if (!__privateGet(this, _store5)) {
        __privateSet(this, _store5, new ListJsonStore(JSON.parse(__privateGet(this, _list2))));
        __privateSet(this, _list2, "");
      }
      return __privateGet(this, _store5);
    }
  };
  _list2 = new WeakMap();
  _store5 = new WeakMap();
  var _a13, _list3, _store6;
  _a13 = LIST_STORE_SYMBOL;
  var ListJsonUint8ArrayStore = class {
    constructor(list) {
      /**
       * The original Hayson list encoded as a string in a byte buffer.
       */
      __privateAdd(this, _list3);
      /**
       * The inner JSON store that's lazily created.
       */
      __privateAdd(this, _store6);
      __publicField(this, _a13, LIST_STORE_SYMBOL);
      __privateSet(this, _list3, list);
    }
    get values() {
      return this.getStore().values;
    }
    set values(values) {
      this.getStore().values = values;
    }
    toJSON() {
      return this.getStore().toJSON();
    }
    toJSONString() {
      return this.getStore().toJSONString();
    }
    toJSONUint8Array() {
      return __privateGet(this, _store6) ? __privateGet(this, _store6).toJSONUint8Array() : __privateGet(this, _list3) ?? new Uint8Array();
    }
    getStore() {
      if (!__privateGet(this, _store6)) {
        __privateSet(this, _store6, new ListJsonStringStore(TEXT_DECODER.decode(__privateGet(this, _list3))));
        __privateSet(this, _list3, void 0);
      }
      return __privateGet(this, _store6);
    }
  };
  _list3 = new WeakMap();
  _store6 = new WeakMap();
  var TRUE = HBool.make(true);
  var FALSE = HBool.make(false);
  var MARKER = HMarker.make();
  var NA = HNa.make();
  var REMOVE = HRemove.make();

  // node_modules/haystack-nclient/dist/index.es.js
  var getServiceUrl = ({ origin, path: path2 }) => `${origin}/api/${path2}`;
  var getOpUrl = ({ origin, pathPrefix, project, op }) => `${origin}${pathPrefix}/api/${project}/${op}`;
  var getHaystackServiceUrl = ({ origin, pathPrefix, project, path: path2 }) => `${origin}${pathPrefix}/api/haystack${project ? `/${project}` : ""}/${path2}`;
  var getHostServiceUrl = ({ origin, pathPrefix, path: path2 }) => `${origin}${pathPrefix}/api/host/${path2}`;
  function encodeQuery(obj) {
    let query = "";
    for (const key of Object.keys(obj)) {
      const value2 = obj[key];
      if (value2 !== void 0) {
        if (!query) {
          query = "?";
        } else {
          query += `&`;
        }
        let encodedValue;
        if (valueIsKind(value2, Kind.Ref)) {
          encodedValue = value2.value;
        } else if (valueIsKind(value2, Kind.List)) {
          encodedValue = value2.values.map((val) => val.value).join("|");
        } else {
          encodedValue = Array.isArray(value2) ? value2.join("|") : String(value2);
        }
        query += `${key}=${encodeURIComponent(encodedValue)}`;
      }
    }
    return query;
  }
  var SKYARC_ATTEST_KEY = "skyarc-attest-key";
  var FIN_AUTH_KEY = "fin-stack-auth";
  var FIN_AUTH_PATH = "/finStackAuth";
  var ACCEPT_HEADER = "accept";
  var CONTENT_TYPE_HEADER = "content-type";
  var ZINC_MIME_TYPE = "text/zinc";
  function getOrigin(resource) {
    try {
      return new URL(resource).origin;
    } catch {
      return "";
    }
  }
  function isHeaders(headers) {
    return !!(headers && typeof headers.entries === "function" && typeof headers.keys === "function" && typeof headers.values === "function");
  }
  function hasHeader(headers, headerName) {
    if (!headers) {
      return false;
    }
    if (isHeaders(headers)) {
      return headers.has(headerName);
    }
    const header = headerName.toLowerCase();
    for (const name in headers) {
      if (name.toLowerCase() === header) {
        return true;
      }
    }
    return false;
  }
  function getHeader(headers, headerName) {
    if (!headers) {
      return void 0;
    }
    if (isHeaders(headers)) {
      return headers.get(headerName) ?? void 0;
    }
    const header = headerName.toLowerCase();
    for (const name in headers) {
      if (name.toLowerCase() === header) {
        return headers[name];
      }
    }
    return void 0;
  }
  function addHeader(options, headerName, headerValue) {
    if (isHeaders(options.headers)) {
      options.headers.set(headerName, headerValue);
    } else {
      const headers = options.headers ?? (options.headers = {});
      headers[headerName] = headerValue;
    }
  }
  function removeHeader(headers, headerName) {
    if (!headers) {
      return headers;
    }
    if (isHeaders(headers)) {
      headers.delete(headerName);
      return headers;
    }
    if (Array.isArray(headers)) {
      const index = headers.findIndex((item) => item[0] === headerName);
      if (index > -1) {
        headers.splice(index, 1);
        return headers;
      }
    } else {
      const header = headerName.toLowerCase();
      for (const name in headers) {
        if (name.toLowerCase() === header) {
          delete headers[name];
          return headers;
        }
      }
    }
    return headers;
  }
  function addStartSlashRemoveEndSlash(path2) {
    path2 = path2.trim();
    if (path2 && !path2.startsWith("/")) {
      path2 = `/${path2}`;
    }
    if (path2.endsWith("/")) {
      path2 = path2.substring(0, path2.length - 1);
    }
    return path2;
  }
  var INVALID_ATTEST_KEY_STATUS = 400;
  var originAttestKeyPromises = /* @__PURE__ */ new Map();
  var CsrfError = class extends Error {
    constructor(response, message) {
      super(message || response.statusText);
      /**
       * Used for a type guard check.
       */
      __publicField(this, "_isCsrfError", true);
      /**
       * HTTP response code.
       */
      __publicField(this, "status");
      this.status = response.status;
    }
  };
  async function requestFinAttestKey(origin, options, fetchFunc) {
    const opt = {
      ...options,
      method: "POST",
      credentials: "include"
    };
    const attestRequestUri = isCsrfRequestInit(options) ? options.attestRequestUri ?? FIN_AUTH_PATH : FIN_AUTH_PATH;
    const attestResponseHeaderName = isCsrfRequestInit(options) ? options.attestResponseHeaderName ?? FIN_AUTH_KEY : FIN_AUTH_KEY;
    const resp = await fetchFunc(`${origin}${attestRequestUri}`, opt);
    const auth = getHeader(resp.headers, attestResponseHeaderName);
    if (!auth) {
      throw new CsrfError(resp, "Cannot acquire attest key");
    }
    return auth;
  }
  async function getAttestKey(resource, options, fetchFunc) {
    const host = getOrigin(resource);
    let promise = originAttestKeyPromises.get(host);
    if (!promise) {
      promise = requestFinAttestKey(host, options, fetchFunc);
      originAttestKeyPromises.set(host, promise);
    }
    try {
      return await promise;
    } catch (err) {
      originAttestKeyPromises.delete(host);
      throw err;
    }
  }
  function clearAttestKey(resource) {
    originAttestKeyPromises.delete(getOrigin(resource));
  }
  async function finCsrfFetch(resource, options, fetchFunc) {
    const hsOptions = options ?? {};
    const attestHeaderName = isCsrfRequestInit(options) ? options.attestHeaderName ?? SKYARC_ATTEST_KEY : SKYARC_ATTEST_KEY;
    const fetchImpl = fetchFunc ?? fetch;
    async function addAttestKeyHeader() {
      removeHeader(hsOptions.headers, attestHeaderName);
      const attestKey = await getAttestKey(String(resource), hsOptions, fetchImpl);
      if (attestKey) {
        addHeader(hsOptions, attestHeaderName, attestKey);
        return true;
      } else {
        return false;
      }
    }
    let hasAttestKey = hasHeader(hsOptions.headers, attestHeaderName);
    if (!hasAttestKey) {
      await addAttestKeyHeader();
      hasAttestKey = true;
    }
    let resp = await fetchImpl(resource, hsOptions);
    if (resp.status === INVALID_ATTEST_KEY_STATUS && hasAttestKey) {
      clearAttestKey(String(resource));
      if (await addAttestKeyHeader()) {
        resp = await fetchImpl(resource, hsOptions);
      }
    }
    return resp;
  }
  function isCsrfRequestInit(value2) {
    return !!value2 && "attestHeaderName" in value2;
  }
  var GridError = class extends Error {
    constructor(message, grid) {
      super(message);
      __publicField(this, "grid");
      __publicField(this, "_isGridError", true);
      this.grid = grid;
    }
    toGrid() {
      return this.grid;
    }
  };
  function isGridError(error) {
    return !!(error && error._isGridError);
  }
  var HS_ACCEPT_HEADER_VALUE = `${ZINC_MIME_TYPE},${HAYSON_MIME_TYPE}`;
  function validateResponse(resp, val) {
    if (resp.status !== 200 && resp.status !== 201) {
      throw new Error(val ? String(val) : "Error in decoding haystack response");
    }
  }
  function validateValue(val, resp) {
    if (valueIsKind(val, Kind.Grid)) {
      const err = val.getError();
      if (err) {
        throw new GridError(err.dis, val);
      }
    }
    validateResponse(resp, val);
    if (!isHVal(val)) {
      throw new Error("Unable to decode haystack value");
    }
    return val;
  }
  async function parseResponse(resp) {
    const contentType = resp.headers.get(CONTENT_TYPE_HEADER);
    if (contentType?.includes(HAYSON_MIME_TYPE)) {
      return makeValue(await resp.json());
    } else if (contentType?.includes(ZINC_MIME_TYPE)) {
      return ZincReader.readValue(await resp.text());
    } else {
      return HStr.make(await resp.text());
    }
  }
  async function readVal(resp) {
    const val = await parseResponse(resp);
    return validateValue(val, resp);
  }
  function makeHsOptions(options) {
    const hsOptions = options ?? {};
    if (!hsOptions.credentials) {
      hsOptions.credentials = "include";
    }
    if (!hasHeader(hsOptions.headers, ACCEPT_HEADER)) {
      addHeader(hsOptions, ACCEPT_HEADER, HS_ACCEPT_HEADER_VALUE);
    }
    if (!hasHeader(hsOptions.headers, CONTENT_TYPE_HEADER) && hsOptions?.body) {
      addHeader(hsOptions, CONTENT_TYPE_HEADER, String(hsOptions?.body).startsWith("ver") ? ZINC_MIME_TYPE : HAYSON_MIME_TYPE);
    }
    return hsOptions;
  }
  async function fetchVal(resource, options, fetchFunc) {
    const fetchImpl = fetchFunc ?? fetch;
    return readVal(await fetchImpl(resource, makeHsOptions(options)));
  }
  function validateGrid(val) {
    return valueIsKind(val, Kind.Grid) ? val : new HGrid({
      meta: new HDict({
        err: HMarker.make(),
        dis: "Expected grid in response",
        errType: "error",
        errTrace: ""
      })
    });
  }
  async function readAllGrids(resp, gridCount) {
    validateResponse(resp);
    const zincReader = new ZincReader(await resp.text());
    const allGrids = [];
    for (let i = 0; i < gridCount; ++i) {
      allGrids.push(validateGrid(zincReader.readValue()));
    }
    return allGrids;
  }
  async function fetchAllGrids(resource, gridCount, options, fetchFunc) {
    if (gridCount <= 0) {
      throw new Error("Must request one of more grids");
    }
    const fetchImpl = fetchFunc ?? fetch;
    return readAllGrids(await fetchImpl(resource, makeHsOptions(options)), gridCount);
  }
  function getId(dict) {
    return dict.get("id")?.value ?? "";
  }
  function addRefToArray(ref2, list) {
    if (ref2.value) {
      list.push(ref2.value);
    }
  }
  function addDictToArray(dict, list) {
    const id = dict.get("id")?.value;
    if (id) {
      list.push(id);
    }
  }
  function addDictsToArray(dicts, list) {
    for (const dict of dicts) {
      addDictToArray(dict, list);
    }
  }
  function idsToArray(ids) {
    const array = [];
    if (valueIsKind(ids, Kind.Grid)) {
      addDictsToArray(ids.getRows(), array);
    } else if (valueIsKind(ids, Kind.List)) {
      for (const id of ids) {
        if (valueIsKind(id, Kind.Dict)) {
          addDictToArray(id, array);
        } else {
          addRefToArray(id, array);
        }
      }
    } else if (valueIsKind(ids, Kind.Dict)) {
      addDictToArray(ids, array);
    } else if (valueIsKind(ids, Kind.Ref)) {
      addRefToArray(ids, array);
    } else if (typeof ids === "string") {
      array.push(HRef.make(ids).value);
    } else if (Array.isArray(ids)) {
      for (const id of ids) {
        if (valueIsKind(id, Kind.Dict)) {
          addDictToArray(id, array);
        } else if (valueIsKind(id, Kind.Ref)) {
          addRefToArray(id, array);
        } else {
          array.push(HRef.make(id).value);
        }
      }
    } else {
      throw new Error("Unrecognized ids");
    }
    return array;
  }
  function dictsToGrid(dicts) {
    let grid;
    if (valueIsKind(dicts, Kind.Grid)) {
      grid = dicts;
    } else if (valueIsKind(dicts, Kind.List)) {
      grid = HGrid.make(dicts.values);
    } else if (Array.isArray(dicts)) {
      grid = HGrid.make(dicts);
    } else {
      grid = HDict.make(dicts).toGrid();
    }
    return grid;
  }
  function idsToDicts(ids) {
    return ids.map((id) => HDict.make({ id: HRef.make(id) }));
  }
  var _serviceConfig, _url;
  var RecordService = class {
    /**
     * Constructs a new record service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig);
      /**
       * The url for the record service.
       */
      __privateAdd(this, _url);
      __privateSet(this, _serviceConfig, serviceConfig);
      __privateSet(this, _url, serviceConfig.getHaystackServiceUrl("records"));
    }
    /**
     * Read a record via its id.
     *
     * @param id The id of the record to read.
     * @returns The record.
     * @throws An error if the record can't be found.
     */
    async readById(id) {
      const record = await fetchVal(`${__privateGet(this, _url)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions()
      }, __privateGet(this, _serviceConfig).fetch);
      return record;
    }
    /**
     * Read multiple records via their ids.
     *
     * @param id The ids of the records to read.
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readByIds(ids, options) {
      return fetchVal(`${__privateGet(this, _url)}${encodeQuery({
        ids,
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions()
      }, __privateGet(this, _serviceConfig).fetch);
    }
    /**
     * Query some records via a haystack filter.
     *
     * @param filter The haystack filter to query by.
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readByFilter(filter, options) {
      return fetchVal(`${__privateGet(this, _url)}${encodeQuery({
        filter,
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions()
      }, __privateGet(this, _serviceConfig).fetch);
    }
    /**
     * Query some records via a haystack filter and return the record count.
     *
     * @param filter The haystack filter to query by.
     * @returns The number of records counted.
     */
    async readCount(filter) {
      const grid = await fetchVal(`${__privateGet(this, _url)}${encodeQuery({
        count: filter
      })}`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions()
      }, __privateGet(this, _serviceConfig).fetch);
      return grid.meta.get("count")?.value ?? 0;
    }
    /**
     * Create some records on the server.
     *
     * @param dicts An array of dicts, array of hayson dicts, list of dicts
     * or a grid.
     * @returns The resultant grid of the create operation. The grid contains a
     * 'created' number property for the number of records created in the meta.
     */
    async create(dicts) {
      return fetchVal(__privateGet(this, _url), {
        ...__privateGet(this, _serviceConfig).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(dictsToGrid(dicts).toJSON())
      }, __privateGet(this, _serviceConfig).fetch);
    }
    /**
     * Create a single record on the server.
     *
     * @param dict The record to create.
     * @returns The resultant dict of the create operation.
     */
    async createRecord(dict) {
      return fetchVal(__privateGet(this, _url), {
        ...__privateGet(this, _serviceConfig).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(HDict.make(dict).toJSON())
      }, __privateGet(this, _serviceConfig).fetch);
    }
    /**
     * Delete a record via its id.
     *
     * @param id The id of the record to delete.
     * @returns If the record
     */
    async deleteById(id) {
      const record = await fetchVal(`${__privateGet(this, _url)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig).fetch);
      return record;
    }
    /**
     * Delete multiple records via their ids.
     *
     * @param id The ids of the records to delete.
     * @returns A grid with the records that were deleted. Each record only
     * contains the `id` and `mod` properties. The grid meta contains an
     * `deleted` number property for the total number of records deleted.
     */
    async deleteByIds(ids) {
      return fetchVal(`${__privateGet(this, _url)}${encodeQuery({
        ids
      })}`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig).fetch);
    }
    /**
     * Delete some records via a haystack filter.
     *
     * This method should be used with extreme caution! This command
     * could unintentionally delete critical records in a database.
     *
     * @param filter The haystack filter to query by.
     * @returns A grid with the records that were deleted. Each record only
     * contains the `id` and `mod` properties. The grid meta contains an
     * `deleted` number property for the total number of records deleted.
     */
    async deleteByFilter(filter) {
      return fetchVal(`${__privateGet(this, _url)}${encodeQuery({
        filter
      })}`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig).fetch);
    }
    /**
     * Update by a filter.
     *
     * This method should be used with extreme caution! This command
     * could unintentionally update critical records in a database.
     *
     * @param dict The dict to be applied to all records found.
     * @param options Optional options for the update operation.
     * @returns A grid with the records that were updated. Each record only
     * contains the `id` and `mod` properties. The grid meta contains an
     * `updated` number property for the total number of records updated.
     */
    async updateByFilter(filter, dict) {
      return fetchVal(`${__privateGet(this, _url)}${encodeQuery({
        filter
      })}`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(HDict.make(dict).toJSON())
      }, __privateGet(this, _serviceConfig).fetch);
    }
    /**
     * Update some records via their ids.
     *
     * @param dicts The dicts to update. Each record must specify an id.
     * @returns A grid with the records that were updated. Each record only
     * contains the `id` and `mod` properties. The grid meta contains an
     * `updated` number property for the total number of records updated.
     */
    async update(dicts) {
      return fetchVal(__privateGet(this, _url), {
        ...__privateGet(this, _serviceConfig).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(dictsToGrid(dicts).toJSON())
      }, __privateGet(this, _serviceConfig).fetch);
    }
    /**
     * Duplicate an existing record in the database.
     *
     * @param options The duplicate options.
     * @param options.id The id of the record to duplicate.
     * @param options.count The number of times to duplicate a record.
     * @param options.includeChildren Whether to also duplicate any contained child records.
     * @returns A list of top level record ids that were duplicated. This does not include
     * any child record ids that were duplicated.
     */
    async duplicate({ id, count, includeChildren }) {
      return fetchVal(`${__privateGet(this, _url)}/${HRef.make(id).value}/duplicate`, {
        ...__privateGet(this, _serviceConfig).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(new HDict({
          count,
          includeChildren
        }))
      }, __privateGet(this, _serviceConfig).fetch);
    }
  };
  _serviceConfig = new WeakMap();
  _url = new WeakMap();
  var WatchEventType;
  (function(WatchEventType2) {
    WatchEventType2["Closed"] = "closed";
    WatchEventType2["Changed"] = "changed";
    WatchEventType2["Refreshed"] = "refreshed";
    WatchEventType2["Added"] = "added";
    WatchEventType2["Removed"] = "removed";
    WatchEventType2["Error"] = "error";
  })(WatchEventType || (WatchEventType = {}));
  function clear(obj) {
    for (const key of Object.keys(obj)) {
      delete obj[key];
    }
  }
  var DEFAULT_POLL_RATE_SECS = 5;
  var watches = /* @__PURE__ */ new Set();
  var _subject, _errors, _watchDisplay, _closed, _idsToGridIndexes, _pollRate, _callbacks;
  var _Watch = class _Watch {
    /**
     * Constructs a new watch.
     *
     * Please note, all watches must be closed when no longer used.
     *
     * @param watchDisplay A client side display name for the watch.
     * @param subject The watch will observe this subject.
     * @param grid An empty grid to use for the watch.
     */
    constructor(watchDisplay, subject, grid = HGrid.make({})) {
      /**
       * The subject the watch is observing.
       */
      __privateAdd(this, _subject);
      /**
       * The grid for the watch.
       */
      __publicField(this, "grid");
      /**
       * The ids of records that are currently in error and are not being watched.
       */
      __privateAdd(this, _errors, /* @__PURE__ */ new Set());
      /**
       * The display name for the watch.
       */
      __privateAdd(this, _watchDisplay);
      /**
       * Flag indicating whether the watch is closed.
       */
      __privateAdd(this, _closed, false);
      /**
       * An object that holds dict indexes in the grid.
       */
      __privateAdd(this, _idsToGridIndexes, {});
      /**
       * The poll rate for this watch.
       */
      __privateAdd(this, _pollRate, DEFAULT_POLL_RATE_SECS);
      /**
       * Watch event callbacks.
       */
      __privateAdd(this, _callbacks, /* @__PURE__ */ new Map());
      /**
       * Changed event callback.
       */
      __publicField(this, "$onChanged", (event) => {
        let ids;
        for (const id in event.ids) {
          const index = __privateGet(this, _idsToGridIndexes)[id];
          if (index !== void 0) {
            ids = ids ?? {};
            const ev = event.ids[id];
            ids[id] = ev;
          }
        }
        if (ids) {
          this.updateGrid({
            idsToGridIndexes: __privateGet(this, _idsToGridIndexes),
            events: ids
          });
          const event2 = {
            type: WatchEventType.Changed,
            ids
          };
          this.fire(event2);
        }
      });
      __privateSet(this, _watchDisplay, watchDisplay);
      __privateSet(this, _subject, subject);
      this.grid = grid;
      __privateGet(this, _subject).on(this.$onChanged);
    }
    /**
     * Returns a list of watches.
     *
     * ```typescript
     * hs.Watch.watches.forEach((watch: Watch): void => {
     *   console.log(`We have watch: ${watch.display}`)
     * })
     * ```
     *
     * @returns A list of all open watches.
     */
    static get watches() {
      return [...watches];
    }
    /**
     * Inspect all the watches available.
     *
     * ```typescript
     * hs.Watch.inspectAll()
     * ```
     */
    static inspectAll() {
      this.watches.forEach((watch) => {
        watch.inspect();
      });
    }
    /**
     * Dump the watch to the local console output.
     *
     * ```typescript
     * watch.inspect()
     * ```
     *
     * @returns The value instance.
     */
    inspect() {
      this.grid.inspect(this.display);
      return this;
    }
    /**
     * Dump the watch's subject to the local console output.
     *
     * ```typescript
     * watch.inspectSubject()
     * ```
     *
     * @returns The value instance.
     */
    inspectSubject() {
      __privateGet(this, _subject).inspect();
      return this;
    }
    /**
     * ```typescript
     * console.log(watch.display)
     * ```
     *
     * @returns The display name of the watch.
     */
    get display() {
      return `${__privateGet(this, _watchDisplay)} @ ${__privateGet(this, _subject).display}`;
    }
    /**
     * @returns A string representation of a watch.
     */
    toString() {
      return this.display;
    }
    /**
     * Returns true if the watch is closed.
     *
     * ```typescript
     * if (watch.isClosed()) {
     *   // Do something
     * }
     * ```
     *
     * @returns True if the watch is closed. A closed watch
     * can no longer be used.
     */
    isClosed() {
      return __privateGet(this, _closed);
    }
    /**
     * @throws An error if the watch is closed.
     */
    throwErrorIfClosed() {
      if (__privateGet(this, _closed)) {
        throw new Error("Watch is closed");
      }
    }
    /**
     * Return a new opened watch.
     *
     * Please note, all watches must be closed when no longer used.
     *
     * @param options.subject The watch subject.
     * @param options.ids The ids to watch.
     * @param options.display Display name for the watch.
     * @param options.grid Optional grid to use for the watch.
     * @returns An opened watch.
     */
    static async open({ subject, ids, display, grid }) {
      const watch = new _Watch(display, subject, grid);
      await watch.add(ids);
      return watch;
    }
    /**
     * Close all watches for the given subject.
     *
     * Please note, this method doesn't normally need to be called
     * and is designed to be used internally. If you want
     * to close a watch then please just call `Watch.#close()` instead.
     *
     * @param subject The subject to close watches for.
     */
    static async close(subject) {
      await Promise.all([...watches].filter((watch) => __privateGet(watch, _subject) === subject).map((watch) => watch.close()));
    }
    /**
     * Add records to watch.
     *
     * ```typescript
     * await watch.add('@someid')
     * ```
     *
     * @param ids The ids to add.
     */
    async add(ids) {
      this.throwErrorIfClosed();
      watches.add(this);
      this.computeSubjectPollRate();
      const toAdd = idsToArray(ids).filter((id) => __privateGet(this, _idsToGridIndexes)[id] === void 0);
      if (toAdd.length) {
        await __privateGet(this, _subject).add(toAdd);
        const { addedIds, errorIds } = this.addDictsToGrid(toAdd);
        if (addedIds.length) {
          const event = {
            type: WatchEventType.Added,
            ids: addedIds
          };
          this.fire(event);
        }
        if (errorIds.length) {
          const event = {
            type: WatchEventType.Error,
            ids: errorIds
          };
          this.fire(event);
        }
      }
    }
    /**
     * Add new dicts to the watch's grid.
     *
     * @param toAdd The ids to add.
     * @returns The ids added and those in error.
     */
    addDictsToGrid(toAdd) {
      const addedIds = [];
      const errorIds = [];
      const dictsToAdd = [];
      let index = this.grid.length;
      for (const id of toAdd) {
        if (__privateGet(this, _idsToGridIndexes)[id] === void 0) {
          const dict = __privateGet(this, _subject).get(id)?.newCopy();
          if (dict) {
            __privateGet(this, _errors).delete(id);
            addedIds.push(id);
            dictsToAdd.push(dict);
            __privateGet(this, _idsToGridIndexes)[id] = index++;
          } else if (!__privateGet(this, _errors).has(id)) {
            __privateGet(this, _errors).add(id);
            errorIds.push(id);
          }
        }
      }
      if (dictsToAdd.length) {
        this.addToGrid(dictsToAdd);
      }
      return { addedIds, errorIds };
    }
    /**
     * Remove records to watch.
     *
     * This is called to stop watching records.
     *
     * ```typescript
     * await watch.remove('@someid')
     * ```
     *
     * @param ids The ids to remove.
     */
    async remove(ids) {
      this.throwErrorIfClosed();
      const idArray = idsToArray(ids);
      const toRemove = idArray.filter((id) => __privateGet(this, _idsToGridIndexes)[id] !== void 0);
      idArray.forEach(__privateGet(this, _errors).delete, __privateGet(this, _errors));
      if (toRemove.length) {
        await __privateGet(this, _subject).remove(toRemove);
        const event = {
          type: WatchEventType.Removed,
          ids: this.removeDictsFromGrid(toRemove)
        };
        this.fire(event);
      }
    }
    /**
     * Removes dicts from the watch's grid.
     *
     * @param toRemove The ids to remove.
     * @returns The removed ids.
     */
    removeDictsFromGrid(toRemove) {
      const ids = [];
      for (const id of toRemove) {
        if (__privateGet(this, _idsToGridIndexes)[id] !== void 0) {
          ids.push(id);
          this.removeFromGrid(`id == @${id}`);
          delete __privateGet(this, _idsToGridIndexes)[id];
        }
      }
      return ids;
    }
    /**
     * Completely refresh the watch.
     *
     * ```typescript
     * await watch.refresh()
     * ```
     */
    async refresh() {
      this.throwErrorIfClosed();
      await __privateGet(this, _subject).refresh();
      this.clearGrid();
      const dictsToAdd = [];
      for (const id of Object.keys(__privateGet(this, _idsToGridIndexes))) {
        const dict = __privateGet(this, _subject).get(id);
        if (dict) {
          dictsToAdd.push(dict.newCopy());
        }
      }
      if (dictsToAdd.length) {
        this.addToGrid(dictsToAdd);
      }
      this.rebuildDictCache();
      this.fire({ type: WatchEventType.Refreshed });
    }
    /**
     * Rebuild the cache of dicts.
     */
    rebuildDictCache() {
      clear(__privateGet(this, _idsToGridIndexes));
      for (let i = 0; i < this.grid.length; ++i) {
        const dict = this.grid.get(i);
        __privateGet(this, _idsToGridIndexes)[getId(dict)] = i;
      }
    }
    /**
     * Clear all watched items from the watch.
     *
     * Please note, this will not close the watch or remove any
     * associated method handlers.
     *
     * ```typescript
     * await watch.clear()
     * ```
     */
    async clear() {
      this.remove(this.grid);
    }
    /**
     * Close the watch.
     *
     * After this has been called, the underlying watch will be destroyed
     * and will be no longer active. The watch is effectively 'dead' after this
     * has been called.
     *
     * ```typescript
     * // We must always close a watch once we've finished using it.
     * await watch.close()
     * ```
     */
    async close() {
      try {
        if (this.isClosed()) {
          return;
        }
        __privateSet(this, _closed, true);
        await __privateGet(this, _subject).remove(Object.keys(__privateGet(this, _idsToGridIndexes)));
      } finally {
        this.fire({ type: WatchEventType.Closed });
        this.clearGrid();
        clear(__privateGet(this, _idsToGridIndexes));
        this.clearCallbacks();
        watches.delete(this);
        this.computeSubjectPollRate();
      }
    }
    /**
     * Returns the poll rate in seconds.
     *
     * ```typescript
     * const pollRate = watch.pollRate
     * ```
     *
     * @returns The poll rate for this watch.
     */
    get pollRate() {
      return __privateGet(this, _pollRate);
    }
    /**
     * Attempt to set a new poll rate in seconds for the watch.
     *
     * Please note, this value may be ignored.
     *
     * ```typescript
     * // Set the poll rate to 10 seconds.
     * watch.pollRate = 10
     * ```
     *
     * @param pollRate The poll rate.
     */
    set pollRate(pollRate) {
      __privateSet(this, _pollRate, pollRate);
      this.computeSubjectPollRate();
    }
    /**
     * Add an event handler for the specified event type.
     *
     * This is used to listen for watch events.
     *
     * ```typescript
     * watch.on(WatchEventType.Changed, (event: WatchEvent, emitter: WatchEventEmitter): void {
     *  // Do something with the event!
     * })
     * ```
     *
     * @param eventType The event type to add the event for.
     * @param callback The callback handler.
     * @return The emitter instance.
     * @throws An error if the watch is already closed.
     */
    on(eventType, callback) {
      this.throwErrorIfClosed();
      let allCallbacks = __privateGet(this, _callbacks).get(eventType);
      if (!allCallbacks) {
        allCallbacks = /* @__PURE__ */ new Set();
        __privateGet(this, _callbacks).set(eventType, allCallbacks);
      }
      allCallbacks.add(callback);
      return this;
    }
    /**
     * Remove an event handler from a watch.
     *
     * ```typescript
     * watch.off(WatchEventType.Changed, cb)
     * ```
     *
     * @param eventType event type to remove.
     * @param callback callback to remove.
     * @return The emitter instance.
     */
    off(eventType, callback) {
      const allCallbacks = __privateGet(this, _callbacks).get(eventType);
      if (allCallbacks) {
        allCallbacks.delete(callback);
        if (!allCallbacks.size) {
          __privateGet(this, _callbacks).delete(eventType);
        }
      }
      return this;
    }
    /**
     * Fire an event callback.
     *
     * @param event The event object.
     * @return The emitter instance.
     */
    fire(event) {
      __privateGet(this, _callbacks).get(event.type)?.forEach((callback) => {
        try {
          callback(event, this);
        } catch (err) {
          console.error(err);
        }
      });
      return this;
    }
    /**
     * Return the callbacks for the event type or all callbacks if
     * the event type is not specified.
     *
     * ```typescript
     * const anArrayOfCallbacks = watch.getCallbacks()
     * ```
     *
     * @param eventType Optional event type.
     * @returns The callbacks.
     */
    getCallbacks(eventType) {
      if (eventType) {
        return [...__privateGet(this, _callbacks).get(eventType) ?? []];
      } else {
        const callbacks = /* @__PURE__ */ new Set();
        for (const cbs of __privateGet(this, _callbacks).values()) {
          for (const c of cbs) {
            callbacks.add(c);
          }
        }
        return [...callbacks];
      }
    }
    /**
     * Return true if there are callback handlers for the specified event type.
     *
     * If there event type is not specified then check to see if there are any callback handlers.
     *
     * ```typescript
     * if (watch.hasCallbacks()) {
     *   // Do something...
     * }
     * ```
     *
     * @returns True if there are callbacks.
     */
    hasCallbacks(eventType) {
      return (eventType ? __privateGet(this, _callbacks).get(eventType)?.size || 0 : __privateGet(this, _callbacks).size) > 0;
    }
    /**
     * Clear all callback event handlers on the watch.
     *
     * ```typescript
     * // Clear all callbacks from the watch.
     * watch.clearCallbacks()
     * ```
     *
     * @return The emitter instance.
     */
    clearCallbacks() {
      __privateGet(this, _callbacks).clear();
      __privateGet(this, _subject).off(this.$onChanged);
      return this;
    }
    /**
     * Builds a changed callback handler based upon the parameters.
     *
     * Please note, the returned callback should be used to unregister the callback
     * handler from the watch.
     *
     * ```typescript
     * // Add event handlers. We're only interested in 'curVal' changes.
     * watch.changed({
     *   interests: ['curVal'],
     *   callback: (event) => console.log(event)
     * })
     *
     * ...
     *
     * // Add event handlers. We're only interested in changes to curVal when it's above
     * // a certain value.
     * watch.changed({
     * 	interests: ['curVal'],
     * 	condition: 'curVal > 50°F',
     * 	callback: event => console.log(event),
     * })
     * ```
     *
     * @param options.interests Optional interests. This is a list of tags on a record
     * the caller is interested. If specified, an event will only be fired if a record
     * with one of these tags is changed, added or removed.
     * @param options.condition Optional haystack filter condition used to filter a change
     * before any callback is invoked.
     * @param options.callback The callback.
     * @returns The built callback handler.
     * @throws An error if the haystack filter is invalid.
     */
    changed({ interests, condition, callback }) {
      const node = condition ? HFilter.parse(condition) : void 0;
      const cb = (event, watch) => {
        const changedEvent = event;
        const newEvent = {
          type: changedEvent.type,
          ids: {}
        };
        if (interests && interests.length > 0) {
          for (const id in changedEvent.ids) {
            const watchChanged = changedEvent.ids[id];
            const newWatchChanged = {};
            if (watchChanged.changed) {
              const changed = watchChanged.changed.filter((row) => interests.includes(row.name));
              if (changed.length) {
                newWatchChanged.changed = changed;
              }
            }
            if (watchChanged.added) {
              const added = watchChanged.added.filter((row) => interests.includes(row.name));
              if (added.length) {
                newWatchChanged.added = added;
              }
            }
            if (watchChanged.removed) {
              const removed = watchChanged.removed.filter((row) => interests.includes(row.name));
              if (removed.length) {
                newWatchChanged.removed = removed;
              }
            }
            if (newWatchChanged.changed || newWatchChanged.added || newWatchChanged.removed) {
              newEvent.ids[id] = newWatchChanged;
            }
          }
        } else {
          newEvent.ids = { ...changedEvent.ids };
        }
        if (node) {
          for (const id in newEvent.ids) {
            const index = __privateGet(this, _idsToGridIndexes)[id];
            if (index !== void 0) {
              const dict = this.grid.get(index);
              if (!dict || !dict.matches(node)) {
                delete newEvent.ids[id];
              }
            }
          }
        }
        if (Object.keys(newEvent.ids).length > 0) {
          callback(newEvent, watch);
        }
      };
      this.on(WatchEventType.Changed, cb);
      return cb;
    }
    /**
     * Called to remove dicts from the watch's grid.
     *
     * This method can be overridden to track grid mutations.
     *
     * @param filter The filter to remove items by.
     */
    removeFromGrid(filter) {
      this.grid.remove(filter);
    }
    /**
     * Add the dicts to the watch's grid.
     *
     * This method can be overridden to track grid mutations.
     *
     * @param dicts The dicts to add to the grid.
     */
    addToGrid(dicts) {
      this.grid.add(dicts);
    }
    /**
     * Empty the grid.
     *
     * This method can be overridden to track grid mutations.
     */
    clearGrid() {
      this.grid.clear();
    }
    /**
     * Update the grid with the new events information.
     *
     * @param options.dictIndexes An object with ids to indexes.
     * @param options.events The events to update the grid with.
     */
    updateGrid({ idsToGridIndexes, events }) {
      _Watch.updateGrid(idsToGridIndexes, this.grid, events);
    }
    /**
     * Update the grid with the new events.
     *
     * @param idsToGridIndexes A cache of ids to dict indexes in the grid.
     * @param grid The grid to update.
     * @param events The events to update the grid with.
     */
    static updateGrid(idsToGridIndexes, grid, events) {
      for (const id in events) {
        const ev = events[id];
        const index = idsToGridIndexes[id];
        if (index !== void 0) {
          const dict = grid.get(index);
          if (dict) {
            if (ev.added) {
              for (const obj of ev.added) {
                dict.set(obj.name, obj.value.newCopy());
              }
            }
            if (ev.changed) {
              for (const obj of ev.changed) {
                dict.set(obj.name, obj.value.newCopy());
              }
            }
            if (ev.removed) {
              for (const obj of ev.removed) {
                dict.remove(obj.name);
              }
            }
          }
        }
      }
    }
    /**
     * Compute a new poll rate from all the open watches.
     */
    computeSubjectPollRate() {
      const pollRate = _Watch.watches.length ? _Watch.watches.reduce((acc, watch) => acc < watch.pollRate ? acc : watch.pollRate, Number.MAX_SAFE_INTEGER) : DEFAULT_POLL_RATE_SECS;
      __privateGet(this, _subject).pollRate = pollRate <= 0 ? DEFAULT_POLL_RATE_SECS : pollRate;
    }
    /**
     * @returns The ids of the records that are in error
     * and can't be watched on the server.
     */
    get errors() {
      return [...__privateGet(this, _errors)];
    }
    /**
     * @returns the ids as refs of the records that in error
     * and can't be watched on the server.
     */
    get errorRefs() {
      return this.errors.map((id) => HRef.make(id));
    }
    /**
     * @returns True if the watch has errors.
     */
    hasErrors() {
      return __privateGet(this, _errors).size > 0;
    }
    /**
     * Return true if the id or the record is currently in error.
     *
     * @param id The id or record to test.
     * @returns True if the id is in error.
     */
    hasErrorForId(id) {
      let error = false;
      let recordId = "";
      if (typeof id === "string") {
        recordId = id;
      } else if (valueIsKind(id, Kind.Ref)) {
        recordId = id.value;
      } else if (valueIsKind(id, Kind.Dict)) {
        recordId = id.get("id")?.value ?? "";
      }
      for (const errorId of __privateGet(this, _errors)) {
        if (errorId === recordId) {
          error = true;
          break;
        }
      }
      return error;
    }
    /**
     * Request a watch poll.
     *
     * Please note, polls are normally handled automatically so manually
     * calling this is not normally required.
     */
    async poll() {
      return __privateGet(this, _subject).poll();
    }
  };
  _subject = new WeakMap();
  _errors = new WeakMap();
  _watchDisplay = new WeakMap();
  _closed = new WeakMap();
  _idsToGridIndexes = new WeakMap();
  _pollRate = new WeakMap();
  _callbacks = new WeakMap();
  var Watch = _Watch;
  var _queue, _locked;
  var Mutex = class {
    constructor() {
      /**
       * The FIFO queue of waiters waiting to acquire the lock.
       */
      __privateAdd(this, _queue, []);
      /**
       * Flag indicating whether the lock is currently held.
       */
      __privateAdd(this, _locked, false);
    }
    /**
     * Acquire the lock.
     *
     * Resolves with a `release` function once the lock is held. The caller
     * must invoke `release` exactly once to free the lock. Calling `release`
     * more than once is a no-op.
     *
     * The returned handle also implements `Disposable` so it can be used with
     * the `using` keyword:
     *
     * ```typescript
     * using release = await mutex.acquire()
     * // lock is automatically released when the block exits
     * ```
     *
     * @returns A release handle that is callable and implements `Disposable`.
     */
    async acquire() {
      if (__privateGet(this, _locked)) {
        await new Promise((resolve) => {
          __privateGet(this, _queue).push(resolve);
        });
      }
      __privateSet(this, _locked, true);
      return this.createRelease();
    }
    /**
     * Create a one shot release handle for the currently held lock.
     *
     * The handle is callable (`release()`) and also implements `Disposable`
     * (`release[Symbol.dispose]()`) so it works with the `using` keyword.
     *
     * @returns The release handle.
     */
    createRelease() {
      let released = false;
      const release = () => {
        if (released) {
          return;
        }
        released = true;
        const next = __privateGet(this, _queue).shift();
        if (next) {
          next();
        } else {
          __privateSet(this, _locked, false);
        }
      };
      release[Symbol.dispose] = release;
      return release;
    }
    /**
     * Run a task exclusively and sequentially.
     *
     * @param task The task to run.
     * @return A Promise that resolves to a result.
     */
    async runSequential(task) {
      var _stack = [];
      try {
        const _release = __using(_stack, await this.acquire());
        return await task();
      } catch (_) {
        var _error = _, _hasError = true;
      } finally {
        __callDispose(_stack, _error, _hasError);
      }
    }
    /**
     * Wait for all outstanding tasks to complete.
     */
    async wait() {
      var _stack = [];
      try {
        const _release = __using(_stack, await this.acquire());
      } catch (_) {
        var _error = _, _hasError = true;
      } finally {
        __callDispose(_stack, _error, _hasError);
      }
    }
    /**
     * @returns True if the mutex has outstanding tasks running.
     */
    isLocked() {
      return __privateGet(this, _locked);
    }
  };
  _queue = new WeakMap();
  _locked = new WeakMap();
  var LINGER_TIMEOUT_MS = 1e4;
  var _apis, _serviceConfig2, _pollRate2, _pollTimerId, _lingerTimerId, _open, _grid4, _id, _dictCache, _callbacks2, _mutex;
  var _ApiSubject = class _ApiSubject {
    /**
     * Construct a new watch API subject.
     *
     * @param apis The watch APIs.
     * @param serviceConfig The service configuration.
     * @param pollRate The poll rate.
     */
    constructor(apis, serviceConfig, pollRate) {
      /**
       * A reference to the watch operations.
       */
      __privateAdd(this, _apis);
      /**
       * Service configuration.
       */
      __privateAdd(this, _serviceConfig2);
      /**
       * The watch's poll rate.
       */
      __privateAdd(this, _pollRate2);
      /**
       * The timer id used for polling.
       */
      __privateAdd(this, _pollTimerId);
      /**
       * The timer id to linger a watch before it's closed.
       */
      __privateAdd(this, _lingerTimerId);
      /**
       * Flag indicating whether the watch is open.
       */
      __privateAdd(this, _open, false);
      /**
       * The grid for the watch.
       */
      __privateAdd(this, _grid4);
      /**
       * The server watch id.
       */
      __privateAdd(this, _id, "");
      /**
       * A cache of ids to dicts and their reference count.
       *
       * The reference count is used to keep track of how many adds and removes
       * there are for a particular record.
       */
      __privateAdd(this, _dictCache, {});
      /**
       * Watch event emitter.
       */
      __privateAdd(this, _callbacks2, /* @__PURE__ */ new Set());
      /**
       * A mutex used to ensure opening, closing, adding and removing operations
       * remain mutually exclusive and sequential.
       *
       * This has been added so multiple Watches can be created/changed
       * in parallel without any performance issues. For example, let's say two
       * watches are created at the same time. We need to ensure the server side watch
       * is only opened once and any records requested from both watches aren't ask for
       * multiple times through network requests.
       */
      __privateAdd(this, _mutex, new Mutex());
      /**
       * Close the server side watch if nothing is being observed.
       */
      __publicField(this, "checkClose", async () => {
        var _stack = [];
        try {
          const _release = __using(_stack, await __privateGet(this, _mutex).acquire());
          try {
            if (this.grid.isEmpty()) {
              await this.close();
            }
          } catch (error) {
            console.error(error);
          }
        } catch (_) {
          var _error = _, _hasError = true;
        } finally {
          __callDispose(_stack, _error, _hasError);
        }
      });
      __privateSet(this, _apis, apis);
      __privateSet(this, _serviceConfig2, serviceConfig);
      __privateSet(this, _pollRate2, pollRate);
    }
    /**
     * @returns The watch's grid instance.
     */
    get grid() {
      if (!__privateGet(this, _grid4)) {
        __privateSet(this, _grid4, HGrid.make({}));
      }
      return __privateGet(this, _grid4);
    }
    /**
     * @returns The display name for the subject.
     */
    get display() {
      const watchId = this.watchId ?? "-";
      return `${watchId} @ ${__privateGet(this, _serviceConfig2).getOpUrl("")}`;
    }
    /**
     * @returns The watch id.
     */
    get watchId() {
      return __privateGet(this, _id);
    }
    /**
     * @returns True if the watch is currently open.
     */
    isOpen() {
      return __privateGet(this, _open);
    }
    /**
     * Add records to observe.
     *
     * @param ids The ids to add.
     */
    async add(ids) {
      var _stack = [];
      try {
        const _release = __using(_stack, await __privateGet(this, _mutex).acquire());
        await (this.isOpen() ? this.addIds(ids) : this.open(ids));
      } catch (_) {
        var _error = _, _hasError = true;
      } finally {
        __callDispose(_stack, _error, _hasError);
      }
    }
    /**
     * Add the ids.
     *
     * The caller must hold the mutex for the duration of this call.
     *
     * @param ids The ids to add.
     */
    async addIds(ids) {
      try {
        this.stopLingerTimer();
        const toAddToServer = /* @__PURE__ */ new Set();
        const notToAddToServer = [];
        for (const id of ids) {
          if (!__privateGet(this, _dictCache)[id] && !toAddToServer.has(id)) {
            toAddToServer.add(id);
          } else {
            notToAddToServer.push(id);
          }
        }
        if (toAddToServer.size > 0) {
          const addedToServer = await __privateGet(this, _apis).add(this.watchId, [
            ...toAddToServer
          ]);
          this.addDictsToGrid(addedToServer);
        }
        this.incrementDictsCount(notToAddToServer);
      } finally {
        if (this.grid.isEmpty()) {
          this.restartLingerTimer();
        }
      }
    }
    /**
     * Add the dicts to the subject's grid.
     *
     * @param toAdd The dicts to add.
     */
    addDictsToGrid(toAdd) {
      for (const dict of toAdd) {
        if (!dict.isEmpty()) {
          const id = getId(dict);
          if (!__privateGet(this, _dictCache)[id]) {
            this.grid.add(dict);
            __privateGet(this, _dictCache)[id] = { count: 1, dict };
          }
        }
      }
    }
    /**
     * Increment the dict reference count.
     *
     * @param toAdd The dicts to have their reference count incremented.
     */
    incrementDictsCount(toAdd) {
      for (const id of toAdd) {
        const dictCount = __privateGet(this, _dictCache)[id];
        if (dictCount) {
          ++dictCount.count;
        }
      }
    }
    /**
     * Open a new watch.
     *
     * The caller must hold the mutex for the duration of this call.
     *
     * @param ids The ids to watch.
     * @returns The grid from the watch open response.
     */
    async open(ids) {
      try {
        this.stopLingerTimer();
        const openIds = [];
        const counts = {};
        for (const id2 of ids) {
          if (!counts[id2]) {
            openIds.push(id2);
            counts[id2] = 1;
          } else {
            ++counts[id2];
          }
        }
        const { id, records } = await __privateGet(this, _apis).open(openIds);
        __privateSet(this, _id, id);
        __privateSet(this, _grid4, HGrid.make({
          meta: HDict.make({ watchId: id }),
          rows: records
        }));
        __privateSet(this, _open, true);
        clear(__privateGet(this, _dictCache));
        for (const dict of this.grid) {
          const id2 = getId(dict);
          __privateGet(this, _dictCache)[id2] = { count: counts[id2] || 1, dict };
        }
        this.restartPollTimer();
      } finally {
        if (this.grid.isEmpty()) {
          this.restartLingerTimer();
        }
      }
      return __privateGet(this, _grid4);
    }
    /**
     * Attempt to reopen a watch.
     *
     * The caller must hold the mutex for the duration of this call.
     */
    async reopen() {
      const open = this.isOpen();
      let ids;
      if (open) {
        ids = Object.keys(__privateGet(this, _dictCache));
      }
      try {
        await this.close();
      } catch {
      }
      if (open && ids) {
        await this.open(ids);
      }
    }
    /**
     * Remove records to watch.
     *
     * This is called to stop watching records.
     *
     * @param ids The ids to remove.
     */
    async remove(ids) {
      var _stack = [];
      try {
        const _release = __using(_stack, await __privateGet(this, _mutex).acquire());
        try {
          if (!this.isOpen()) {
            return;
          }
          const toRemoveFromServer = [];
          for (const id of ids) {
            if (this.decrementAndRemoveDictFromGrid(id)) {
              toRemoveFromServer.push(id);
            }
          }
          if (toRemoveFromServer.length) {
            await __privateGet(this, _apis).remove(this.watchId, toRemoveFromServer);
          }
        } finally {
          if (this.grid.isEmpty()) {
            this.restartLingerTimer();
          }
        }
      } catch (_) {
        var _error = _, _hasError = true;
      } finally {
        __callDispose(_stack, _error, _hasError);
      }
    }
    /**
     * Decrement and possible remove an id from a watch's grid.
     *
     * @param id The id to remove
     * @returns True if the id has been removed.
     */
    decrementAndRemoveDictFromGrid(id) {
      const dictCount = __privateGet(this, _dictCache)[id];
      if (dictCount && --dictCount.count <= 0) {
        this.grid.remove(`id == @${id}`);
        delete __privateGet(this, _dictCache)[id];
        return true;
      } else {
        return false;
      }
    }
    /**
     * Register a callback for changed events.
     *
     * @param callback The callback used for changed events.
     */
    on(callback) {
      __privateGet(this, _callbacks2).add(callback);
    }
    /**
     * Unregister the callback for changed events.
     *
     * @param callback The callback used for changed events.
     */
    off(callback) {
      __privateGet(this, _callbacks2).delete(callback);
    }
    /**
     * Poll the watch and update the watch's grid.
     */
    async poll() {
      try {
        return await this.doUpdate(async (watchId) => __privateGet(this, _apis).poll(watchId));
      } catch (err) {
        if (isGridError(err)) {
          var _stack = [];
          try {
            const _release = __using(_stack, await __privateGet(this, _mutex).acquire());
            await this.reopen();
          } catch (_) {
            var _error = _, _hasError = true;
          } finally {
            __callDispose(_stack, _error, _hasError);
          }
        } else {
          throw err;
        }
      } finally {
        var _stack2 = [];
        try {
          const _release = __using(_stack2, await __privateGet(this, _mutex).acquire());
          if (this.isOpen()) {
            this.restartPollTimer();
          }
        } catch (_2) {
          var _error2 = _2, _hasError2 = true;
        } finally {
          __callDispose(_stack2, _error2, _hasError2);
        }
      }
    }
    /**
     * Used to manually trigger a watch update.
     *
     * @param grid A grid of dicts to update.
     */
    async update(grid) {
      await this.doUpdate(async () => grid.getRows());
    }
    /**
     * Poll the watch and update the watch's grid.
     *
     * @param getUpdatedRecords Optional function used to get the updated records.
     */
    async doUpdate(getUpdatedRecords = async (watchId) => __privateGet(this, _apis).poll(watchId)) {
      const watchId = this.watchId;
      if (!watchId) {
        return;
      }
      const generateEvent = __privateGet(this, _callbacks2).size > 0;
      let event;
      const updates = await getUpdatedRecords(watchId);
      for (const newDict of updates) {
        const curDict = __privateGet(this, _dictCache)[getId(newDict)]?.dict;
        if (curDict && _ApiSubject.canUpdate(curDict, newDict)) {
          const changes = _ApiSubject.updateDict(curDict, newDict, generateEvent);
          if (changes) {
            event = event ?? {
              type: WatchEventType.Changed,
              ids: {}
            };
            event.ids[getId(curDict)] = changes;
          }
        }
      }
      if (event) {
        for (const callback of __privateGet(this, _callbacks2)) {
          try {
            callback(event);
          } catch (err) {
            console.error(err);
          }
        }
      }
    }
    /**
     * Return true if the dicts can trigger an update event for a watch.
     *
     * @param curDict The current dict.
     * @param newDict The new dict.
     * @returns True if an update can be triggered.
     */
    static canUpdate(curDict, newDict) {
      const curMod = curDict.get("mod");
      const newMod = newDict.get("mod");
      if (!(curMod && newMod)) {
        return !curDict.equals(newDict);
      }
      const result = newMod.compareTo(curMod);
      if (result > 0) {
        return true;
      } else if (result === 0) {
        return !curDict.equals(newDict);
      } else {
        return false;
      }
    }
    /**
     * Update an existing dict with the new dict and return the changes
     * or undefined if none are detected.
     *
     * @param curDict The dict to be updated.
     * @param newDict The new dict.
     * @param generateEvent If true then event information will be generated as
     * the dicts are updated.
     * @returns The changes detected or undefined for no changes.
     */
    static updateDict(curDict, newDict, generateEvent) {
      const keys = /* @__PURE__ */ new Set();
      const curObj = curDict.toObj();
      for (const key in curObj) {
        keys.add(key);
      }
      const newObj = newDict.toObj();
      for (const key in newObj) {
        keys.add(key);
      }
      let changes;
      for (const key of keys) {
        const newVal = newObj[key];
        const curVal = curObj[key];
        if (newVal && !curVal) {
          if (generateEvent) {
            changes = changes ?? {};
            changes.added = changes.added ?? [];
            changes.added.push({ name: key, value: newVal.newCopy() });
          }
          curDict.set(key, newVal);
        } else if (!newVal && curVal) {
          if (generateEvent) {
            changes = changes ?? {};
            changes.removed = changes.removed ?? [];
            changes.removed.push({ name: key, value: curVal.newCopy() });
          }
          curDict.remove(key);
        } else if (newVal && curVal && !newVal.equals(curVal)) {
          if (generateEvent) {
            changes = changes ?? {};
            changes.changed = changes.changed ?? [];
            changes.changed.push({
              name: key,
              oldValue: curVal.newCopy(),
              value: newVal.newCopy()
            });
          }
          curDict.set(key, newVal);
        }
      }
      return changes;
    }
    /**
     * Completely refresh the watch.
     */
    async refresh() {
      var _stack = [];
      try {
        const _release = __using(_stack, await __privateGet(this, _mutex).acquire());
        try {
          this.stopLingerTimer();
          if (!this.isOpen()) {
            return;
          }
          try {
            const records = await __privateGet(this, _apis).refresh(this.watchId);
            __privateSet(this, _grid4, HGrid.make({
              meta: HDict.make({ watchId: __privateGet(this, _id) }),
              rows: records
            }));
            if (this.isOpen()) {
              this.restartPollTimer();
            }
            for (const dict of __privateGet(this, _grid4)) {
              const id = getId(dict);
              const dictCount = __privateGet(this, _dictCache)[id];
              if (dictCount) {
                dictCount.dict = dict;
              }
            }
          } catch (err) {
            if (isGridError(err)) {
              await this.reopen();
            } else {
              throw err;
            }
          }
        } finally {
          if (this.grid.isEmpty()) {
            this.restartLingerTimer();
          }
        }
      } catch (_) {
        var _error = _, _hasError = true;
      } finally {
        __callDispose(_stack, _error, _hasError);
      }
    }
    /**
     * Close the watch.
     *
     * The caller must hold the mutex for the duration of this call.
     */
    async close() {
      const open = this.isOpen();
      __privateSet(this, _open, false);
      this.stopPollTimer();
      this.stopLingerTimer();
      try {
        if (open) {
          await __privateGet(this, _apis).close(this.watchId);
        }
      } finally {
        clear(__privateGet(this, _dictCache));
        this.grid.meta.clear();
        this.grid.clear();
      }
    }
    /**
     * Return a record via its id or undefined if it can't be found.
     *
     * @param id The id to record to get.
     * @returns The dict or undefined if it can't be found.
     */
    get(id) {
      return __privateGet(this, _dictCache)[HRef.make(id).value]?.dict;
    }
    /**
     * @returns The subject's poll rate.
     */
    get pollRate() {
      return __privateGet(this, _pollRate2);
    }
    /**
     * Set a poll rate.
     *
     * @param pollRate The new poll rate.
     */
    set pollRate(pollRate) {
      const oldPollRate = __privateGet(this, _pollRate2);
      __privateSet(this, _pollRate2, pollRate);
      if (this.isOpen() && oldPollRate !== pollRate) {
        this.restartPollTimer();
      }
    }
    /**
     * Inspect the subject.
     */
    inspect() {
      this.grid.inspect(`Subject ${this.watchId}`);
    }
    /**
     * Restart the watch's poll timer.
     */
    restartPollTimer() {
      this.stopPollTimer();
      __privateSet(this, _pollTimerId, setTimeout(async () => {
        try {
          await this.poll();
        } catch (error) {
          console.error(error);
        }
      }, __privateGet(this, _pollRate2) * 1e3));
    }
    /**
     * Stop the watch's poll timer.
     */
    stopPollTimer() {
      if (__privateGet(this, _pollTimerId)) {
        clearTimeout(__privateGet(this, _pollTimerId));
        __privateSet(this, _pollTimerId, void 0);
      }
    }
    /**
     * Restart the watch's linger timer.
     *
     * If a watch is empty then a linger will wait a period of
     * time before shutting down the server side watch.
     */
    restartLingerTimer() {
      this.stopLingerTimer();
      __privateSet(this, _lingerTimerId, setTimeout(this.checkClose, LINGER_TIMEOUT_MS));
    }
    /**
     * Stop the watch's linger timer.
     */
    stopLingerTimer() {
      if (__privateGet(this, _lingerTimerId)) {
        clearTimeout(__privateGet(this, _lingerTimerId));
        __privateSet(this, _lingerTimerId, void 0);
      }
    }
  };
  _apis = new WeakMap();
  _serviceConfig2 = new WeakMap();
  _pollRate2 = new WeakMap();
  _pollTimerId = new WeakMap();
  _lingerTimerId = new WeakMap();
  _open = new WeakMap();
  _grid4 = new WeakMap();
  _id = new WeakMap();
  _dictCache = new WeakMap();
  _callbacks2 = new WeakMap();
  _mutex = new WeakMap();
  var ApiSubject = _ApiSubject;
  function makeDeferred() {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  }
  var BATCH_WINDOW_MS = 0;
  var OpType;
  (function(OpType2) {
    OpType2["add"] = "add";
    OpType2["remove"] = "remove";
  })(OpType || (OpType = {}));
  var _subject2, _batchTimer, _batchQueue;
  var BatchSubject = class {
    /**
     * Constructs a new batch subject.
     *
     * @param subject The subject to wrap.
     */
    constructor(subject) {
      /**
       * The inner subject.
       */
      __privateAdd(this, _subject2);
      /**
       * The timer used for batching operations.
       */
      __privateAdd(this, _batchTimer);
      /**
       * The queued batched ops.
       */
      __privateAdd(this, _batchQueue, []);
      __privateSet(this, _subject2, subject);
    }
    /**
     * @returns The display name of the subject.
     */
    get display() {
      return __privateGet(this, _subject2).display;
    }
    /**
     * @returns The subject's poll rate.
     */
    get pollRate() {
      return __privateGet(this, _subject2).pollRate;
    }
    /**
     * Set the poll rate.
     *
     * @param pollRate
     */
    set pollRate(pollRate) {
      __privateGet(this, _subject2).pollRate = pollRate;
    }
    /**
     * Refresh the subject's data.
     */
    async refresh() {
      await __privateGet(this, _subject2).refresh();
    }
    /**
     * Add records to observe.
     *
     * @param ids The ids to add.
     */
    async add(ids) {
      return this.batchInvoke(OpType.add, ids);
    }
    /**
     * Remove records from the subject.
     *
     * This is called to stop observing records.
     *
     * @param ids The ids to remove.
     */
    async remove(ids) {
      return this.batchInvoke(OpType.remove, ids);
    }
    /**
     * Invoke a batch operation.
     *
     * @param op The name of the op.
     * @param ids The ids used in the batch operation.
     */
    async batchInvoke(op, ids) {
      const deferred = makeDeferred();
      this.queueBatchOp(op, ids, deferred);
      this.clearBatchTimer();
      this.startBatchTimer();
      return deferred.promise;
    }
    /**
     * Queue the batch operation to be invoked.
     *
     * @param op The name of the op.
     * @param ids The ids used in the batch operation.
     * @param deferred The deferred promise for this asynchronous operation.
     */
    queueBatchOp(op, ids, deferred) {
      const lastOp = __privateGet(this, _batchQueue)[__privateGet(this, _batchQueue).length - 1];
      if (lastOp?.op === op) {
        for (const id of ids) {
          lastOp.ids.push(id);
        }
        lastOp.deferred.promise.then(deferred.resolve, deferred.reject);
      } else {
        __privateGet(this, _batchQueue).push({ op, ids: [...ids], deferred });
      }
    }
    /**
     * Clear the existing batch timer.
     */
    clearBatchTimer() {
      if (__privateGet(this, _batchTimer)) {
        clearTimeout(__privateGet(this, _batchTimer));
        __privateSet(this, _batchTimer, void 0);
      }
    }
    /**
     * Start a new batch timer.
     */
    startBatchTimer() {
      __privateSet(this, _batchTimer, setTimeout(async () => {
        try {
          const batchedOps = __privateGet(this, _batchQueue);
          __privateSet(this, _batchQueue, []);
          for (const batchedOp of batchedOps) {
            switch (batchedOp.op) {
              case OpType.add:
                await __privateGet(this, _subject2).add(batchedOp.ids).then(batchedOp.deferred.resolve, batchedOp.deferred.reject);
                break;
              case OpType.remove:
                await __privateGet(this, _subject2).remove(batchedOp.ids).then(batchedOp.deferred.resolve, batchedOp.deferred.reject);
                break;
              default:
                console.error(`Invalid op: ${batchedOp.op}`);
            }
          }
        } catch (error) {
          console.error("Watch batch subject error", error);
        }
      }, BATCH_WINDOW_MS));
    }
    /**
     * Register a callback for changed events.
     *
     * @param callback The callback used for changed events.
     */
    on(callback) {
      __privateGet(this, _subject2).on(callback);
    }
    /**
     * Unregister the callback for changed events.
     *
     * @param callback The callback used for changed events.
     */
    off(callback) {
      __privateGet(this, _subject2).off(callback);
    }
    /**
     * Return a record via its id or undefined if it can't be found.
     *
     * @param id The id to record to get.
     * @returns The dict or undefined if it can't be found.
     */
    get(id) {
      return __privateGet(this, _subject2).get(id);
    }
    /**
     * Used to manually trigger a watch update.
     *
     * @param grid A grid of dicts to update.
     */
    async update(grid) {
      return __privateGet(this, _subject2).update(grid);
    }
    /**
     * Inspect the subject.
     */
    inspect() {
      __privateGet(this, _subject2).inspect();
    }
    /**
     * Request a watch poll.
     */
    poll() {
      return __privateGet(this, _subject2).poll();
    }
  };
  _subject2 = new WeakMap();
  _batchTimer = new WeakMap();
  _batchQueue = new WeakMap();
  var _subject3;
  var WatchService = class {
    /**
     * Constructs a service object.
     *
     * @param serviceConfig Service configuration.
     * @param watchApis Watch network APIs implementation.
     */
    constructor(serviceConfig, watchApis) {
      /**
       * Internal subject used for watches.
       */
      __privateAdd(this, _subject3);
      const apiSubject = new ApiSubject(watchApis, serviceConfig, DEFAULT_POLL_RATE_SECS);
      __privateSet(this, _subject3, new BatchSubject(apiSubject));
    }
    /**
     * Create a new watch on the specified data.
     *
     * https://project-haystack.org/doc/Ops#watchSub
     * https://project-haystack.org/doc/Ops#watchUnsub
     * https://project-haystack.org/doc/Ops#watchPoll
     *
     * @param display Display name for the watch.
     * @param ids The ids to watch.
     * @param grid An optional empty grid to use for the watch.
     * @returns An opened watch.
     */
    async make(display, ids, grid) {
      return Watch.open({
        subject: __privateGet(this, _subject3),
        ids,
        display,
        grid
      });
    }
    /**
     * Closes any open watches for this watch service.
     */
    async close() {
      await Watch.close(__privateGet(this, _subject3));
    }
    /**
     * Triggers a manual update of the watches.
     *
     * This is used to manually update dicts outside of a poll.
     * Providing the dicts are newer and they're being watched, any
     * listeners will receive the update as if they were updated from
     * the server via a watch poll request.
     *
     * @param dicts The dicts to update.
     */
    async update(dicts) {
      return __privateGet(this, _subject3).update(dictsToGrid(dicts));
    }
    /**
     * Request a poll for all opened watches.
     *
     * Please note, polls are normally handled automatically so manually
     * calling this is not normally required.
     */
    async poll() {
      return __privateGet(this, _subject3).poll();
    }
  };
  _subject3 = new WeakMap();
  function autoGenerateWatchName() {
    return `haystack-nclient@${(/* @__PURE__ */ new Date()).toISOString()}`;
  }
  var DEFAULT_LEASE_TIME = HNum.make(1, "min");
  var WATCH_SUB_OP = "watchSub";
  var WATCH_POLL_OP = "watchPoll";
  var WATCH_UNSUB_OP = "watchUnsub";
  var _serviceConfig3;
  var WatchOpApis = class {
    /**
     * Constructs a new watch operations object.
     *
     * @param serviceConfig service configuration.
     */
    constructor(serviceConfig) {
      /**
       * Service configuration.
       */
      __privateAdd(this, _serviceConfig3);
      __privateSet(this, _serviceConfig3, serviceConfig);
    }
    /**
     * Open a new watch.
     *
     * @param ids The ids to watch.
     * @returns The watch open response.
     * @throws An error if the watch can't be created.
     */
    async open(ids, display) {
      const grid = HGrid.make({
        meta: HDict.make({
          watchDis: HStr.make(display || autoGenerateWatchName()),
          lease: DEFAULT_LEASE_TIME
        }),
        rows: idsToDicts(ids)
      });
      const resp = await fetchVal(__privateGet(this, _serviceConfig3).getOpUrl(WATCH_SUB_OP), {
        ...__privateGet(this, _serviceConfig3).getDefaultOptions(),
        method: "POST",
        body: grid.toZinc()
      }, __privateGet(this, _serviceConfig3).fetch);
      return {
        id: resp.meta.get("watchId")?.value ?? "",
        records: resp.getRows()
      };
    }
    /**
     * Add some records to an existing watch.
     *
     * @param watchId The id of the watch.
     * @param ids The record ids to watch.
     * @returns The watch add response.
     * @throws An error if the watch can't be found.
     */
    async add(watchId, ids) {
      const grid = HGrid.make({
        meta: HDict.make({ watchId: HStr.make(watchId) }),
        rows: idsToDicts(ids)
      });
      const resp = await fetchVal(__privateGet(this, _serviceConfig3).getOpUrl(WATCH_SUB_OP), {
        ...__privateGet(this, _serviceConfig3).getDefaultOptions(),
        method: "POST",
        body: grid.toZinc()
      }, __privateGet(this, _serviceConfig3).fetch);
      return resp.getRows();
    }
    /**
     * Poll an existing watch.
     *
     * @param watchId The watch id to poll.
     * @returns The watch poll data.
     * @throws An error if the watch can't be found.
     */
    async poll(watchId) {
      const grid = HGrid.make({
        meta: HDict.make({ watchId })
      });
      const resp = await fetchVal(__privateGet(this, _serviceConfig3).getOpUrl(WATCH_POLL_OP), {
        ...__privateGet(this, _serviceConfig3).getDefaultOptions(),
        method: "POST",
        body: grid.toZinc()
      }, __privateGet(this, _serviceConfig3).fetch);
      return resp.getRows();
    }
    /**
     * Refresh an existing watch.
     *
     * @param watchId The watch id to poll.
     * @returns The watch poll data.
     * @throws An error if the watch can't be found.
     */
    async refresh(watchId) {
      const grid = HGrid.make({
        meta: HDict.make({
          watchId: HStr.make(watchId),
          refresh: HMarker.make()
        })
      });
      const resp = await fetchVal(__privateGet(this, _serviceConfig3).getOpUrl(WATCH_POLL_OP), {
        ...__privateGet(this, _serviceConfig3).getDefaultOptions(),
        method: "POST",
        body: grid.toZinc()
      }, __privateGet(this, _serviceConfig3).fetch);
      return resp.getRows();
    }
    /**
     * Remove records from an existing watch.
     *
     * @param watchId The id of the watch.
     * @param ids The record ids to remove.
     * @throws An error if the watch can't be found.
     */
    async remove(watchId, ids) {
      const grid = HGrid.make({
        meta: HDict.make({ watchId: HStr.make(watchId) }),
        rows: idsToDicts(ids)
      });
      await fetchVal(__privateGet(this, _serviceConfig3).getOpUrl(WATCH_UNSUB_OP), {
        ...__privateGet(this, _serviceConfig3).getDefaultOptions(),
        method: "POST",
        body: grid.toZinc()
      }, __privateGet(this, _serviceConfig3).fetch);
    }
    /**
     * Close an existing watch.
     *
     * @param watchId The id of the watch.
     * @throws An error if the watch can't be found.
     */
    async close(watchId) {
      const grid = HGrid.make({
        meta: HDict.make({
          watchId: HStr.make(watchId),
          close: HMarker.make()
        })
      });
      await fetchVal(__privateGet(this, _serviceConfig3).getOpUrl(WATCH_UNSUB_OP), {
        ...__privateGet(this, _serviceConfig3).getDefaultOptions(),
        method: "POST",
        body: grid.toZinc()
      }, __privateGet(this, _serviceConfig3).fetch);
    }
  };
  _serviceConfig3 = new WeakMap();
  var HisRange;
  (function(HisRange2) {
    HisRange2["Today"] = "today";
    HisRange2["Yesterday"] = "yesterday";
  })(HisRange || (HisRange = {}));
  var _serviceConfig4;
  var OpsService = class {
    /**
     * Constructs a new record service object.
     *
     * @param serviceConfig Ops configuration.
     */
    constructor(serviceConfig) {
      /**
       * A service configuration object.
       */
      __privateAdd(this, _serviceConfig4);
      /**
       * The watch ops service.
       */
      __publicField(this, "watch");
      __privateSet(this, _serviceConfig4, serviceConfig);
      this.watch = new WatchService(__privateGet(this, _serviceConfig4), new WatchOpApis(__privateGet(this, _serviceConfig4)));
    }
    /**
     * https://project-haystack.org/doc/Ops#about
     *
     * @returns Server about information.
     */
    async about() {
      return fetchVal(__privateGet(this, _serviceConfig4).getOpUrl("about"), {
        ...__privateGet(this, _serviceConfig4).getDefaultOptions()
      }, __privateGet(this, _serviceConfig4).fetch);
    }
    /**
     * https://project-haystack.org/doc/Ops#ops
     *
     * @returns Available ops that can be invoked.
     */
    async ops() {
      return fetchVal(__privateGet(this, _serviceConfig4).getOpUrl("ops"), {
        ...__privateGet(this, _serviceConfig4).getDefaultOptions()
      }, __privateGet(this, _serviceConfig4).fetch);
    }
    /**
     * https://project-haystack.org/doc/Ops#formats
     *
     * @returns Available formats supported by the server.
     */
    async formats() {
      return fetchVal(__privateGet(this, _serviceConfig4).getOpUrl("formats"), {
        ...__privateGet(this, _serviceConfig4).getDefaultOptions()
      }, __privateGet(this, _serviceConfig4).fetch);
    }
    /**
     * A generic method used to invoke any op on the server using an HTTP POST.
     *
     * @param op The name of the op to invoke.
     * @param grid An optional grid argument that is encoded with the op call.
     * @returns The response grid.
     */
    async invokeOp(op, grid) {
      const options = {
        ...__privateGet(this, _serviceConfig4).getDefaultOptions(),
        method: "POST"
      };
      if (grid) {
        options.body = grid.toZinc();
      }
      return fetchVal(__privateGet(this, _serviceConfig4).getOpUrl(op), options, __privateGet(this, _serviceConfig4).fetch);
    }
    // Read Implementation
    async read(params, limit) {
      let requestGrid;
      if (Array.isArray(params)) {
        requestGrid = HGrid.make(params.map((param) => HDict.make({
          id: HRef.make(param)
        })));
      } else {
        requestGrid = HDict.make(typeof limit === "number" ? { filter: params, limit } : { filter: params }).toGrid();
      }
      if (requestGrid) {
        return this.invokeOp("read", requestGrid);
      }
      return Promise.reject(new Error("Invalid Request"));
    }
    /**
     * Read a writable point's priority array.
     *
     * https://project-haystack.org/doc/Ops#pointWrite
     *
     * @param id The id of the point to read.
     * @returns The writable point's priority array.
     */
    async pointRead(id) {
      return this.invokeOp("pointWrite", HDict.make({ id: HRef.make(id) }).toGrid());
    }
    /**
     * Write to a point's priority level.
     *
     * https://project-haystack.org/doc/Ops#pointWrite
     *
     * @param option.id The id of the point to write.
     * @param option.level The number from 1 to 17 to write too.
     * @param option.val Optional value to write. If not defined, the level is set to auto.
     * @param option.who Optional username performing the write, otherwise user 'dis' is used.
     * @param option.duration Optional number with duration unit if setting level 8.
     * @returns The writable point's priority array.
     */
    async pointWrite({ id, level, val, who, duration }) {
      const dict = HDict.make({});
      dict.set("id", HRef.make(id));
      dict.set("level", level);
      if (val !== void 0) {
        dict.set("val", val);
      }
      if (typeof who === "string") {
        dict.set("who", who);
      }
      if (duration || typeof duration === "number") {
        dict.set("duration", duration);
      }
      return this.invokeOp("pointWrite", dict.toGrid());
    }
    /**
     * Read time series data from a historized point.
     *
     * https://project-haystack.org/doc/Ops#hisRead
     *
     * @param id The id of the historized point.
     * @param range The date range.
     * @returns The time series data.
     */
    async hisRead(id, range) {
      let rangeStr;
      if (isHVal(range)) {
        rangeStr = range.toZinc();
      } else if (Array.isArray(range)) {
        rangeStr = range.map((val) => val.toZinc()).join(",");
      } else {
        rangeStr = String(range);
      }
      return this.invokeOp("hisRead", HDict.make({
        id: HRef.make(id),
        range: HStr.make(rangeStr)
      }).toGrid());
    }
    /**
     * Write the time series data to the historized point.
     *
     * https://project-haystack.org/doc/Ops#hisWrite
     *
     * @param id The id of the historized point.
     * @param data The data to write to the history.
     * @returns The history data to write.
     */
    async hisWrite(id, data) {
      const grid = dictsToGrid(data);
      grid.meta.set("id", HRef.make(id));
      return this.invokeOp("hisWrite", grid);
    }
    /**
     * Invoke an action on the target record.
     *
     * https://project-haystack.org/doc/Ops#invokeAction
     *
     * @param id The id of the target record to invoke the action on.
     * @param action The name of the action to invoke.
     * @param args Optional arguments for the action.
     * @returns The result of the action.
     */
    async invokeAction(id, action, args) {
      return this.invokeOp("invokeAction", HGrid.make({
        meta: HDict.make({
          id: HRef.make(id),
          action: HStr.make(action)
        }),
        rows: args ? [makeValue(args)] : []
      }));
    }
    /**
     * Get the navigation hierarchy at the specified node via its `navId`.
     * Return the root node if none is specified.
     *
     * https://project-haystack.org/doc/Ops#nav
     *
     * @param navId Optional navId string, str, ref, dict or grid. If a dict or grid, the id
     * must be specified via a navId property.
     * @returns The navigation.
     */
    async nav(navId) {
      let grid;
      if (navId) {
        if (valueIsKind(navId, Kind.Grid)) {
          grid = navId;
        } else if (typeof navId === "string" || valueIsKind(navId, Kind.Str)) {
          grid = HGrid.make([
            HDict.make({
              navId: HRef.make(navId)
            })
          ]);
        } else if (valueIsKind(navId, Kind.Ref)) {
          grid = HGrid.make([
            HDict.make({
              navId
            })
          ]);
        } else {
          grid = HGrid.make([HDict.make(navId)]);
        }
      } else {
        grid = HGrid.make({});
      }
      return this.invokeOp("nav", grid);
    }
  };
  _serviceConfig4 = new WeakMap();
  var DEFAULT_BATCH_WINDOW_TIMEOUT_MS = 0;
  var DEFAULT_BATCH_LIMIT = 100;
  var _timerId, _invocations, _batcher, _timeoutWindowMs, _limit;
  var BatchProcessor = class {
    /**
     * Construct a new batch processor that's used for batching
     * requests together.
     *
     * @param options.batcher The batcher function that typically makes a network request
     * with all the supplied arguments and returns the results. Each result can either
     * be the expected result or an Error object.
     * @param options.timeoutWindowMs Optional timeout window in milliseconds. By
     * default this is set to zero ms. This is the time used to wait before
     * invoking the `batcher` function.
     * @param options.limit Optional number of arguments limit in one call to the batcher
     * function. For instance, if the limit is 10 and there are 100 arguments batched
     * then the batcher will be called 10 times with 10 arguments each time.
     * By default, this is set to 100.
     */
    constructor({ batcher, timeoutWindowMs = DEFAULT_BATCH_WINDOW_TIMEOUT_MS, limit = DEFAULT_BATCH_LIMIT }) {
      /**
       * The internal timer id for keeping track of async activity.
       */
      __privateAdd(this, _timerId);
      /**
       * The cached invocations to batch.
       */
      __privateAdd(this, _invocations, []);
      /**
       * A `batcher` function that sends all the arguments together and then returns
       * all of their results.
       */
      __privateAdd(this, _batcher);
      /**
       * Time in milliseconds to wait before invoking the `batcher` function.
       */
      __privateAdd(this, _timeoutWindowMs);
      /**
       * The limit on the number of arguments sent to a batcher in one go.
       */
      __privateAdd(this, _limit);
      __privateSet(this, _batcher, batcher);
      __privateSet(this, _timeoutWindowMs, timeoutWindowMs);
      __privateSet(this, _limit, limit);
    }
    /**
     * Asynchronously invoke an operation with some arguments and return a
     * promise with the resolved data.
     *
     * @param arg The invocation arguments.
     * @returns The invoked response.
     */
    invoke(arg) {
      const deferred = makeDeferred();
      __privateGet(this, _invocations).push({ arg, deferred });
      this.restartBatchTimer();
      return deferred.promise;
    }
    /**
     * Restart the batch poll timer.
     */
    restartBatchTimer() {
      clearTimeout(__privateGet(this, _timerId));
      __privateSet(this, _timerId, setTimeout(async () => {
        const invocationList = this.getInvocationsByLimit();
        __privateSet(this, _invocations, []);
        for (const invocations of invocationList) {
          if (invocations.length > 0) {
            try {
              const returnVals = await __privateGet(this, _batcher).call(this, invocations.map((inv) => inv.arg));
              if (returnVals.length !== invocations.length) {
                throw new Error("The batcher return and arguments array size must be the same");
              }
              for (let i = 0; i < returnVals.length; ++i) {
                const returnVal = returnVals[i];
                if (returnVal instanceof Error) {
                  invocations[i].deferred.reject(returnVal);
                } else {
                  invocations[i].deferred.resolve(returnVal);
                }
              }
            } catch (error) {
              for (const { deferred } of invocations) {
                deferred.reject(error);
              }
            }
          }
        }
      }, __privateGet(this, _timeoutWindowMs)));
    }
    /**
     * Return a list of invocations bounded by a limit.
     *
     * @returns A list of invocations.
     */
    getInvocationsByLimit() {
      const list = [];
      let count = 0;
      while (count < __privateGet(this, _invocations).length) {
        const upper = count + __privateGet(this, _limit);
        const args = __privateGet(this, _invocations).slice(count, upper);
        if (args.length) {
          list.push(args);
        }
        count = upper;
      }
      return list;
    }
  };
  _timerId = new WeakMap();
  _invocations = new WeakMap();
  _batcher = new WeakMap();
  _timeoutWindowMs = new WeakMap();
  _limit = new WeakMap();
  var CommitType;
  (function(CommitType2) {
    CommitType2["Add"] = "add";
    CommitType2["Update"] = "update";
    CommitType2["Remove"] = "remove";
  })(CommitType || (CommitType = {}));
  var _serviceConfig5, _loadDefsPromise, _evalBatchProcessor;
  var ExtOpsService = class {
    /**
     * Constructs a service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * A service configuration object.
       */
      __privateAdd(this, _serviceConfig5);
      /**
       * Internal cached load defs promise.
       */
      __privateAdd(this, _loadDefsPromise);
      /**
       * Batch processor for evals.
       */
      __privateAdd(this, _evalBatchProcessor);
      /**
       * Used when evaluating batched eval requests.
       *
       * @param exprs The expressions to evaluate.
       * @returns The evalulated expression responses.
       */
      __publicField(this, "batchEval", async (exprs) => {
        if (exprs.length === 1) {
          return [await this.doEval(exprs[0])];
        } else {
          return (await this.doEvalAll(exprs)).map((grid) => {
            const error = grid.getError();
            return error ? new GridError(error.dis, grid) : grid;
          });
        }
      });
      __privateSet(this, _serviceConfig5, serviceConfig);
      __privateSet(this, _evalBatchProcessor, new BatchProcessor({
        batcher: this.batchEval
      }));
    }
    /**
     * Asynchronously load the defs library using this service.
     *
     * Please note, this will overwrite any existing defs loaded.
     *
     * @returns A promise that's resolved once the defs have been loaded.
     */
    async loadDefs() {
      if (!this.isDefsLoaded()) {
        try {
          const defs = await (__privateGet(this, _loadDefsPromise) ?? __privateSet(this, _loadDefsPromise, this.requestDefs()));
          __privateGet(this, _serviceConfig5).defs = defs;
        } catch (err) {
          __privateSet(this, _loadDefsPromise, void 0);
          throw err;
        }
      }
    }
    /**
     * @returns True if the defs have been loaded using this service.
     */
    isDefsLoaded() {
      return !__privateGet(this, _serviceConfig5).defs.grid.isEmpty();
    }
    /**
     * @returns A promise that resolves to the service's defs.
     */
    async requestDefs() {
      return new HNamespace(await this.eval("defs()"));
    }
    /**
     * Commit changes to the database. The caller must have 'admin' permissions
     * in order to use this op.
     *
     * The commit type can be one of the following...
     *
     * - add: adds new records into the database and returns a grid with the newly minted
     * record identifiers. As a general rule you should not have an id column in your commit grid.
     * However if you wish to predefine the id of the records, you can specify an id column in the commit grid.
     * - update: modified existing records, the records must have both an id and mod column
     * - remove: removes existing records, the records should have only an id and mod column
     *
     * https://skyfoundry.com/doc/docSkySpark/Ops#commit
     *
     * @param type The commit operation type (add, update or remove).
     * @param data The data to commit.
     */
    async commit(type, data) {
      const grid = dictsToGrid(data);
      grid.meta.set("commit", type);
      return fetchVal(__privateGet(this, _serviceConfig5).getOpUrl("commit"), {
        ...__privateGet(this, _serviceConfig5).getDefaultOptions(),
        method: "POST",
        body: grid.toZinc()
      }, __privateGet(this, _serviceConfig5).fetch);
    }
    /**
     * Evalulate a haystack filter request and return the result.
     *
     * This operation will automatically attempt to batch network calls
     * together to optimize client network requests.
     *
     * @param filter The haystack filter.
     * @returns The result of the filter query.
     */
    async read(filter) {
      return this.eval(`parseFilter(${HStr.make(filter).toAxon()}).readAll()`);
    }
    /**
     * Evaluate some code server side and return the response.
     *
     * This operation will automatically attempt to batch network calls
     * together to optimize client network requests.
     *
     * https://skyfoundry.com/doc/docSkySpark/Ops#eval
     *
     * @param expr The expression to evaluate.
     * @returns The evaluated expression response.
     */
    async eval(expr) {
      return __privateGet(this, _evalBatchProcessor).invoke(expr);
    }
    /**
     * Evaluate some code server side and return the response.
     *
     * https://skyfoundry.com/doc/docSkySpark/Ops#eval
     *
     * @param expr The expression to evaluate.
     * @returns The evaluated expression response.
     */
    async doEval(expr) {
      return fetchVal(__privateGet(this, _serviceConfig5).getOpUrl("eval"), {
        ...__privateGet(this, _serviceConfig5).getDefaultOptions(),
        method: "POST",
        body: HDict.make({ expr }).toGrid().toZinc()
      }, __privateGet(this, _serviceConfig5).fetch);
    }
    /**
     * Evalulate all the expressions and return the grids.
     *
     * https://skyfoundry.com/doc/docSkySpark/Ops#evalAll
     *
     * @param exprs The expressions to evaluate.
     * @returns The evalulated expression responses.
     * @throws Any fetch or grid responses.
     */
    async evalAll(exprs) {
      const grids = await this.doEvalAll(exprs);
      for (const grid of grids) {
        const err = grid.getError();
        if (err) {
          throw new GridError(err.dis, grid);
        }
      }
      return grids;
    }
    /**
     * Evalulate all the expressions and return the grids.
     *
     * https://skyfoundry.com/doc/docSkySpark/Ops#evalAll
     *
     * @param exprs The expressions to evaluate.
     * @returns The evalulated expression responses.
     */
    async doEvalAll(exprs) {
      const grid = HGrid.make(exprs.map((expr) => HDict.make({ expr })));
      return fetchAllGrids(__privateGet(this, _serviceConfig5).getOpUrl("evalAll"), exprs.length, {
        ...__privateGet(this, _serviceConfig5).getDefaultOptions(),
        method: "POST",
        body: grid.toZinc()
      }, __privateGet(this, _serviceConfig5).fetch);
    }
  };
  _serviceConfig5 = new WeakMap();
  _loadDefsPromise = new WeakMap();
  _evalBatchProcessor = new WeakMap();
  var ScheduleServiceEndpoints;
  (function(ScheduleServiceEndpoints2) {
    ScheduleServiceEndpoints2["Schedules"] = "schedules";
    ScheduleServiceEndpoints2["Calendars"] = "calendars";
  })(ScheduleServiceEndpoints || (ScheduleServiceEndpoints = {}));
  var _serviceConfig6, _calendarsUrl, _schedulesUrl;
  var ScheduleService = class {
    /**
     * Constructs a new record service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig6);
      /**
       * The url for the calendars service.
       */
      __privateAdd(this, _calendarsUrl);
      /**
       * The url for the schedules service.
       */
      __privateAdd(this, _schedulesUrl);
      __privateSet(this, _serviceConfig6, serviceConfig);
      __privateSet(this, _calendarsUrl, serviceConfig.getHaystackServiceUrl(ScheduleServiceEndpoints.Calendars));
      __privateSet(this, _schedulesUrl, serviceConfig.getHaystackServiceUrl(ScheduleServiceEndpoints.Schedules));
    }
    /**
     * Query all schedules.
     *
     * @param options Optional options for reading schedules.
     * @returns A grid of schedules.
     */
    async readAllSchedules(options) {
      return fetchVal(`${__privateGet(this, _schedulesUrl)}${encodeQuery({
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions()
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Creates single or multiple schedules.
     *
     * @param schedules The schedules to create.
     * @returns A grid of the created schedules.
     */
    async createSchedules(schedules) {
      return fetchVal(__privateGet(this, _schedulesUrl), {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(dictsToGrid(schedules).toJSON())
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Read a schedule by its id.
     *
     * @param id The record id.
     * @returns A schedule.
     */
    async readScheduleById(id) {
      return fetchVal(`${__privateGet(this, _schedulesUrl)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions()
      });
    }
    /**
     * Updates a schedule.
     *
     * @param id The record id.
     * @param schedule The schedule.
     * @returns The updated schedule record.
     */
    async updateSchedule(id, schedule) {
      return fetchVal(`${__privateGet(this, _schedulesUrl)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(schedule.toJSON())
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Deletes a schedule by its id.
     *
     * @param id The record id.
     * @returns The deleted schedule.
     */
    async deleteScheduleById(id) {
      return fetchVal(`${__privateGet(this, _schedulesUrl)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Reads the calendars associated to a schedule.
     *
     * @param id The record id.
     * @returns A grid of calendars.
     */
    async readScheduleCalendarsById(id) {
      return fetchVal(`${__privateGet(this, _schedulesUrl)}/${HRef.make(id).value}/calendars`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions()
      });
    }
    /**
     * Reads all the schedulable points associated to a schedule.
     *
     * @param id The record id.
     * @param options Schedule read options.
     * @returns A grid of points.
     */
    async readSchedulablePoints(id, options) {
      return fetchVal(`${__privateGet(this, _schedulesUrl)}/${HRef.make(id).value}/points${encodeQuery({
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions()
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Adds or Removes schedulable points to/from a schedule.
     *
     * @param id The record id.
     * @param pointUpdates The schedule point updates.
     * @returns A grid with the schedule points added/removed.
     */
    async updateSchedulePoints(id, pointUpdates) {
      return fetchVal(`${__privateGet(this, _schedulesUrl)}/${HRef.make(id).value}/points`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(pointUpdates)
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Query all calendars.
     *
     * @param options Optional options for reading calendars.
     * @returns A grid of calendars.
     */
    async readAllCalendars(options) {
      return fetchVal(`${__privateGet(this, _calendarsUrl)}${encodeQuery({
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions()
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Creates single or multiple calendars.
     *
     * @param calendars The calendars to create.
     * @returns A grid containing the created calendar(s).
     */
    async createCalendars(calendars) {
      return fetchVal(__privateGet(this, _calendarsUrl), {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(dictsToGrid(calendars).toJSON())
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Read a calendar by its id.
     *
     * @param id The record id.
     * @returns The calendar record.
     */
    async readCalendarById(id) {
      return fetchVal(`${__privateGet(this, _calendarsUrl)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions()
      });
    }
    /**
     * Updates a calendar.
     *
     * @param calendar The calendar record.
     * @returns The updated calendar record.
     */
    async updateCalendar(id, calendar) {
      return fetchVal(`${__privateGet(this, _calendarsUrl)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(calendar.toJSON())
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Deletes a calendar by its id.
     *
     * @param id The record id.
     * @returns The deleted calendar.
     */
    async deleteCalendarById(id) {
      return fetchVal(`${__privateGet(this, _calendarsUrl)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig6).fetch);
    }
    /**
     * Reads the schedules associated to a calendar.
     *
     * @param id The record id.
     * @returns A grid of schedules.
     */
    async readCalendarSchedulesById(id) {
      return fetchVal(`${__privateGet(this, _calendarsUrl)}/${HRef.make(id).value}/schedules`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions()
      });
    }
    /**
     * Reads the events associated with a schedule.
     *
     * Returns the events within the start -> end range,
     * or, if no end provided, will return the next scheduled event.
     *
     * @param id The record id.
     * @param options The range to use for event lookup.
     * @returns The events for the Schedule.
     */
    async readScheduleEvents(id, options) {
      return fetchVal(`${__privateGet(this, _schedulesUrl)}/${HRef.make(id).value}/events${encodeQuery({
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig6).getDefaultOptions()
      });
    }
  };
  _serviceConfig6 = new WeakMap();
  _calendarsUrl = new WeakMap();
  _schedulesUrl = new WeakMap();
  var _serviceConfig7;
  var WatchRestApis = class {
    /**
     * Constructs a new watch operations object.
     *
     * @param serviceConfig service configuration.
     */
    constructor(serviceConfig) {
      /**
       * Service configuration.
       */
      __privateAdd(this, _serviceConfig7);
      __privateSet(this, _serviceConfig7, serviceConfig);
    }
    /**
     * Open a new watch.
     *
     * @param ids The ids to watch.
     * @returns The watch open response.
     * @throws An error if the watch can't be created.
     */
    async open(ids, display) {
      const dict = HDict.make({
        name: HStr.make(display || autoGenerateWatchName()),
        ids: HList.make(ids),
        lease: DEFAULT_LEASE_TIME
      });
      const watchProps = await fetchVal(__privateGet(this, _serviceConfig7).getHaystackServiceUrl("watches?records=true"), {
        ...__privateGet(this, _serviceConfig7).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(dict.toJSON())
      }, __privateGet(this, _serviceConfig7).fetch);
      return {
        id: watchProps.id.value,
        records: watchProps.records.values
      };
    }
    /**
     * Add some records to an existing watch.
     *
     * @param watchId The id of the watch.
     * @param ids The record ids to watch.
     * @returns The watch add response.
     * @throws An error if the watch can't be found.
     */
    async add(watchId, ids) {
      const dict = HDict.make({
        add: ids
      });
      const resp = await fetchVal(`${__privateGet(this, _serviceConfig7).getHaystackServiceUrl("watches")}/${watchId}/ids`, {
        ...__privateGet(this, _serviceConfig7).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(dict.toJSON())
      }, __privateGet(this, _serviceConfig7).fetch);
      return resp.getRows();
    }
    /**
     * Poll an existing watch.
     *
     * @param watchId The watch id to poll.
     * @returns The watch poll data.
     * @throws An error if the watch can't be found.
     */
    async poll(watchId) {
      const resp = await fetchVal(`${__privateGet(this, _serviceConfig7).getHaystackServiceUrl(`watches/${watchId}/poll${encodeQuery({ v: Date.now() })}`)}`, {
        ...__privateGet(this, _serviceConfig7).getDefaultOptions()
      }, __privateGet(this, _serviceConfig7).fetch);
      return resp.getRows();
    }
    /**
     * Refresh an existing watch.
     *
     * @param watchId The watch id to poll.
     * @returns The watch poll data.
     * @throws An error if the watch can't be found.
     */
    async refresh(watchId) {
      const resp = await fetchVal(`${__privateGet(this, _serviceConfig7).getHaystackServiceUrl(`watches/${watchId}/poll`)}${encodeQuery({ all: true, v: Date.now() })}`, {
        ...__privateGet(this, _serviceConfig7).getDefaultOptions()
      }, __privateGet(this, _serviceConfig7).fetch);
      return resp.getRows();
    }
    /**
     * Remove records from an existing watch.
     *
     * @param watchId The id of the watch.
     * @param ids The record ids to remove.
     * @throws An error if the watch can't be found.
     */
    async remove(watchId, ids) {
      const dict = HDict.make({
        remove: ids
      });
      await fetchVal(`${__privateGet(this, _serviceConfig7).getHaystackServiceUrl("watches")}/${watchId}/ids`, {
        ...__privateGet(this, _serviceConfig7).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(dict.toJSON())
      }, __privateGet(this, _serviceConfig7).fetch);
    }
    /**
     * Close an existing watch.
     *
     * @param watchId The id of the watch.
     * @throws An error if the watch can't be found.
     */
    async close(watchId) {
      await fetchVal(`${__privateGet(this, _serviceConfig7).getHaystackServiceUrl("watches")}/${watchId}`, {
        ...__privateGet(this, _serviceConfig7).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig7).fetch);
    }
  };
  _serviceConfig7 = new WeakMap();
  var _serviceConfig8, _url2;
  var UserService = class {
    /**
     * Constructs a new user service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig8);
      /**
       * The url for the service.
       */
      __privateAdd(this, _url2);
      __privateSet(this, _serviceConfig8, serviceConfig);
      __privateSet(this, _url2, serviceConfig.getHostServiceUrl("users"));
    }
    /**
     * Read a user via its id.
     *
     * @param id The id of the user to read.
     * @returns The user record.
     * @throws An error if the user can't be found.
     */
    async readById(id) {
      const user = await fetchVal(`${__privateGet(this, _url2)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig8).getDefaultOptions()
      }, __privateGet(this, _serviceConfig8).fetch);
      return user;
    }
    /**
     * Query some users via a haystack filter.
     *
     * @param filter The haystack filter to query by.
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readByFilter(filter, options) {
      return fetchVal(`${__privateGet(this, _url2)}${encodeQuery({
        filter,
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig8).getDefaultOptions()
      }, __privateGet(this, _serviceConfig8).fetch);
    }
    /**
     * Query all users.
     *
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readAll(options) {
      return fetchVal(`${__privateGet(this, _url2)}${encodeQuery({
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig8).getDefaultOptions()
      }, __privateGet(this, _serviceConfig8).fetch);
    }
    /**
     * Create multiple user records.
     *
     * @param users The users to create.
     * @returns A grid of users.
     */
    async create(users) {
      return fetchVal(__privateGet(this, _url2), {
        ...__privateGet(this, _serviceConfig8).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(dictsToGrid(users).toJSON())
      }, __privateGet(this, _serviceConfig8).fetch);
    }
    /**
     * Create a single user record.
     *
     * @param user The user record to create.
     * @returns The created user record.
     */
    async createUser(user) {
      return fetchVal(__privateGet(this, _url2), {
        ...__privateGet(this, _serviceConfig8).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(HDict.make(user).toJSON())
      }, __privateGet(this, _serviceConfig8).fetch);
    }
    /**
     * Update a user record.
     *
     * @param user The user record to update.
     * @returns A updated record. Please note, this record doesn't
     * have any user information just the `id` and `mod`.
     */
    async update(user) {
      const userDict = HDict.make(user);
      return fetchVal(`${__privateGet(this, _url2)}/${userDict.id?.value ?? ""}`, {
        ...__privateGet(this, _serviceConfig8).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(userDict.toJSON())
      }, __privateGet(this, _serviceConfig8).fetch);
    }
    /**
     * Delete a user record via its id.
     *
     * @param id The id of the record to delete.
     */
    async deleteById(id) {
      await fetchVal(`${__privateGet(this, _url2)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig8).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig8).fetch);
    }
  };
  _serviceConfig8 = new WeakMap();
  _url2 = new WeakMap();
  var _serviceConfig9, _url3;
  var ProjectService = class {
    /**
     * Constructs a new project service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig9);
      /**
       * The url for the service.
       */
      __privateAdd(this, _url3);
      __privateSet(this, _serviceConfig9, serviceConfig);
      __privateSet(this, _url3, serviceConfig.getHostServiceUrl("projects"));
    }
    /**
     * Read a project via its name.
     *
     * @param name The name of the project to read.
     * @returns The project record.
     * @throws An error if the project can't be found.
     */
    async readByName(name) {
      const project = await fetchVal(`${__privateGet(this, _url3)}/${name}`, {
        ...__privateGet(this, _serviceConfig9).getDefaultOptions()
      }, __privateGet(this, _serviceConfig9).fetch);
      return project;
    }
    /**
     * Query all projects.
     *
     * @returns The result of the read operation.
     */
    async readAll() {
      return fetchVal(__privateGet(this, _url3), {
        ...__privateGet(this, _serviceConfig9).getDefaultOptions()
      }, __privateGet(this, _serviceConfig9).fetch);
    }
    /**
     * Create a project.
     *
     * @params project The project to create.
     * @returns The created project. Please note, the record only contains the name.
     */
    async createProject(project) {
      return await fetchVal(__privateGet(this, _url3), {
        ...__privateGet(this, _serviceConfig9).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(HDict.make(project).toJSON())
      }, __privateGet(this, _serviceConfig9).fetch);
    }
    /**
     * Update a project record.
     *
     * @param project The project record to update.
     * @returns A updated project record.
     */
    async update(project) {
      const projectDict = HDict.make(project);
      return fetchVal(`${__privateGet(this, _url3)}/${projectDict.get("projName")?.value ?? ""}`, {
        ...__privateGet(this, _serviceConfig9).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(projectDict.toJSON())
      }, __privateGet(this, _serviceConfig9).fetch);
    }
  };
  _serviceConfig9 = new WeakMap();
  _url3 = new WeakMap();
  var _serviceConfig10, _url4;
  var GroupsService = class {
    /**
     * Constructs a new groups service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig10);
      /**
       * The url for the service.
       */
      __privateAdd(this, _url4);
      __privateSet(this, _serviceConfig10, serviceConfig);
      __privateSet(this, _url4, serviceConfig.getHostServiceUrl("groups"));
    }
    /**
     * Query all groups.
     *
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readAll(options) {
      const groups = await fetchVal(`${__privateGet(this, _url4)}${encodeQuery({
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig10).getDefaultOptions()
      }, __privateGet(this, _serviceConfig10).fetch);
      if (groups.isEmpty()) {
        return [];
      }
      return groups.getRows();
    }
    /**
     * Read a group via its id.
     *
     * @param id The id of the group to read.
     * @returns The group record.
     * @throws An error if the group can't be found.
     */
    async readById(id) {
      const group = await fetchVal(`${__privateGet(this, _url4)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig10).getDefaultOptions()
      }, __privateGet(this, _serviceConfig10).fetch);
      return group;
    }
    /**
     * Query some groups via a haystack filter.
     *
     * @param filter The haystack filter to query by.
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readByFilter(filter, options) {
      return fetchVal(`${__privateGet(this, _url4)}${encodeQuery({
        filter,
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig10).getDefaultOptions()
      }, __privateGet(this, _serviceConfig10).fetch);
    }
    /**
     * Create multiple group records.
     *
     * @param groups The groups to create.
     * @returns A grid of groups.
     */
    async create(groups) {
      return fetchVal(`${__privateGet(this, _url4)}`, {
        ...__privateGet(this, _serviceConfig10).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(dictsToGrid(groups).toJSON())
      }, __privateGet(this, _serviceConfig10).fetch);
    }
    /**
     * Create a single group record.
     *
     * @param group The group record to create.
     * @returns The created group record.
     */
    async createGroup(group) {
      return fetchVal(__privateGet(this, _url4), {
        ...__privateGet(this, _serviceConfig10).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(HDict.make(group).toJSON())
      }, __privateGet(this, _serviceConfig10).fetch);
    }
    /**
     * Update a group record.
     *
     * @param group The group record to update.
     * @returns A updated record. Please note, this record doesn't
     * have any group information just the `id` and `mod`.
     */
    async update(group) {
      const groupDict = HDict.make(group);
      return fetchVal(`${__privateGet(this, _url4)}/${groupDict.id?.value ?? ""}`, {
        ...__privateGet(this, _serviceConfig10).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(groupDict.toJSON())
      }, __privateGet(this, _serviceConfig10).fetch);
    }
    /**
     * Delete a group record via its id.
     *
     * @param id The id of the record to delete.
     */
    async deleteById(id) {
      await fetchVal(`${__privateGet(this, _url4)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig10).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig10).fetch);
    }
  };
  _serviceConfig10 = new WeakMap();
  _url4 = new WeakMap();
  var _serviceConfig11, _url5;
  var RolesService = class {
    /**
     * Constructs a new roles service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig11);
      /**
       * The url for the service.
       */
      __privateAdd(this, _url5);
      __privateSet(this, _serviceConfig11, serviceConfig);
      __privateSet(this, _url5, serviceConfig.getHostServiceUrl("roles"));
    }
    /**
     * Query all roles.
     *
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readAll(options) {
      const roles = await fetchVal(`${__privateGet(this, _url5)}${encodeQuery({
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig11).getDefaultOptions()
      }, __privateGet(this, _serviceConfig11).fetch);
      if (roles.isEmpty()) {
        return [];
      }
      return roles.getRows();
    }
    /**
     * Read a role via its id.
     *
     * @param id The id of the role to read.
     * @returns The role record.
     * @throws An error if the role can't be found.
     */
    async readById(id) {
      const role = await fetchVal(`${__privateGet(this, _url5)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig11).getDefaultOptions()
      }, __privateGet(this, _serviceConfig11).fetch);
      return role;
    }
    /**
     * Query some roles via a haystack filter.
     *
     * @param filter The haystack filter to query by.
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readByFilter(filter, options) {
      return fetchVal(`${__privateGet(this, _url5)}${encodeQuery({
        filter,
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig11).getDefaultOptions()
      }, __privateGet(this, _serviceConfig11).fetch);
    }
    /**
     * Create multiple role records.
     *
     * @param role The roles to create.
     * @returns A grid of roles.
     */
    async create(roles) {
      return fetchVal(`${__privateGet(this, _url5)}`, {
        ...__privateGet(this, _serviceConfig11).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(dictsToGrid(roles).toJSON())
      }, __privateGet(this, _serviceConfig11).fetch);
    }
    /**
     * Create a single role record.
     *
     * @param role The role record to create.
     * @returns The created role record.
     */
    async createRole(role) {
      return fetchVal(__privateGet(this, _url5), {
        ...__privateGet(this, _serviceConfig11).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(HDict.make(role).toJSON())
      }, __privateGet(this, _serviceConfig11).fetch);
    }
    /**
     * Update a role record.
     *
     * @param role The role record to update.
     * @returns A updated record. Please note, this record doesn't
     * have any role information just the `id` and `mod`.
     */
    async update(role) {
      const roleDict = HDict.make(role);
      return fetchVal(`${__privateGet(this, _url5)}/${roleDict.id?.value ?? ""}`, {
        ...__privateGet(this, _serviceConfig11).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(roleDict.toJSON())
      }, __privateGet(this, _serviceConfig11).fetch);
    }
    /**
     * Delete a role record via its id.
     *
     * @param id The id of the record to delete.
     */
    async deleteById(id) {
      await fetchVal(`${__privateGet(this, _url5)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig11).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig11).fetch);
    }
  };
  _serviceConfig11 = new WeakMap();
  _url5 = new WeakMap();
  var NOTIFICATIONS_POLL_TIMER_MS = 5e3;
  var _opened, _eventSource, _timerId2, _closed2, _lastUpdatedNotification, _notificationService, _callbacks3;
  var NotificationsHandler = class {
    constructor({ notificationService, callbacks }) {
      __privateAdd(this, _opened, false);
      /**
       * Event source used for server push implementation.
       */
      __privateAdd(this, _eventSource);
      /**
       * The poll interval timeout id.
       */
      __privateAdd(this, _timerId2);
      /**
       * Event and Poll connection status
       */
      __privateAdd(this, _closed2, false);
      /**
       * Time of last notification update.
       */
      __privateAdd(this, _lastUpdatedNotification);
      /**
       * The notifications service.
       */
      __privateAdd(this, _notificationService);
      /**
       * The callbacks for notification events.
       */
      __privateAdd(this, _callbacks3, []);
      /**
       * On push notification event, parse result and update store
       * @param event MessageEvent
       */
      __publicField(this, "onNotificationReceived", (event) => {
        const data = JSON.parse(event.data);
        const notification = makeValue(data);
        this.setLastNotificationUpdateTime([notification]);
        this.callNotificationHandlers([notification]);
      });
      __privateSet(this, _notificationService, notificationService);
      __privateSet(this, _callbacks3, callbacks);
    }
    /**
     * Opens the connection(s) to receive notifications
     */
    async open() {
      this.throwErrorIfClosed();
      if (!__privateGet(this, _opened)) {
        __privateSet(this, _opened, true);
        await this.start();
      }
    }
    /**
     * Connect to the EventSource API and attach event handlers
     * @param client Client - The Haystack Client
     */
    async start() {
      const notifications = await __privateGet(this, _notificationService).readAll();
      this.setLastNotificationUpdateTime(notifications);
      __privateSet(this, _eventSource, new EventSource("/api/notifications/push", {
        withCredentials: true
      }));
      __privateGet(this, _eventSource).onmessage = this.onNotificationReceived;
      __privateGet(this, _eventSource).onerror = (e) => {
        console.error("event source error", e);
        this.onNotificationPushError();
      };
    }
    /**
     * Calls the callbacks when new notification(s) received
     * @param notifications Notifications[]
     */
    callNotificationHandlers(notifications) {
      for (const handler of __privateGet(this, _callbacks3)) {
        try {
          handler(notifications);
        } catch (error) {
          console.error(`Error processing notification event`, error, notifications);
        }
      }
    }
    /**
     * On push notification error, close EventSource and begin poll
     * @param client Client
     */
    onNotificationPushError() {
      try {
        __privateGet(this, _eventSource)?.close();
        console.log("event source closed");
      } catch {
        __privateSet(this, _eventSource, void 0);
      }
      this.initializePoll();
    }
    /**
     * Starts a poll on the notifications API, sorting
     * the requested notifications by time
     * @param client Client - The Haystack Client
     */
    async initializePoll() {
      try {
        this.poll();
      } catch (e) {
        console.error("Error polling notificaitons", e);
      }
    }
    setLastNotificationUpdateTime(notifications) {
      if (notifications.length === 0)
        return;
      __privateSet(this, _lastUpdatedNotification, notifications.sort((a, b) => {
        const ats = a?.lastUpdateTime?.iso;
        const bts = b?.lastUpdateTime?.iso;
        if (ats < bts) {
          return -1;
        }
        if (ats > bts) {
          return 1;
        }
        return 0;
      }).pop());
    }
    poll() {
      __privateSet(this, _timerId2, setTimeout(async () => {
        try {
          if (__privateGet(this, _lastUpdatedNotification)?.lastUpdateTime) {
            const newNotifications = await __privateGet(this, _notificationService).poll(__privateGet(this, _lastUpdatedNotification)?.lastUpdateTime);
            if (newNotifications.length > 0) {
              this.callNotificationHandlers(newNotifications);
            }
            this.setLastNotificationUpdateTime(newNotifications);
          }
        } catch (error) {
          console.error(error);
        } finally {
          if (!__privateGet(this, _closed2)) {
            this.poll();
          }
        }
      }, NOTIFICATIONS_POLL_TIMER_MS));
    }
    /**
     * Close EventSource API connection and stop API Polling
     */
    close() {
      __privateSet(this, _closed2, true);
      __privateGet(this, _eventSource)?.close();
      if (__privateGet(this, _timerId2)) {
        clearTimeout(__privateGet(this, _timerId2));
      }
      __privateSet(this, _callbacks3, []);
    }
    /**
     * @throws An error if the watch is closed.
     */
    throwErrorIfClosed() {
      if (__privateGet(this, _closed2)) {
        throw new Error("Watch is closed");
      }
    }
  };
  _opened = new WeakMap();
  _eventSource = new WeakMap();
  _timerId2 = new WeakMap();
  _closed2 = new WeakMap();
  _lastUpdatedNotification = new WeakMap();
  _notificationService = new WeakMap();
  _callbacks3 = new WeakMap();
  var _serviceConfig12, _url6;
  var NotificationService = class {
    /**
     * Constructs a new notifications service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig12);
      /**
       * The url for the service.
       */
      __privateAdd(this, _url6);
      __privateSet(this, _serviceConfig12, serviceConfig);
      __privateSet(this, _url6, serviceConfig.getServiceUrl("notifications"));
    }
    async make(callbacks) {
      const notificationHandler = new NotificationsHandler({
        notificationService: this,
        callbacks
      });
      await notificationHandler.open();
      return notificationHandler;
    }
    /**
     * Get all the notifications in the system for the current user
     *
     * @returns The result of the read operation.
     */
    async readAll() {
      const notifications = await fetchVal(`${__privateGet(this, _url6)}`, {
        method: "GET",
        ...__privateGet(this, _serviceConfig12).getDefaultOptions()
      }, __privateGet(this, _serviceConfig12).fetch);
      return notifications.toArray();
    }
    /**
     * Get notification topics that are visible to the current user
     *
     * @returns The result of the read operation.
     */
    async readAllTopics() {
      const topics = await fetchVal(`${__privateGet(this, _url6)}/topics`, {
        method: "GET",
        ...__privateGet(this, _serviceConfig12).getDefaultOptions()
      }, __privateGet(this, _serviceConfig12).fetch);
      return topics.toArray();
    }
    /**
     * Get all notifications in the system for the current user filtered
     * according to the user notification settings.
     *
     * @param filter A haystack filter
     * @returns The result of the read operation.
     */
    async readAllCurrentFiltered(filter) {
      const currentFilter = filter ?? "";
      const notifications = await fetchVal(`${__privateGet(this, _url6)}/current?filter=${currentFilter}`, {
        method: "GET",
        ...__privateGet(this, _serviceConfig12).getDefaultOptions()
      }, __privateGet(this, _serviceConfig12).fetch);
      return notifications.toArray();
    }
    /**
     * Get notifications for a topic that are visible to the
     * current user
     *
     * @param filter A haystack filter
     * @returns The filtered notifications.
     */
    async readByTopicFilter(filter) {
      const topicFilter = filter ?? "";
      const topicFilteredNotifications = await fetchVal(`${__privateGet(this, _url6)}/topics?filter=${topicFilter}`, {
        method: "GET",
        ...__privateGet(this, _serviceConfig12).getDefaultOptions()
      }, __privateGet(this, _serviceConfig12).fetch);
      return topicFilteredNotifications;
    }
    /**
     * This operations will only be valid if the current user has write access to the
     * notification `targetApp` and to the project the notification is stored in.
     * Super users are allowed to post any notification, including system ones.
     *
     * @param notification The notification object
     * @returns The filtered notifications.
     */
    async create(notification) {
      const createdNotificationId = await fetchVal(`${__privateGet(this, _url6)}`, {
        method: "POST",
        body: JSON.stringify(notification),
        ...__privateGet(this, _serviceConfig12).getDefaultOptions()
      }, __privateGet(this, _serviceConfig12).fetch);
      return createdNotificationId;
    }
    /**
     * Get all the new notifications in the system for the current user.
     *
     * @param timeOfLastMod Time of the last modification.
     * @returns New notifications since timeOfLastMod
     */
    async poll(timeOfLastMod) {
      const notifications = await fetchVal(`${__privateGet(this, _url6)}/poll`, {
        method: "POST",
        body: JSON.stringify(timeOfLastMod),
        ...__privateGet(this, _serviceConfig12).getDefaultOptions()
      }, __privateGet(this, _serviceConfig12).fetch);
      return notifications.toArray();
    }
    /**
     * Marks the state of notification with the specified id as resolved.
     *
     * @param id The notification ID to resolve
     * @returns The notification object
     */
    async resolve(id) {
      const resolvedNotification = await fetchVal(`${__privateGet(this, _url6)}/resolve/${HRef.make(id).value}`, {
        method: "PATCH",
        ...__privateGet(this, _serviceConfig12).getDefaultOptions(),
        body: JSON.stringify(id)
      }, __privateGet(this, _serviceConfig12).fetch);
      return resolvedNotification;
    }
    /**
     * Marks the state of notification state as dismissed.
     *
     * @param id The notification ID to dismiss
     * @returns The notification object
     */
    async dismiss(id) {
      const dismissedNotification = await fetchVal(`${__privateGet(this, _url6)}/dismiss/${HRef.make(id).value}`, {
        method: "PATCH",
        ...__privateGet(this, _serviceConfig12).getDefaultOptions(),
        body: JSON.stringify(id)
      }, __privateGet(this, _serviceConfig12).fetch);
      return dismissedNotification;
    }
  };
  _serviceConfig12 = new WeakMap();
  _url6 = new WeakMap();
  var _serviceConfig13, _url7;
  var NotificationSettingsService = class {
    /**
     * Constructs a new notifications service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig13);
      /**
       * The url for the service.
       */
      __privateAdd(this, _url7);
      __privateSet(this, _serviceConfig13, serviceConfig);
      __privateSet(this, _url7, serviceConfig.getServiceUrl("notifications/settings"));
    }
    /**
     * Get all the notification settings topics
     *
     * @returns The result of the read operation.
     */
    async readTopics() {
      const topics = await fetchVal(`${__privateGet(this, _url7)}/topics`, {
        method: "GET",
        ...__privateGet(this, _serviceConfig13).getDefaultOptions()
      }, __privateGet(this, _serviceConfig13).fetch);
      return topics.toArray();
    }
    /**
     * Adds or updates a topic description.
     * Note: Setting role descriptions is an operation that requires a super user role.
     *
     * @param topicDescription The topic description object
     * @returns Returns the id of the topic description that was either created or updated.
     */
    async setTopicSetting(topicSetting) {
      const updatedTopicId = await fetchVal(`${__privateGet(this, _url7)}/topics`, {
        method: "POST",
        ...__privateGet(this, _serviceConfig13).getDefaultOptions(),
        body: JSON.stringify(topicSetting.toJSON())
      }, __privateGet(this, _serviceConfig13).fetch);
      return updatedTopicId;
    }
    /**
     * Get the view notifications settings for the current user.
     *
     * @returns Returns the view settings for the current users.
     */
    async readUserViews() {
      const views = await fetchVal(`${__privateGet(this, _url7)}/view`, {
        method: "GET",
        ...__privateGet(this, _serviceConfig13).getDefaultOptions()
      }, __privateGet(this, _serviceConfig13).fetch);
      return views.toArray();
    }
    /**
     * Sets a notification view setting for the current user.
     * @param viewSetting The setting object
     * @returns Returns the id of the setting that was either created or updated.
     */
    async setUserViewSetting(userViewSetting) {
      const updatedViewSetting = await fetchVal(`${__privateGet(this, _url7)}/view`, {
        method: "POST",
        ...__privateGet(this, _serviceConfig13).getDefaultOptions(),
        body: JSON.stringify(userViewSetting.toJSON())
      }, __privateGet(this, _serviceConfig13).fetch);
      return updatedViewSetting;
    }
    /**
     * Get the system wide purge notifications settings.
     *
     * @returns Returns the system purge settings.
     */
    async readPurgeSettings() {
      const purgeSettings = await fetchVal(`${__privateGet(this, _url7)}/purge`, {
        method: "GET",
        ...__privateGet(this, _serviceConfig13).getDefaultOptions()
      }, __privateGet(this, _serviceConfig13).fetch);
      return purgeSettings.toArray();
    }
    /**
     * Sets a notification purge setting.
     * @param purgeSetting The setting object
     * @returns Returns the id of the setting that was either created or updated.
     */
    async setPurgeSettings(systemPurgeSetting) {
      const updatedPurgeSetting = await fetchVal(`${__privateGet(this, _url7)}/purge`, {
        method: "POST",
        ...__privateGet(this, _serviceConfig13).getDefaultOptions(),
        body: JSON.stringify(systemPurgeSetting.toJSON())
      }, __privateGet(this, _serviceConfig13).fetch);
      return updatedPurgeSetting;
    }
  };
  _serviceConfig13 = new WeakMap();
  _url7 = new WeakMap();
  var _serviceConfig14, _url8;
  var FunctionService = class {
    /**
     * Constructs a new function service object.
     *
     * @param serviceConfig Service configuration.
     */
    constructor(serviceConfig) {
      /**
       * The client service configuration.
       */
      __privateAdd(this, _serviceConfig14);
      /**
       * The url for the service.
       */
      __privateAdd(this, _url8);
      __privateSet(this, _serviceConfig14, serviceConfig);
      __privateSet(this, _url8, serviceConfig.getHaystackServiceUrl("funcs"));
    }
    /**
     * Query all functions.
     *
     * @param options Optional options for read operation.
     * @returns The result of the read operation.
     */
    async readAll(options) {
      const functions = await fetchVal(`${__privateGet(this, _url8)}${encodeQuery({
        ...options ?? {}
      })}`, {
        ...__privateGet(this, _serviceConfig14).getDefaultOptions()
      }, __privateGet(this, _serviceConfig14).fetch);
      return !functions.isEmpty() ? functions.getRows() : [];
    }
    /**
     * Read a function record via its id.
     *
     * @param id The id of the function to read.
     * @returns The function record.
     * @throws An error if the function can't be found.
     */
    async readById(id) {
      return await fetchVal(`${__privateGet(this, _url8)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig14).getDefaultOptions()
      }, __privateGet(this, _serviceConfig14).fetch);
    }
    /**
     * Create function record(s).
     *
     * @param functions HGrid<FunctionType> The functions to create.
     * @returns A grid of functions.
     */
    async create(functions) {
      return fetchVal(`${__privateGet(this, _url8)}`, {
        ...__privateGet(this, _serviceConfig14).getDefaultOptions(),
        method: "POST",
        body: JSON.stringify(dictsToGrid(functions).toJSON())
      }, __privateGet(this, _serviceConfig14).fetch);
    }
    /**
     * Update a function record.
     *
     * @param function The function record to update.
     * @returns The updated record.
     */
    async update(finFunction) {
      const functionDict = HDict.make(finFunction);
      return fetchVal(`${__privateGet(this, _url8)}/${functionDict.id?.value ?? ""}`, {
        ...__privateGet(this, _serviceConfig14).getDefaultOptions(),
        method: "PATCH",
        body: JSON.stringify(functionDict.toJSON())
      }, __privateGet(this, _serviceConfig14).fetch);
    }
    /**
     * Delete a function record via its id.
     *
     * @param id The id of the record to delete.
     */
    async deleteById(id) {
      await fetchVal(`${__privateGet(this, _url8)}/${HRef.make(id).value}`, {
        ...__privateGet(this, _serviceConfig14).getDefaultOptions(),
        method: "DELETE"
      }, __privateGet(this, _serviceConfig14).fetch);
    }
  };
  _serviceConfig14 = new WeakMap();
  _url8 = new WeakMap();
  var _getServiceUrl, _getOpUrl, _getHaystackServiceUrl, _getHostServiceUrl, _options, _loadDefsPromise2;
  var _Client = class _Client {
    /**
     * Constructs a new client.
     *
     * @param options.base The base URL.
     * @param options.project An optional project name. Defaults to 'sys'.
     * @param options.defs An optional instance of defs. If specified, the client will
     * be set to an intialized state.
     * @param options.options An optional set of fetch `options` to use with every request
     * sent from this client.
     * @param options.authBearer An optional bearer token that will be added to every request sent using
     * this client. This will add/overwrite any existing `Authorization` header already
     * added to the `options`.
     * @param options.fetch An optional fetch function to use for all network requests. If not specified
     * the FIN CSRF fetch will be used.
     * @param options.pathPrefix The optional path to be appended to the base URL when making certain requests.
     * @param options.getOpsUrl Optional function that returns the ops URL to use.
     * @param options.getHaystackServiceUrl Optional function that returns the haystack service URL to use.
     * @param options.getHostServiceUrl Optional function that returns the host service URL to use.
     */
    constructor({ base, project, defs, options, authBearer, fetch: fetch2, getServiceUrl: getServiceUrl$1, getOpUrl: getOpUrl$1, getHaystackServiceUrl: getHaystackServiceUrl$1, getHostServiceUrl: getHostServiceUrl$1, pathPrefix }) {
      /**
       * The origin of the client.
       */
      __publicField(this, "origin");
      /**
       * Fetches the API url
       */
      __privateAdd(this, _getServiceUrl);
      /**
       * Fetches the Ops URL.
       */
      __privateAdd(this, _getOpUrl);
      /**
       * Fetches the haystack service URL.
       */
      __privateAdd(this, _getHaystackServiceUrl);
      /**
       * Fetches the host service URL.
       */
      __privateAdd(this, _getHostServiceUrl);
      /**
       * The project associated with this client.
       */
      __publicField(this, "project");
      /**
       * Is the optional path that is appended to the client origin url
       */
      __publicField(this, "pathPrefix");
      /**
       * The defs associated with the client.
       */
      __publicField(this, "defs", new HNamespace(HGrid.make({})));
      /**
       * The ops service.
       */
      __publicField(this, "ops");
      /**
       * The extended ops service.
       */
      __publicField(this, "ext");
      /**
       * The record service.
       */
      __publicField(this, "record");
      /**
       * The schedule service.
       */
      __publicField(this, "schedule");
      /**
       * The watch service.
       */
      __publicField(this, "watch");
      /**
       * The user service.
       */
      __publicField(this, "user");
      /**
       * The user groups service
       */
      __publicField(this, "groups");
      /**
       * The user roles service
       */
      __publicField(this, "roles");
      /**
       * The project service.
       */
      __publicField(this, "proj");
      /**
       * The notifications service.
       */
      __publicField(this, "notifications");
      /**
       * The notifications settings service.
       */
      __publicField(this, "notificationsSettings");
      /**
       * The functions service
       */
      __publicField(this, "functions");
      /**
       * The `fetch` options.
       */
      __privateAdd(this, _options);
      /**
       * The `fetch` function to use for network communication.
       */
      __publicField(this, "fetch");
      /**
       * Internal cached load defs promise.
       */
      __privateAdd(this, _loadDefsPromise2);
      this.origin = base.origin;
      const path2 = base.pathname;
      __privateSet(this, _options, options ?? {});
      this.fetch = fetch2 ?? globalThis.globalFetchAdapter ?? finCsrfFetch;
      this.pathPrefix = addStartSlashRemoveEndSlash(pathPrefix?.trim() ?? "");
      __privateSet(this, _getServiceUrl, getServiceUrl$1 ?? getServiceUrl);
      __privateSet(this, _getOpUrl, getOpUrl$1 ?? getOpUrl);
      __privateSet(this, _getHaystackServiceUrl, getHaystackServiceUrl$1 ?? getHaystackServiceUrl);
      __privateSet(this, _getHostServiceUrl, getHostServiceUrl$1 ?? getHostServiceUrl);
      this.project = project || _Client.parseProjectFromProjects(path2) || _Client.parseProjectFromFinMobile(path2) || _Client.parseProjectFromApi(path2) || "";
      if (defs) {
        this.defs = defs;
      }
      this.ops = new OpsService(this);
      this.ext = new ExtOpsService(this);
      this.record = new RecordService(this);
      this.schedule = new ScheduleService(this);
      this.watch = new WatchService(this, new WatchRestApis(this));
      this.user = new UserService(this);
      this.proj = new ProjectService(this);
      this.groups = new GroupsService(this);
      this.roles = new RolesService(this);
      this.notifications = new NotificationService(this);
      this.notificationsSettings = new NotificationSettingsService(this);
      this.functions = new FunctionService(this);
      if (typeof authBearer === "string") {
        addHeader(__privateGet(this, _options), "Authorization", `Bearer ${authBearer}`);
      }
    }
    static parseProjectFromFinMobile(path2) {
      const res = /^\/finMobile\/([^/?#]+)/.exec(path2);
      return (res && res[1]) ?? "";
    }
    static parseProjectFromApi(path2) {
      const res = /^\/api\/([^/?#]+)/.exec(path2);
      return (res && res[1]) ?? "";
    }
    static parseProjectFromProjects(path2) {
      const res = /\/projects\/([^/?#]+)/.exec(path2);
      return (res && res[1]) ?? "";
    }
    /**
     * Returns the origin API Url
     *
     * @param path Name of the API
     * @returns A URL.
     */
    getServiceUrl(path2) {
      return __privateGet(this, _getServiceUrl).call(this, {
        origin: this.origin,
        path: path2
      });
    }
    /**
     * Returns the URL for an op.
     *
     * @param op The op to create the URL for.
     * @returns A URL.
     */
    getOpUrl(op) {
      return __privateGet(this, _getOpUrl).call(this, {
        origin: this.origin,
        pathPrefix: this.pathPrefix,
        project: this.project || "sys",
        op
      });
    }
    /**
     * Returns the URL for a haystack service.
     *
     * @param path The path of the service.
     * @returns A URL.
     */
    getHaystackServiceUrl(service) {
      return __privateGet(this, _getHaystackServiceUrl).call(this, {
        origin: this.origin,
        pathPrefix: this.pathPrefix,
        project: this.project,
        path: service
      });
    }
    /**
     * Returns the URL for a host service.
     *
     * @param path The path of the service.
     * @returns A URL.
     */
    getHostServiceUrl(path2) {
      return __privateGet(this, _getHostServiceUrl).call(this, {
        origin: this.origin,
        pathPrefix: this.pathPrefix,
        path: path2
      });
    }
    /**
     * @returns The default options to used with a fetch operation.
     */
    getDefaultOptions() {
      return __privateGet(this, _options);
    }
    /**
     * Asynchronously load the defs library using this service.
     *
     * Please note, this will overwrite any existing defs loaded.
     *
     * @returns A promise that's resolved once the defs have been loaded.
     */
    async loadDefs() {
      if (!this.isDefsLoaded()) {
        try {
          this.defs = await (__privateGet(this, _loadDefsPromise2) ?? __privateSet(this, _loadDefsPromise2, this.requestDefs()));
        } catch (err) {
          __privateSet(this, _loadDefsPromise2, void 0);
          throw err;
        }
      }
    }
    /**
     * @returns True if the defs have been loaded using this service.
     */
    isDefsLoaded() {
      return !this.defs.grid.isEmpty();
    }
    /**
     * @returns A promise that resolves to the service's defs.
     */
    async requestDefs() {
      const grid = await fetchVal(`${__privateGet(this, _getHaystackServiceUrl).call(this, {
        origin: this.origin,
        pathPrefix: this.pathPrefix,
        project: "",
        path: "defs"
      })}`, { ...this.getDefaultOptions() }, this.fetch);
      return new HNamespace(grid);
    }
    /**
     * @returns A JSON object of the Client that uniquely identifies it.
     */
    toJSON() {
      return {
        opUrl: this.getOpUrl(""),
        haystackServiceUrl: this.getHaystackServiceUrl(""),
        hostServiceUrl: this.getHostServiceUrl(""),
        project: this.project,
        pathPrefix: this.pathPrefix
      };
    }
    /**
     * Fetch a haystack value from the server.
     *
     * @param resource The resource to request.
     * @param body Optional haystack value used for the request's body.
     * @param options Optional object containing any custom settings.
     * @returns A promise that resolves to a value.
     * @throws A fetch or grid error.
     */
    async fetchVal(resource, body, options) {
      const fetchValOptions = { ...this.getDefaultOptions(), ...options };
      if (body !== void 0) {
        fetchValOptions.body = JSON.stringify(body);
        if (!fetchValOptions.method) {
          fetchValOptions.method = "POST";
        }
      }
      return fetchVal(resource, fetchValOptions, this.fetch);
    }
    /**
     * Closes the client.
     *
     * Warning: this will close any watches associated with this client. Any
     * watches may throw an error if they are used after being closed.
     */
    async close() {
      await Promise.all([this.watch.close(), this.ops.watch.close()]);
    }
  };
  _getServiceUrl = new WeakMap();
  _getOpUrl = new WeakMap();
  _getHaystackServiceUrl = new WeakMap();
  _getHostServiceUrl = new WeakMap();
  _options = new WeakMap();
  _loadDefsPromise2 = new WeakMap();
  var Client = _Client;

  // point-schema.js
  function value(dict, tag) {
    return typeof dict?.get === "function" ? dict.get(tag) : dict?.[tag];
  }
  function scalar(dict, tag) {
    const item = value(dict, tag);
    if (item == null) return void 0;
    if (typeof item.value !== "undefined") return item.value;
    return typeof item === "object" ? item.toString() : item;
  }
  function has(dict, tag) {
    return value(dict, tag) != null;
  }
  var ref = (dict, tag = "id") => scalar(dict, tag);
  var dis = (dict) => scalar(dict, "dis") ?? scalar(dict, "navName") ?? ref(dict) ?? "\u672A\u914D\u7F6E";
  var escapeHtml = (input) => String(input ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var fields = {
    mode: { tags: ["upsMode"], kind: "Str" },
    batteryVoltage: { tags: ["upsBatteryVolt"], unit: "V" },
    impedance: { tags: ["upsBatteryImpedance"], unit: "m\u03A9" },
    batteryTemp: { tags: ["upsBatteryTemp"], unit: "\xB0C" },
    chargeCurrent: { tags: ["upsChargeCurrent"], unit: "A" },
    capacity: { tags: ["upsBatteryCapacity"], unit: "%" },
    runtime: { tags: ["upsRuntimeEstimate"], unit: "min" },
    load: { tags: ["upsLoadRate"], unit: "%" },
    loadPower: { tags: ["upsLoadPower"], unit: "kW" },
    inverterVoltage: { tags: ["upsInverter", "upsVoltage"], unit: "V" },
    inverterFrequency: { tags: ["upsInverter", "upsFrequency"], unit: "Hz" },
    thd: { tags: ["upsInverter", "upsThd"], unit: "%" },
    rectifier: { tags: ["upsRectifier"], kind: "Str" },
    capacitor: { tags: ["upsCapacitorHealth"], unit: "%" },
    fan: { tags: ["upsFanStatus"], kind: "Str" },
    ambientTemp: { tags: ["upsAmbientTemp"], unit: "\xB0C" },
    humidity: { tags: ["upsHumidity"], unit: "%RH" },
    airQuality: { tags: ["upsAirQuality"], kind: "Str" },
    water: { tags: ["upsWaterDetected"], kind: "Bool" },
    transfer: { tags: ["upsTransferStatus"], kind: "Str" },
    bypass: { tags: ["upsBypassAvailable"], kind: "Bool" },
    transferDuration: { tags: ["upsTransfer", "upsTransferDuration"], unit: "ms" }
  };
  function selectPoint(points, field) {
    const spec = typeof field === "string" ? fields[field] : field;
    if (!spec) return { point: null, ambiguous: false };
    const matches = points.filter((p) => ["point", "sensor", ...spec.tags].every((t) => has(p, t)) && (!spec.unit || scalar(p, "unit") === spec.unit) && (!spec.kind || scalar(p, "kind") === spec.kind));
    matches.sort((a, b) => Number(has(b, "primary")) - Number(has(a, "primary")) || String(dis(a)).localeCompare(String(dis(b))) || String(ref(a)).localeCompare(String(ref(b))));
    return { point: matches[0] ?? null, ambiguous: matches.length > 1 };
  }
  function pointNumber(point2) {
    const n2 = scalar(point2, "curVal");
    return typeof n2 === "number" && Number.isFinite(n2) ? n2 : null;
  }
  function timestamp(item) {
    if (item == null) return null;
    if (item.date instanceof Date) return item.date.getTime();
    if (item instanceof Date) return item.getTime();
    if (typeof item === "number") return Number.isFinite(item) ? item : null;
    const result = Date.parse(String(item.value ?? item).replace(/ [A-Za-z_]+$/, ""));
    return Number.isFinite(result) ? result : null;
  }
  function pointQuality(point2, now = Date.now()) {
    if (!point2) return { state: "missing", label: "\u672A\u914D\u7F6E" };
    if (has(point2, "curErr") || has(point2, "writeErr") || scalar(point2, "curStatus") && scalar(point2, "curStatus") !== "ok") return { state: "invalid", label: "\u70B9\u4F4D\u5F02\u5E38" };
    const current = value(point2, "curVal");
    if (current == null || current.getKind?.() === "na") return { state: "missing", label: "\u6570\u636E\u7F3A\u5931" };
    const raw = scalar(point2, "curVal");
    if (typeof raw === "number" && !Number.isFinite(raw)) return { state: "invalid", label: "\u6570\u636E\u65E0\u6548" };
    const quality = scalar(point2, "upsDataQuality");
    if (quality === "invalid" || quality === "missing") return { state: quality, label: quality === "invalid" ? "\u6570\u636E\u65E0\u6548" : "\u6570\u636E\u7F3A\u5931" };
    if (quality !== "valid" && quality !== "stale") return { state: "unknown", label: "\u8D28\u91CF\u672A\u77E5" };
    const observed = timestamp(value(point2, "upsObservedAt"));
    const threshold = scalar(point2, "upsStaleAfterSec");
    if (observed == null || typeof threshold !== "number" || !Number.isFinite(threshold) || threshold <= 0 || observed > now + 6e4 || scalar(point2, "curStatus") !== "ok") return { state: "unknown", label: "\u8D28\u91CF\u672A\u77E5" };
    if (quality === "stale" || now - observed > threshold * 1e3) return { state: "stale", label: "\u6570\u636E\u8FC7\u671F" };
    return { state: "valid", label: "\u8D28\u91CF\u6709\u6548" };
  }
  function telemetryQuality(points, now = Date.now()) {
    if (!points.length) return { state: "unknown", label: "\u6682\u65E0\u89C2\u6D4B\u6570\u636E" };
    const qualities = points.map((point2) => pointQuality(point2, now));
    for (const [state2, label] of [["invalid", "\u5B58\u5728\u5F02\u5E38\u503C"], ["missing", "\u90E8\u5206\u6570\u636E\u7F3A\u5931"], ["stale", "\u90E8\u5206\u6570\u636E\u8FC7\u671F"], ["unknown", "\u90E8\u5206\u8D28\u91CF\u672A\u77E5"]]) {
      if (qualities.some((quality) => quality.state === state2)) return { state: state2, label };
    }
    return { state: "valid", label: "\u8D28\u91CF\u6709\u6548" };
  }
  function runtimeState(point2, required, now = Date.now()) {
    const quality = pointQuality(point2, now), reading = pointNumber(point2);
    if (quality.state !== "valid") return { value: null, margin: null, tone: quality.state === "invalid" ? "crit" : "unknown", message: `${quality.label}\uFF0C\u65E0\u6CD5\u786E\u8BA4\u4FDD\u969C\u88D5\u91CF`, quality };
    if (reading == null) return { value: null, margin: null, tone: "unknown", message: "\u7EED\u822A\u503C\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u786E\u8BA4\u4FDD\u969C\u88D5\u91CF", quality: { state: "invalid", label: "\u6570\u636E\u65E0\u6548" } };
    if (typeof required !== "number" || !Number.isFinite(required)) return { value: reading, margin: null, tone: "unknown", message: "\u4FDD\u969C\u65F6\u957F\u672A\u914D\u7F6E", quality };
    const margin = reading - required;
    return { value: reading, margin, tone: margin >= 0 ? "ok" : "crit", message: `${margin >= 0 ? "\u9AD8\u4E8E" : "\u4F4E\u4E8E"}\u4FDD\u969C\u65F6\u957F ${numberText(Math.abs(margin), 0)} min`, quality };
  }
  function numberText(number, digits = 1) {
    return typeof number === "number" && Number.isFinite(number) ? number.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : "\u2014";
  }
  function formatUnitValue(display, unit) {
    return unit ? `${display}${unit === "%" || unit === "%RH" ? "" : " "}${unit}` : String(display);
  }
  function formatClock(input, timezone = "UTC") {
    const time = timestamp(input);
    if (time == null) return "\u672A\u63D0\u4F9B\u65F6\u95F4";
    const seconds = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, second: "2-digit" }).format(time).padStart(2, "0");
    return `${formatTime(time, timezone)}:${seconds}`;
  }
  function formatTime(input, timezone = "UTC", date = true) {
    const time = timestamp(input);
    if (time == null) return "\u672A\u63D0\u4F9B\u65F6\u95F4";
    try {
      return new Intl.DateTimeFormat("zh-CN", { timeZone: timezone, year: date ? "numeric" : void 0, month: date ? "2-digit" : void 0, day: date ? "2-digit" : void 0, hour: "2-digit", minute: "2-digit", second: date ? void 0 : "2-digit", hour12: false }).format(time).replaceAll("/", "-");
    } catch {
      return new Date(time).toISOString().replace("T", " ").slice(0, date ? 16 : 19);
    }
  }

  // theme.js
  var THEME_KEY = "upsNew.theme";
  function readTheme(storage2) {
    try {
      return storage2?.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  }
  function setTheme(theme2, storage2) {
    const valid = theme2 === "dark" ? "dark" : "light";
    try {
      storage2?.setItem(THEME_KEY, valid);
    } catch {
    }
    return valid;
  }
  function applyTheme(theme2, doc = document) {
    const valid = theme2 === "dark" ? "dark" : "light";
    doc.documentElement.dataset.theme = valid;
    doc.documentElement.style.colorScheme = valid;
    doc.querySelector('meta[name="theme-color"]')?.setAttribute("content", valid === "dark" ? "#0e1218" : "#f3f6f8");
    const button = doc.querySelector("#theme-toggle");
    if (button) {
      button.innerHTML = `<span class="theme-toggle__dot" aria-hidden="true"></span><span>${valid === "light" ? "\u6D45\u8272\u6A21\u5F0F" : "\u6DF1\u8272\u6A21\u5F0F"}</span>`;
      button.setAttribute("aria-label", `\u5F53\u524D${valid === "light" ? "\u6D45\u8272" : "\u6DF1\u8272"}\u6A21\u5F0F\uFF0C\u5207\u6362\u81F3${valid === "light" ? "\u6DF1\u8272" : "\u6D45\u8272"}\u6A21\u5F0F`);
      button.setAttribute("aria-pressed", String(valid === "dark"));
    }
    return valid;
  }

  // history.js
  function parseHistory(grid) {
    const rows = typeof grid?.getRows === "function" ? grid.getRows() : grid ?? [];
    return rows.map((row) => {
      const raw = value(row, "val") ?? value(row, "v0");
      const n2 = raw?.value ?? raw;
      const quality = scalar(row, "quality");
      const time = timestamp(value(row, "ts"));
      const number = typeof n2 === "number" && Number.isFinite(n2) ? n2 : null;
      return { time, value: number, valid: time != null && number != null && (!quality || quality === "valid"), quality: quality ?? (number == null ? "missing" : "valid"), source: scalar(row, "source") };
    }).filter((p) => p.time != null).sort((a, b) => a.time - b.time);
  }
  function historyStats(series) {
    let min = Infinity, max = -Infinity, sum = 0, count = 0, latest = null;
    for (const point2 of series) {
      if (point2.valid && Number.isFinite(point2.value)) {
        min = Math.min(min, point2.value);
        max = Math.max(max, point2.value);
        sum += point2.value;
        count++;
        latest = point2.value;
      }
    }
    return { latest, min: count ? min : null, max: count ? max : null, average: count ? sum / count : null, count, total: series.length, excluded: series.length - count };
  }
  function downsample(data, limit = 600) {
    if (data.length <= limit || limit < 2) return data.slice(0, limit);
    if (limit === 2) return [data[0], data.at(-1)];
    const result = [data[0]];
    const bucket = (data.length - 2) / (limit - 2);
    let selected = 0;
    for (let i = 0; i < limit - 2; i++) {
      let avgStart = Math.floor((i + 1) * bucket) + 1, avgEnd = Math.min(Math.floor((i + 2) * bucket) + 1, data.length);
      let avgX = 0, avgY = 0;
      const count = Math.max(1, avgEnd - avgStart);
      for (let j = avgStart; j < avgEnd; j++) {
        avgX += data[j].time;
        avgY += data[j].value ?? 0;
      }
      avgX /= count;
      avgY /= count;
      const start2 = Math.floor(i * bucket) + 1, end = Math.min(Math.floor((i + 1) * bucket) + 1, data.length - 1);
      let area = -1, next = start2;
      const a = data[selected];
      for (let j = start2; j < end; j++) {
        const b = data[j];
        const triangle = Math.abs((a.time - avgX) * ((b.value ?? 0) - (a.value ?? 0)) - (a.time - b.time) * (avgY - (a.value ?? 0)));
        if (triangle > area) {
          area = triangle;
          next = j;
        }
      }
      result.push(data[next]);
      selected = next;
    }
    result.push(data.at(-1));
    return result;
  }
  function chartSegments(series, limit = 600) {
    const segments = [];
    let current = [];
    for (const point2 of series) {
      if (point2.valid) current.push(point2);
      else if (current.length) {
        segments.push(current);
        current = [];
      }
    }
    if (current.length) segments.push(current);
    const total = segments.reduce((sum, segment) => sum + segment.length, 0);
    if (total <= limit) return segments;
    if (segments.length >= limit) return Array.from({ length: limit }, (_, i) => [segments[Math.floor(i * segments.length / limit)][0]]);
    let budget = limit, remaining = total;
    return segments.map((segment, index) => {
      const slotsLeft = segments.length - index - 1;
      const target = Math.min(segment.length, Math.max(1, Math.min(budget - slotsLeft, Math.floor(budget * segment.length / remaining))));
      budget -= target;
      remaining -= segment.length;
      return downsample(segment, target);
    });
  }
  function rangeBounds(range, now = Date.now(), custom = {}) {
    let start2, end;
    if (range === "custom") {
      start2 = Number(custom.start);
      end = Number(custom.end);
    } else {
      const days = { "24h": 1, "7d": 7, "30d": 30 }[range];
      if (!days) throw Error("\u65E0\u6548\u7684\u5386\u53F2\u8303\u56F4");
      end = now;
      start2 = end - days * 864e5;
    }
    if (!Number.isFinite(start2) || !Number.isFinite(end) || start2 >= end) throw Error("\u5F00\u59CB\u65F6\u95F4\u5FC5\u987B\u65E9\u4E8E\u7ED3\u675F\u65F6\u95F4");
    if (end - start2 > 366 * 864e5) throw Error("\u5386\u53F2\u8303\u56F4\u4E0D\u80FD\u8D85\u8FC7 366 \u5929");
    return { start: start2, end };
  }
  function historyExpression(pointRef, range) {
    const id = HRef.make(String(pointRef).replace(/^@/, "")).toAxon();
    return `upsPointHistory(${id}, ${HDateTime.make(new Date(range.start)).toAxon()}..${HDateTime.make(new Date(range.end)).toAxon()}, {})`;
  }
  function customEpoch(input, timezone = "UTC") {
    const match = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/.exec(input ?? "");
    if (!match) throw Error("\u8BF7\u8F93\u5165\u5B8C\u6574\u7684\u5F00\u59CB\u548C\u7ED3\u675F\u65F6\u95F4");
    const parts = match.slice(1).map(Number);
    const nominal = Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
    let instant = nominal;
    for (let i = 0; i < 3; i++) {
      const formatted = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(instant);
      const p2 = Object.fromEntries(formatted.map((x) => [x.type, x.value]));
      const rendered = Date.UTC(+p2.year, +p2.month - 1, +p2.day, +p2.hour, +p2.minute, +p2.second);
      instant += nominal - rendered;
    }
    const roundTrip = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instant);
    const p = Object.fromEntries(roundTrip.map((x) => [x.type, x.value]));
    if (`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` !== input) throw Error("\u6240\u9009\u65F6\u95F4\u5728\u9879\u76EE\u65F6\u533A\u4E2D\u4E0D\u5B58\u5728");
    return instant;
  }

  // api.js
  var axonRef = (input) => HRef.make(String(input).replace(/^@/, "")).toAxon();
  var gridRows = (grid) => typeof grid?.getRows === "function" ? grid.getRows() : [];
  var _version2;
  var RequestGate = class {
    constructor() {
      __privateAdd(this, _version2, 0);
    }
    next() {
      return ++__privateWrapper(this, _version2)._;
    }
    current(version) {
      return version === __privateGet(this, _version2);
    }
  };
  _version2 = new WeakMap();
  async function historyResults(points, read) {
    return Promise.allSettled(points.map(read));
  }
  function orderRisks(assessment, risks) {
    const references = value(assessment, "riskItemRefs");
    const source = typeof references?.toArray === "function" ? references.toArray() : Array.isArray(references) ? references : [];
    const order = new Map(source.map((reference, index) => [String(reference?.value ?? reference?.val ?? reference).replace(/^@/, ""), index]));
    return [...risks].sort((a, b) => {
      const rankA = order.get(String(ref(a))) ?? Infinity, rankB = order.get(String(ref(b))) ?? Infinity;
      return (rankA === rankB ? 0 : rankA - rankB) || String(ref(a)).localeCompare(String(ref(b)));
    });
  }
  function recommendationsByRisk(groups) {
    return new Map(groups.map((group) => [String(group.riskRef), group.rows]));
  }
  function sortAlarms(alarms) {
    return [...alarms].sort((a, b) => {
      const timeA = timestamp(value(a, "raisedAt")) ?? -Infinity, timeB = timestamp(value(b, "raisedAt")) ?? -Infinity;
      return (timeA === timeB ? 0 : timeB - timeA) || String(ref(a)).localeCompare(String(ref(b)));
    });
  }
  function resolveTreeSelection(equips, currentRef) {
    const current = equips.find((equip) => ref(equip) === currentRef);
    return { equip: current ?? equips[0] ?? null, preserve: Boolean(current) };
  }
  async function alarmAck(alarm, evaluate2, refresh) {
    const id = ref(alarm);
    const version = scalar(alarm, "upsAlarmVersion");
    if (!id || !Number.isInteger(version) || version < 0) throw Error("\u544A\u8B66\u7F3A\u5C11\u6709\u6548\u7248\u672C\uFF0C\u65E0\u6CD5\u786E\u8BA4");
    try {
      return await evaluate2(`upsAlarmAck(${axonRef(id)}, null, ${version})`);
    } catch (error) {
      const text2 = error?.message ?? String(error);
      if (text2.includes("UPS-3002")) {
        await refresh();
        throw Error("\u544A\u8B66\u8BB0\u5F55\u5DF2\u53D8\u5316\uFF0C\u5DF2\u5237\u65B0\uFF0C\u8BF7\u6838\u5BF9\u540E\u91CD\u8BD5");
      }
      if (/permission|forbidden|not authorized|admin/i.test(text2)) throw Error("\u5F53\u524D\u8D26\u53F7\u65E0\u6743\u786E\u8BA4\u544A\u8B66");
      throw error;
    }
  }

  // app.js
  var $ = (id) => document.getElementById(id);
  var state = { client: null, project: null, tz: "UTC", sites: [], floors: [], equips: [], equip: null, points: [], alarms: [], assessment: null, risks: [], recommendations: /* @__PURE__ */ new Map(), selection: new RequestGate(), selectionVersion: 0, historyGate: new RequestGate(), histories: /* @__PURE__ */ new Map(), modes: /* @__PURE__ */ new Map(), historyField: "capacity", historyRange: "24h", historyUnit: "%", historySelected: [], historyCustom: null, telemetryBusy: false };
  var severityClass = { info: "info", warning: "warn", critical: "crit", unknown: "unknown" };
  var labels = { online: "\u5E02\u7535\u5728\u7EBF\u4F9B\u7535", battery: "\u7535\u6C60\u4F9B\u7535", bypass: "\u65C1\u8DEF\u4F9B\u7535", off: "\u8BBE\u5907\u505C\u673A", fault: "\u8BBE\u5907\u6545\u969C", unknown: "\u72B6\u6001\u672A\u77E5", onlineDoubleConversion: "\u5728\u7EBF\u53CC\u53D8\u6362", modularN1: "\u6A21\u5757\u5316 N+1", charging: "\u6B63\u5E38", running: "\u6B63\u5E38", good: "\u826F\u597D", utility: "\u5C31\u7EEA", ready: "\u5C31\u7EEA", normal: "\u6B63\u5E38", stopped: "\u5DF2\u505C\u6B62", unavailable: "\u4E0D\u53EF\u7528" };
  function text(id, content) {
    if ($(id)) $(id).textContent = content;
  }
  function html(id, content) {
    if ($(id)) $(id).innerHTML = content;
  }
  function announce(message) {
    text("live-status", message);
  }
  function errorMessage(error) {
    return error?.message ?? String(error);
  }
  function showError(error) {
    const message = errorMessage(error), banner = $("app-error");
    if (banner) {
      banner.hidden = false;
      const target = banner.querySelector("span");
      if (target) target.textContent = message;
    }
    announce(message);
  }
  function clearError() {
    if ($("app-error")) $("app-error").hidden = true;
  }
  async function evaluate(expression) {
    return state.client.ext.eval(expression);
  }
  function first(grid) {
    return gridRows(grid)[0] ?? null;
  }
  function point(field) {
    return selectPoint(state.points, field).point;
  }
  function n(field) {
    return pointNumber(point(field));
  }
  function status(field) {
    const p = point(field), quality = pointQuality(p);
    return quality.state === "valid" ? severityClass[scalar(p, "upsRiskLevel")] ?? (pointNumber(p) == null ? "ok" : "") : quality.state === "invalid" ? "crit" : quality.state;
  }
  function metric(field, digits = 1, unit = true) {
    const p = point(field);
    if (!p) return "\u672A\u914D\u7F6E";
    const numeric = pointNumber(p), val = scalar(p, "curVal");
    const output = numeric == null ? typeof val === "boolean" ? val ? "\u662F" : "\u5426" : labels[val] ?? val ?? "\u2014" : numberText(numeric, digits);
    return unit && numeric != null ? formatUnitValue(output, scalar(p, "unit")) : String(output);
  }
  function stat(label, content, className = "", note = "") {
    return `<div class="stat"><div class="stat__label">${escapeHtml(label)}</div><div class="stat__value${className ? " status-" + className : ""}">${escapeHtml(content)}</div>${note ? `<div class="stat__quality">${escapeHtml(note)}</div>` : ""}</div>`;
  }
  function fieldStat(field, label, digits = 1, unit = true) {
    const choice = selectPoint(state.points, field), q = pointQuality(choice.point);
    return stat(label, metric(field, digits, unit), status(field), choice.ambiguous ? "\u5B58\u5728\u591A\u4E2A\u5339\u914D\u70B9\u4F4D" : q.state !== "valid" && q.state !== "missing" ? q.label : "");
  }
  function path(equip = state.equip) {
    const site = state.sites.find((s) => ref(s) === ref(equip, "siteRef")), floor = state.floors.find((f) => ref(f) === ref(equip, "floorRef"));
    return [site ? dis(site) : ref(equip, "siteRef"), floor ? dis(floor) : ref(equip, "floorRef")].filter(Boolean).join(" / ");
  }
  function isDemo(equip = state.equip) {
    return has(equip, "upsDemo") && scalar(equip, "upsDataSource") === "simulated";
  }
  function projectName() {
    try {
      const top = window.top, project = top?.finstack?.projectName ?? top?.fin5Top?.finstack?.projectName;
      if (project) return project;
    } catch {
    }
    return new URLSearchParams(location.search).get("project");
  }
  function setTimezone() {
    const site = state.sites.find((s) => ref(s) === ref(state.equip, "siteRef")) ?? state.sites[0], zone = scalar(state.equip, "tz") ?? scalar(site, "tz");
    state.tz = zone ? HDateTime.getIANATimeZone(zone) || "UTC" : "UTC";
  }
  function renderTabs() {
    html("fleet-tabs", state.equips.length ? state.equips.map((equip) => {
      const id = ref(equip), active = id === ref(state.equip), mode = active ? scalar(point("mode"), "curVal") : state.modes.get(id);
      const tone = mode === "bypass" ? "bypass" : mode === "battery" || mode === "fault" ? "battery" : mode === "online" ? "online" : "unknown";
      return `<button type="button" class="fleet-tab${active ? " is-active" : ""}" data-equip-ref="${escapeHtml(id)}" aria-pressed="${active}"><span class="fleet-tab__dot status-dot-${tone}" aria-hidden="true"></span><span class="fleet-tab__text"><span class="fleet-tab__name">${escapeHtml(dis(equip))}</span><span class="fleet-tab__location">${escapeHtml(path(equip))}</span></span></button>`;
    }).join("") : '<div class="empty-state">\u6B64\u9879\u76EE\u5C1A\u672A\u914D\u7F6E UPS \u8BBE\u5907</div>');
  }
  function renderHero() {
    const equip = state.equip, mode = scalar(point("mode"), "curVal"), modeQuality = pointQuality(point("mode"));
    const modeClass = modeQuality.state !== "valid" ? "unknown" : ["battery", "bypass", "online", "fault"].includes(mode) ? mode : "unknown";
    if ($("hero")) $("hero").className = `hero status-${modeClass}`;
    text("hero-mode", modeQuality.state === "valid" ? labels[mode] ?? mode ?? "\u672A\u914D\u7F6E\u8FD0\u884C\u6A21\u5F0F" : modeQuality.label);
    text("equip-name", equip ? dis(equip) : "\u5C1A\u65E0 UPS \u8BBE\u5907");
    text("equip-topology", labels[scalar(equip, "upsTopology")] ?? scalar(equip, "upsTopology") ?? "\u672A\u914D\u7F6E\u62D3\u6251");
    text("equip-location", equip ? path() : "\u8BF7\u5728\u5F53\u524D\u9879\u76EE\u914D\u7F6E UPS \u8BBE\u5907\u6811");
    const observed = state.points.map((p) => timestamp(value(p, "upsObservedAt"))).filter((x) => x != null), latest = observed.length ? Math.max(...observed) : null;
    const quality = telemetryQuality(state.points);
    text("observed-status", `${isDemo() ? "\u6A21\u62DF\u6570\u636E" : "\u5B9E\u65F6\u6570\u636E"} \xB7 ${latest == null ? "\u672A\u63D0\u4F9B\u89C2\u6D4B\u65F6\u95F4" : formatTime(latest, state.tz, false)} \xB7 ${quality.label}`);
    text("last-refresh", latest == null ? "\u672A\u63D0\u4F9B" : formatTime(latest, state.tz));
    const runtime = runtimeState(point("runtime"), scalar(equip, "upsRequiredRuntime")), runtimeValue = $("runtime-value");
    text("runtime-value", runtime.value == null ? "\u2014" : numberText(runtime.value, 0));
    text("runtime-unit", "min");
    text("runtime-label", runtime.quality.state === "valid" ? "\u5F53\u524D\u8D1F\u8F7D\u4E0B\u9884\u8BA1\u7EED\u822A" : `\u9884\u8BA1\u7EED\u822A \xB7 ${runtime.quality.label}`);
    if (runtimeValue) runtimeValue.className = runtime.quality.state === "valid" ? "" : `status-${runtime.quality.state === "invalid" ? "crit" : "unknown"}`;
    text("runtime-flag", runtime.message);
    if ($("runtime-flag")) $("runtime-flag").className = `hero__metric-flag flag-${runtime.tone}`;
    const score = scalar(state.assessment, "upsHealthScore"), validScore = typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100;
    text("health-score", validScore ? numberText(score, 0) : "\u2014");
    text("health-label", validScore ? isDemo() ? "\u6A21\u62DF\u5065\u5EB7\u8BC4\u5206" : "\u5065\u5EB7\u8BC4\u5206" : "\u5C1A\u65E0\u8BC4\u5206");
    const ring = $("health-progress");
    if (ring) {
      ring.style.strokeDasharray = "301.593";
      ring.style.strokeDashoffset = String(validScore ? 301.593 * (1 - score / 100) : 301.593);
    }
    text("project-name", state.project ?? "\u672A\u8FDE\u63A5");
    text("connection-status", `${isDemo() ? "\u6A21\u62DF\u6F14\u793A \xB7 " : ""}\u5DF2\u8FDE\u63A5 ${state.project}`);
  }
  function sparkline(field, label, tone) {
    const p = point(field), history = p ? state.histories.get(ref(p)) : null, series = history?.series ?? [], latest = n(field);
    const graphic = history?.error ? '<span class="empty-state">\u5386\u53F2\u8BFB\u53D6\u5931\u8D25\uFF0C\u70B9\u51FB\u91CD\u8BD5</span>' : series.length ? chartSvg([{ series, color: tone === "info" ? "var(--info)" : "var(--ok)", name: label }], true) : '<span class="empty-state">\u6682\u65E0\u5386\u53F2\u6570\u636E</span>';
    const heading = `<span>${escapeHtml(label)} \xB7 \u6700\u8FD1 24 \u5C0F\u65F6</span>`;
    return field === "load" ? `<button type="button" class="sparkline__button" data-history="${field}" ${p ? "" : "disabled"} aria-label="\u67E5\u770B${escapeHtml(label)}\u5386\u53F2\u8BE6\u60C5"><span class="sparkline sparkline--muted">${graphic}</span><span class="sparkline__caption">${heading}</span></button>` : `<div class="sparkline-block"><button type="button" class="sparkline__button" data-history="${field}" ${p ? "" : "disabled"} aria-label="\u67E5\u770B${escapeHtml(label)}\u5386\u53F2\u8BE6\u60C5"><span class="sparkline__head">${heading}<strong>${latest == null ? "\u2014" : escapeHtml(numberText(latest, 0) + "%")}</strong></span><span class="sparkline">${graphic}</span></button></div>`;
  }
  function renderPanels() {
    const cells = scalar(state.equip, "upsCellCount");
    text("battery-meta", typeof cells === "number" ? `${cells} cells \xB7 ${scalar(state.equip, "upsBatteryType") ?? "\u7535\u6C60\u7EC4"}` : "\u672A\u914D\u7F6E\u7535\u6C60\u7EC4");
    html("battery-body", `<div class="stat-grid">${fieldStat("batteryVoltage", "\u7535\u6C60\u7EC4\u7535\u538B")}${fieldStat("impedance", "\u5185\u963B")}${fieldStat("batteryTemp", "\u7535\u6C60\u6E29\u5EA6")}${fieldStat("chargeCurrent", "\u5145\u7535\u7535\u6D41")}</div>${sparkline("capacity", "\u5BB9\u91CF\u8D8B\u52BF", "ok")}`);
    const load = n("load"), rated = scalar(state.equip, "upsRatedPower");
    text("load-meta", `${n("loadPower") == null ? "\u2014" : numberText(n("loadPower"), 1)} kW / ${typeof rated === "number" ? numberText(rated, 0) : "\u2014"} kW`);
    html("load-body", `<div class="load-bar" role="meter" aria-label="\u5F53\u524D\u8D1F\u8F7D\u7387" ${load == null ? "" : `aria-valuenow="${load}" aria-valuemin="0" aria-valuemax="100"`}><div class="load-bar__fill" style="width:${load == null ? 0 : Math.max(0, Math.min(100, load))}%"></div></div><div class="load-bar__scale"><span>0%</span><span>50%</span><span>100%</span></div>${sparkline("load", "\u8D1F\u8F7D\u8D8B\u52BF", "info")}<div class="stat-grid">${stat("\u4FDD\u969C\u65F6\u957F", typeof scalar(state.equip, "upsRequiredRuntime") === "number" ? numberText(scalar(state.equip, "upsRequiredRuntime"), 0) + " min" : "\u672A\u914D\u7F6E")}${fieldStat("load", "\u5F53\u524D\u8D1F\u8F7D", 0)}</div>`);
    text("electronics-meta", "\u5B9E\u65F6\u70B9\u4F4D");
    const capacitor = n("capacitor");
    html("electronics-body", `<div class="stat-grid stat-grid--electronics">${stat("\u9006\u53D8\u5668\u8F93\u51FA", `${metric("inverterVoltage")} / ${metric("inverterFrequency", 2)}`, status("inverterVoltage"))}${fieldStat("thd", "\u8F93\u51FA THD")}${fieldStat("rectifier", "\u6574\u6D41\u5668 / \u5145\u7535\u5668")}${fieldStat("fan", "\u51B7\u5374\u98CE\u673A")}</div><div class="mini-gauge"><span class="mini-gauge__label">\u7535\u5BB9\u5065\u5EB7\u5EA6</span><div class="mini-gauge__track"><div class="mini-gauge__fill" style="width:${capacitor == null ? 0 : Math.max(0, Math.min(100, capacitor))}%"></div></div><strong class="mini-gauge__value">${capacitor == null ? "\u2014" : numberText(capacitor, 0) + "%"}</strong></div>`);
    text("environment-meta", "\u673A\u623F\u4F20\u611F\u5668");
    html("environment-body", `<div class="stat-grid">${fieldStat("ambientTemp", "\u73AF\u5883\u6E29\u5EA6")}${fieldStat("humidity", "\u76F8\u5BF9\u6E7F\u5EA6", 0)}${fieldStat("airQuality", "\u7A7A\u6C14\u8D28\u91CF")}${stat("\u6F0F\u6C34\u68C0\u6D4B", point("water") ? scalar(point("water"), "curVal") === false ? "\u5E72\u71E5" : scalar(point("water"), "curVal") === true ? "\u68C0\u6D4B\u5230\u6F0F\u6C34" : "\u672A\u77E5" : "\u672A\u914D\u7F6E", status("water"))}</div><p class="panel-note">${escapeHtml(isDemo() ? "\u6A21\u62DF\u5FEB\u7167\u65F6\u95F4" : "\u6570\u636E\u66F4\u65B0\u65F6\u95F4")} ${escapeHtml(formatTime(value(point("ambientTemp"), "upsObservedAt"), state.tz, false))}</p>`);
    text("transfer-meta", "\u4F9B\u7535\u8FDE\u7EED\u6027");
    const transferAt = value(point("transferDuration"), "upsLastTransferAt") ?? value(point("transfer"), "upsLastTransferAt") ?? value(state.equip, "upsLastTransferAt");
    html("transfer-body", `<div class="stat-grid">${fieldStat("transfer", "\u8F6C\u6362\u5F00\u5173")}${stat("\u7EF4\u62A4\u65C1\u8DEF", point("bypass") ? scalar(point("bypass"), "curVal") === true ? "\u53EF\u7528" : "\u4E0D\u53EF\u7528" : "\u672A\u914D\u7F6E", status("bypass"))}${fieldStat("transferDuration", "\u6700\u8FD1\u8F6C\u6362\u8017\u65F6", 0)}${stat("\u6700\u8FD1\u8F6C\u6362\u65F6\u95F4", formatTime(transferAt, state.tz))}</div><p class="panel-note">\u6240\u6709\u8BBE\u5907\u63A7\u5236\u70B9\u4FDD\u6301\u53EA\u8BFB</p>`);
    text("predictive-meta", isDemo() ? "\u6A21\u62DF\u5065\u5EB7\u8BC4\u4F30" : "\u6700\u65B0\u5065\u5EB7\u8BC4\u4F30");
    html("predictive-body", state.assessment ? `<ul class="predict-list">${state.risks.map((risk) => {
      const recommendation = state.recommendations.get(ref(risk))?.[0], level = scalar(risk, "upsRiskLevel");
      return `<li><i class="predict-list__dot risk-${escapeHtml(level ?? "unknown")}" aria-hidden="true"></i><span class="predict-list__label">${escapeHtml(dis(risk))}</span><span class="predict-list__value">${escapeHtml(recommendation ? dis(recommendation) : "\u5C1A\u65E0\u7EF4\u62A4\u5EFA\u8BAE")}</span></li>`;
    }).join("") || '<li class="empty-state">\u5C1A\u65E0\u7EF4\u62A4\u5EFA\u8BAE</li>'}</ul><span class="assessment-badge status-${isDemo() ? "info" : "ok"}">${escapeHtml(scalar(state.assessment, "upsRuleVersion") ?? "\u89C4\u5219\u7248\u672C\u672A\u63D0\u4F9B")} \xB7 ${isDemo() ? "\u6A21\u62DF\u8BC4\u4F30" : "\u5DF2\u8BC4\u4F30"}</span>` : '<div class="empty-state">\u5C1A\u65E0\u5065\u5EB7\u8BC4\u4F30\u4E0E\u7EF4\u62A4\u5EFA\u8BAE</div>');
  }
  function renderAlarms() {
    const open = state.alarms.filter((a) => scalar(a, "upsAlarmState") === "open").length;
    text("alarm-count", `${open} \u4E2A\u5F85\u786E\u8BA4`);
    html("alarm-list", state.alarms.length ? sortAlarms(state.alarms).map((alarm) => {
      const level = scalar(alarm, "upsRiskLevel"), stage = scalar(alarm, "upsAlarmState");
      return `<div class="alarm-row${stage === "acknowledged" ? " is-ack" : ""}"><span class="alarm-row__level status-${severityClass[level] ?? "unknown"}">${escapeHtml({ info: "\u63D0\u793A", warning: "\u8B66\u544A", critical: "\u4E25\u91CD", unknown: "\u672A\u77E5" }[level] ?? level ?? "\u672A\u77E5")}</span><span class="alarm-row__text">${escapeHtml(dis(alarm))}</span><time class="alarm-row__time">${escapeHtml(formatTime(value(alarm, "raisedAt"), state.tz))}</time>${stage === "open" ? `<button type="button" class="alarm-row__action" data-ack-ref="${escapeHtml(ref(alarm))}">\u786E\u8BA4\u544A\u8B66</button>` : `<span class="alarm__acked" aria-disabled="true">${escapeHtml({ acknowledged: "\u5DF2\u786E\u8BA4", inProgress: "\u5904\u7F6E\u4E2D", resolved: "\u5DF2\u6062\u590D" }[stage] ?? stage)}</span>`}</div>`;
    }).join("") : '<div class="empty-state">\u5F53\u524D\u8BBE\u5907\u6CA1\u6709\u6D3B\u52A8 UPS \u544A\u8B66</div>');
  }
  async function readAssessment(equip, version) {
    const assessment = first(await evaluate(`${isDemo(equip) ? "upsDemoAssessment" : "upsLatestAssessment"}(${axonRef(ref(equip))})`));
    if (!state.selection.current(version)) return;
    state.assessment = assessment;
    state.risks = [];
    state.recommendations = /* @__PURE__ */ new Map();
    if (assessment) {
      const risks = orderRisks(assessment, gridRows(await evaluate(`upsAssessmentRiskItems(${axonRef(ref(assessment))})`))), results = await Promise.allSettled(risks.map((r) => evaluate(`upsRiskRecommendations(${axonRef(ref(r))})`)));
      if (!state.selection.current(version)) return;
      state.risks = risks;
      state.recommendations = recommendationsByRisk(results.map((result, index) => ({ riskRef: ref(risks[index]), rows: result.status === "fulfilled" ? gridRows(result.value) : [] })));
    }
    if (state.selection.current(version)) {
      renderHero();
      renderPanels();
    }
  }
  async function readAlarms(version) {
    const equipId = ref(state.equip), alarms = gridRows(await evaluate(`upsActiveAlarms({equipRef:${axonRef(equipId)}})`));
    if (state.selection.current(version)) {
      state.alarms = alarms;
      renderAlarms();
    }
  }
  async function readSparklines(version) {
    const points = ["capacity", "load"].map((field) => point(field)).filter(Boolean), range = rangeBounds("24h");
    const results = await historyResults(points, async (p) => parseHistory(await evaluate(historyExpression(ref(p), range))));
    if (!state.selection.current(version)) return;
    results.forEach((result, i) => state.histories.set(ref(points[i]), result.status === "fulfilled" ? { series: result.value } : { error: errorMessage(result.reason) }));
    renderPanels();
  }
  async function selectEquipment(id) {
    const equip = state.equips.find((e) => ref(e) === id);
    if (!equip) return;
    const version = state.selection.next();
    state.selectionVersion = version;
    state.historyGate.next();
    if ($("history-dialog")?.open) $("history-dialog").close();
    state.equip = equip;
    state.points = [];
    state.alarms = [];
    state.assessment = null;
    state.risks = [];
    state.recommendations = /* @__PURE__ */ new Map();
    state.histories.clear();
    setTimezone();
    renderTabs();
    renderHero();
    renderPanels();
    renderAlarms();
    announce(`\u6B63\u5728\u8BFB\u53D6 ${dis(equip)}`);
    const results = await Promise.allSettled([evaluate(`upsEquipSummary(${axonRef(id)})`), evaluate(`upsEquipPoints(${axonRef(id)})`)]);
    if (!state.selection.current(version)) return;
    if (results[0].status === "fulfilled") state.equip = first(results[0].value) ?? equip;
    if (results[1].status === "fulfilled") state.points = gridRows(results[1].value);
    results.filter((r) => r.status === "rejected").forEach((r) => showError(r.reason));
    state.modes.set(id, scalar(point("mode"), "curVal"));
    setTimezone();
    renderTabs();
    renderHero();
    renderPanels();
    const related = await Promise.allSettled([readAssessment(state.equip, version), readAlarms(version), readSparklines(version)]);
    if (!state.selection.current(version)) return;
    related.filter((r) => r.status === "rejected").forEach((r) => showError(r.reason));
    announce(`${dis(state.equip)} \u5DF2\u52A0\u8F7D${isDemo() ? "\uFF0C\u5F53\u524D\u4E3A\u6A21\u62DF\u6570\u636E" : ""}`);
  }
  async function loadTree() {
    const [sites, equips] = await Promise.all([evaluate("upsSites()"), evaluate("upsEquips()")]);
    state.sites = gridRows(sites);
    state.equips = gridRows(equips).sort((a, b) => String(dis(a)).localeCompare(String(dis(b))));
    const floorResults = await Promise.allSettled(state.sites.map((site) => evaluate(`upsFloors(${axonRef(ref(site))})`)));
    state.floors = floorResults.flatMap((r) => r.status === "fulfilled" ? gridRows(r.value) : []);
    const selection = resolveTreeSelection(state.equips, ref(state.equip));
    if (selection.equip) {
      const selected = ref(selection.equip);
      if (selection.preserve) {
        const version = state.selectionVersion;
        const results = await Promise.allSettled([refreshTelemetry(), readAssessment(state.equip, version), readAlarms(version), readSparklines(version)]);
        results.filter((result) => result.status === "rejected").forEach((result) => showError(result.reason));
        setTimezone();
      } else await selectEquipment(selected);
      const others = state.equips.filter((e) => ref(e) !== selected), modes = await Promise.allSettled(others.map((e) => evaluate(`upsEquipPoints(${axonRef(ref(e))})`)));
      modes.forEach((result, i) => {
        if (result.status === "fulfilled") {
          const p = selectPoint(gridRows(result.value), "mode").point;
          state.modes.set(ref(others[i]), pointQuality(p).state === "valid" ? scalar(p, "curVal") : null);
        }
      });
      renderTabs();
    } else {
      if (state.equip) {
        state.selectionVersion = state.selection.next();
        state.historyGate.next();
        if ($("history-dialog")?.open) $("history-dialog").close();
      }
      state.equip = null;
      state.points = [];
      state.alarms = [];
      state.assessment = null;
      state.risks = [];
      state.recommendations = /* @__PURE__ */ new Map();
      state.histories.clear();
      setTimezone();
      renderTabs();
      renderHero();
      renderPanels();
      renderAlarms();
    }
  }
  async function refreshTelemetry() {
    if (!state.equip || state.telemetryBusy || document.hidden) return;
    state.telemetryBusy = true;
    const version = state.selectionVersion, id = ref(state.equip);
    try {
      const results = await Promise.allSettled([evaluate(`upsEquipSummary(${axonRef(id)})`), evaluate(`upsEquipPoints(${axonRef(id)})`)]);
      if (!state.selection.current(version)) return;
      if (results[0].status === "fulfilled") state.equip = first(results[0].value) ?? state.equip;
      if (results[1].status === "fulfilled") state.points = gridRows(results[1].value);
      renderHero();
      renderPanels();
      results.filter((r) => r.status === "rejected").forEach((r) => showError(r.reason));
    } finally {
      state.telemetryBusy = false;
    }
  }
  function chartSvg(lines, small = false) {
    const width = small ? 360 : 900, height = small ? 58 : 300, pad = small ? { l: 2, r: 2, t: 5, b: 5 } : { l: 64, r: 20, t: 22, b: 42 }, valid = lines.flatMap((l) => l.series.filter((p) => p.valid));
    if (!valid.length) return '<span class="empty-state">\u6240\u9009\u8303\u56F4\u6CA1\u6709\u6709\u6548\u5386\u53F2\u6570\u636E</span>';
    let min = Infinity, max = -Infinity, minTime = Infinity, maxTime = -Infinity;
    for (const p of valid) {
      min = Math.min(min, p.value);
      max = Math.max(max, p.value);
      minTime = Math.min(minTime, p.time);
      maxTime = Math.max(maxTime, p.time);
    }
    const space = max - min || Math.max(1, Math.abs(max) * 0.02);
    min -= space * 0.15;
    max += space * 0.15;
    const x = (t) => pad.l + (t - minTime) / (maxTime - minTime || 1) * (width - pad.l - pad.r), y = (v) => height - pad.b - (v - min) / (max - min) * (height - pad.t - pad.b);
    let axes = "";
    if (!small) {
      for (let i = 0; i < 5; i++) {
        const v = min + (max - min) * i / 4, yy = y(v);
        axes += `<line x1="${pad.l}" x2="${width - pad.r}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${pad.l - 10}" y="${yy + 4}" text-anchor="end">${numberText(v, 1)}</text>`;
      }
      for (let i = 0; i < 4; i++) {
        const t = minTime + (maxTime - minTime) * i / 3;
        axes += `<text x="${x(t)}" y="${height - 12}" text-anchor="middle">${escapeHtml(formatTime(t, state.tz, false).slice(0, 5))}</text>`;
      }
    }
    const paths = lines.map((line) => {
      const segments = chartSegments(line.series), series = segments.flat();
      return segments.map((part) => `<polyline points="${part.map((p) => `${x(p.time).toFixed(2)},${y(p.value).toFixed(2)}`).join(" ")}" fill="none" stroke="${line.color}" stroke-width="${small ? 1.9 : 2.3}" stroke-linejoin="round" stroke-linecap="round"/>`).join("") + (!small ? series.map((p) => `<circle cx="${x(p.time)}" cy="${y(p.value)}" r="3" fill="${line.color}" tabindex="0"><title>${escapeHtml(line.name)} \xB7 ${escapeHtml(formatTime(p.time, state.tz))} \xB7 ${escapeHtml(numberText(p.value, 2))}</title></circle>`).join("") : "");
    }).join("");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${small ? "\u5386\u53F2\u8D8B\u52BF" : "\u5386\u53F2\u6298\u7EBF\u56FE\uFF0C\u6570\u503C\u7EDF\u8BA1\u89C1\u56FE\u8868\u4E0B\u65B9"}" preserveAspectRatio="${small ? "none" : "xMidYMid meet"}" style="width:100%;height:${small ? "100%" : "auto"};fill:var(--text-muted);font:11px var(--font-mono)">${axes}${paths}</svg>`;
  }
  function historyLabel() {
    return state.historyField === "capacity" ? "\u7535\u6C60\u5BB9\u91CF" : "\u5F53\u524D\u8D1F\u8F7D\u7387";
  }
  async function updateHistory() {
    const token = state.historyGate.next(), equipId = ref(state.equip);
    if (!equipId) return;
    let range;
    try {
      range = rangeBounds(state.historyRange, Date.now(), state.historyCustom ?? {});
    } catch (error) {
      historyError(error);
      return;
    }
    if ($("history-error")) $("history-error").hidden = true;
    html("history-chart", '<div class="empty-state">\u6B63\u5728\u8BFB\u53D6\u5386\u53F2\u6570\u636E\u2026</div>');
    text("history-range-label", `${formatTime(range.start, state.tz)} \u2014 ${formatTime(range.end, state.tz)} \xB7 ${state.tz} \xB7 \u7ED3\u675F\u65F6\u95F4\u4E0D\u542B`);
    const points = state.points.filter((p) => state.historySelected.includes(ref(p)) && scalar(p, "unit") === state.historyUnit);
    if (!points.length) {
      historyError(Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u540C\u5355\u4F4D\u70B9\u4F4D"));
      return;
    }
    const results = await historyResults(points, async (p) => parseHistory(await evaluate(historyExpression(ref(p), range))));
    if (!state.historyGate.current(token) || equipId !== ref(state.equip)) return;
    const colors = ["var(--ok)", "var(--info)", "var(--warn)", "var(--crit)"], lines = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") lines.push({ series: result.value, color: colors[i % colors.length], name: dis(points[i]), point: points[i] });
    });
    html("history-chart", lines.length ? chartSvg(lines) : '<div class="empty-state">\u6240\u9009\u70B9\u4F4D\u7684\u5386\u53F2\u8BFB\u53D6\u5747\u5931\u8D25</div>');
    html("history-legend", results.map((result, i) => `<span style="color:${colors[i % colors.length]}">${escapeHtml(dis(points[i]))}${result.status === "rejected" ? " \xB7 \u8BFB\u53D6\u5931\u8D25" : result.value.length ? "" : " \xB7 \u65E0\u6570\u636E"}</span>`).join(""));
    html("history-stats", lines.map((line) => {
      const stats = historyStats(line.series);
      return [["\u6700\u65B0", stats.latest], ["\u6700\u5C0F", stats.min], ["\u6700\u5927", stats.max], ["\u5E73\u5747", stats.average], ["\u6837\u672C\u6570", stats.count]].map(([label, v]) => `<div><span>${escapeHtml(line.name)} \xB7 ${label}</span><strong>${v == null ? "\u2014" : numberText(v, label === "\u6837\u672C\u6570" ? 0 : 2)}${label === "\u6837\u672C\u6570" ? "" : " " + escapeHtml(state.historyUnit)}</strong>${label === "\u6837\u672C\u6570" ? `<span>${stats.excluded ? "\u53E6\u6709 " + stats.excluded + " \u6761\u8D28\u91CF\u5F02\u5E38\u6216\u7F3A\u5931" : "\u6837\u672C\u5747\u6709\u6548"}</span>` : ""}</div>`).join("");
    }).join(""));
    if (results.some((r) => r.status === "rejected")) historyError(Error(lines.length ? "\u90E8\u5206\u70B9\u4F4D\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u4FDD\u7559\u6210\u529F\u5E8F\u5217" : "\u5386\u53F2\u63A5\u53E3\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"));
    announce("\u5386\u53F2\u6570\u636E\u5DF2\u66F4\u65B0");
  }
  function historyError(error) {
    text("history-error", errorMessage(error));
    if ($("history-error")) $("history-error").hidden = false;
    announce(errorMessage(error));
  }
  var historyTrigger = null;
  function openHistory(field, trigger) {
    const p = point(field);
    if (!p) return;
    historyTrigger = trigger;
    state.historyField = field;
    state.historyUnit = scalar(p, "unit");
    state.historySelected = [ref(p)];
    state.historyRange = "24h";
    text("history-title", `${historyLabel()}\u5386\u53F2`);
    text("history-subtitle", `${dis(state.equip)} \xB7 ${path()}${isDemo() ? " \xB7 \u6A21\u62DF\u6570\u636E" : ""}`);
    html("history-point-select", state.points.filter((item) => has(item, "his") && scalar(item, "unit") === state.historyUnit).map((item) => `<option value="${escapeHtml(ref(item))}"${ref(item) === ref(p) ? " selected" : ""}>${escapeHtml(dis(item))}</option>`).join(""));
    $("history-custom-range").hidden = true;
    document.querySelectorAll("#history-ranges [data-range]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.range === "24h");
      button.setAttribute("aria-pressed", String(button.dataset.range === "24h"));
    });
    $("history-dialog").showModal();
    updateHistory().catch(historyError);
  }
  var storage;
  try {
    storage = localStorage;
  } catch {
  }
  var theme = applyTheme(readTheme(storage));
  $("theme-toggle")?.addEventListener("click", () => {
    theme = applyTheme(setTheme(theme === "light" ? "dark" : "light", storage));
  });
  $("fleet-tabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-equip-ref]");
    if (button) {
      clearError();
      selectEquipment(button.dataset.equipRef).catch(showError);
    }
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history]");
    if (button) openHistory(button.dataset.history, button);
  });
  $("alarm-list")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-ack-ref]");
    if (!button) return;
    const alarm = state.alarms.find((a) => ref(a) === button.dataset.ackRef);
    if (!alarm) return;
    button.disabled = true;
    button.textContent = "\u6B63\u5728\u786E\u8BA4\u2026";
    const equipId = ref(state.equip);
    try {
      await alarmAck(alarm, evaluate, async () => {
        if (ref(state.equip) === equipId) {
          state.alarms = gridRows(await evaluate(`upsActiveAlarms({equipRef:${axonRef(equipId)}})`));
          renderAlarms();
        }
      });
      if (ref(state.equip) === equipId) {
        state.alarms = gridRows(await evaluate(`upsActiveAlarms({equipRef:${axonRef(equipId)}})`));
        renderAlarms();
      }
      announce("\u544A\u8B66\u5DF2\u786E\u8BA4");
    } catch (error) {
      showError(error);
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = "\u786E\u8BA4\u544A\u8B66";
      }
    }
  });
  for (const id of ["refresh-data", "retry-load"]) $(id)?.addEventListener("click", () => {
    clearError();
    loadTree().catch(showError);
  });
  $("history-close")?.addEventListener("click", () => $("history-dialog").close());
  $("history-dialog")?.addEventListener("close", () => {
    state.historyGate.next();
    historyTrigger?.focus();
  });
  $("history-dialog")?.addEventListener("click", (event) => {
    if (event.target === $("history-dialog")) {
      const r = $("history-dialog").getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $("history-dialog").close();
    }
  });
  $("history-ranges")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-range]");
    if (!button) return;
    state.historyRange = button.dataset.range;
    document.querySelectorAll("#history-ranges [data-range]").forEach((node) => {
      node.classList.toggle("is-active", node === button);
      node.setAttribute("aria-pressed", String(node === button));
    });
    $("history-custom-range").hidden = state.historyRange !== "custom";
    if (state.historyRange !== "custom") updateHistory().catch(historyError);
    else if (!$("history-start").value) {
      const p = new Intl.DateTimeFormat("en-CA", { timeZone: state.tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }), local = (t) => {
        const x = Object.fromEntries(p.formatToParts(t).map((i) => [i.type, i.value]));
        return `${x.year}-${x.month}-${x.day}T${x.hour}:${x.minute}`;
      };
      $("history-start").value = local(Date.now() - 864e5);
      $("history-end").value = local(Date.now());
    }
  });
  $("history-apply")?.addEventListener("click", () => {
    try {
      state.historyCustom = { start: customEpoch($("history-start").value, state.tz), end: customEpoch($("history-end").value, state.tz) };
      updateHistory().catch(historyError);
    } catch (error) {
      historyError(error);
    }
  });
  $("history-point-select")?.addEventListener("change", (event) => {
    state.historySelected = Array.from(event.target.selectedOptions).map((o) => o.value);
    updateHistory().catch(historyError);
  });
  $("history-refresh")?.addEventListener("click", () => updateHistory().catch(historyError));
  function clock() {
    text("clock", formatClock(Date.now(), state.tz));
  }
  async function start() {
    state.project = projectName();
    if (!state.project) throw Error("\u65E0\u6CD5\u786E\u5B9A FIN \u9879\u76EE\uFF0C\u8BF7\u4ECE FIN \u9879\u76EE\u83DC\u5355\u6253\u5F00 upsNew");
    state.client = new Client({ base: new URL(`${location.origin}/`), project: state.project, options: { headers: { accept: "text/zinc" } } });
    await loadTree();
    clock();
  }
  setInterval(clock, 1e3);
  var elapsed = 0;
  setInterval(() => {
    if (document.hidden || !state.client) return;
    elapsed += 15;
    refreshTelemetry().catch(showError);
    if (elapsed % 30 === 0 && state.equip) readAlarms(state.selectionVersion).catch(showError);
    if (elapsed % 60 === 0 && state.equip) readSparklines(state.selectionVersion).catch(showError);
    if (elapsed % 300 === 0) loadTree().catch(showError);
  }, 15e3);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.client) refreshTelemetry().catch(showError);
  });
  start().catch((error) => {
    text("connection-status", "FIN \u8FDE\u63A5\u5931\u8D25");
    showError(error);
  });
})();
