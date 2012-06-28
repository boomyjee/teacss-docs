(function(root, factory) {
  if (typeof exports !== 'undefined') {
    exports.Liquid = factory();
  } else if (typeof define === 'function' && define.amd) {
    define('liquid', [], factory);
  } else {
    root.Liquid = factory();
  }
}(this, function () {

  var Liquid = {

    author: 'M@ McCray <darthapo@gmail.com>',
    version: '1.2.1',

    readTemplateFile: function(path) {
      throw ("This liquid context does not allow includes.");
    },

    registerFilters: function(filters) {
      Liquid.Template.registerFilter(filters);
    },

    parse: function(src) {
      return Liquid.Template.parse(src);
    }

  };

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement) {
    "use strict";
    var
      t = this,
      length = t.length,
      i = 0
    ;

    while (i < length) {
      if (t[i] === searchElement) {
        return i;
      }
      i++;
    }
    return -1;
  };
}

if (!Array.prototype.include) {
  Array.prototype.include = function (arg) {
    return !!~this.indexOf(arg);
  };
}

if (!Array.prototype.clear) {
  Array.prototype.clear = function () {
    this.length = 0;
  };
}

if (!Array.prototype.map) {
  Array.prototype.map = function (fun, context) {
    "use strict";
    if (typeof fun !== 'function') {
      throw new TypeError(fun + ' is not a function');
    }

    var
      len = this.length,
      res = new Array(len),
      thisp = context || this,
      i
    ;
    for (i = 0; i < len; i++) {
      if (typeof this[i] !== 'undefined') {
        res[i] = fun.call(thisp, this[i], i, this);
      }
    }

    return res;
  };
}

if (!Array.prototype.first) {
  Array.prototype.first = function () {
    return this[0];
  };
}

if (!Array.prototype.last) {
  Array.prototype.last = function () {
    return this[this.length - 1];
  };
}

if (!Array.prototype.flatten) {
  Array.prototype.flatten = function () {
    "use strict";
    var
      len = this.length,
      arr = [],
      i
    ;
    for (i = 0; i < len; i++) {
      if (this[i] instanceof Array) {
        arr = arr.concat(this[i]);
      } else {
        arr.push(this[i]);
      }
    }

    return arr;
  };
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fun, context) {
    "use strict";
    if (typeof fun !== 'function') {
      throw new TypeError(fun + ' is not a function');
    }

    var
      len = this.length,
      thisp = context || this,
      i
    ;
    for (i = 0; i < len; i++) {
      if (typeof this[i] !== 'undefined') {
        fun.call(thisp, this[i], i, this);
      }
    }

    return null;
  };
}

if (!String.prototype.capitalize) {
  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}


Liquid.extensions = {};
Liquid.extensions.object = {};

Liquid.extensions.object.update = function (newObj) {
  var p;
  for (p in newObj) {
    this[p] = newObj[p];
  }

  return this;
};
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
var Class;
(function(){
  var
    initializing = false,
    fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/
  ;

  Class = function(){};

  Class.extend = function(prop) {
    var _super = this.prototype;

    initializing = true;
    var prototype = new this();
    initializing = false;

    for (var name in prop) {
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            this._super = _super[name];

            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    function Klass() {
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    Klass.prototype = prototype;

    Klass.prototype.constructor = Klass;

    Klass.extend = arguments.callee;

    return Klass;
  };
})();

Liquid.Tag = Class.extend({

  init: function(tagName, markup, tokens) {
    this.tagName = tagName;
    this.markup = markup;
    this.nodelist = this.nodelist || [];
    this.parse(tokens);
  },

  parse: function(tokens) {
  },

  render: function(context) {
    return '';
  }

});
Liquid.Block = Liquid.Tag.extend({

  init: function (tagName, markup, tokens) {
    this.blockName = tagName;
    this.blockDelimiter = 'end' + this.blockName;
    this._super(tagName, markup, tokens);
  },

  parse: function (tokens) {
    if (!this.nodelist) {
      this.nodelist = [];
    }
    this.nodelist.clear();

    var
      token = tokens.shift(),
      tagParts
    ;
    tokens.push('');
    while (tokens.length) {

      if (/^\{\%/.test(token)) {
        tagParts = token.match(/^\{\%\s*(\w+)\s*(.*)?\%\}$/);

        if (tagParts) {
          if (this.blockDelimiter == tagParts[1]) {
            this.endTag();
            return;
          }
          if (tagParts[1] in Liquid.Template.tags) {
            this.nodelist.push( new Liquid.Template.tags[tagParts[1]]( tagParts[1], tagParts[2], tokens ) );
          } else {
            this.unknownTag(tagParts[1], tagParts[2], tokens);
          }
        } else {
          throw "Tag '" + token + "' was not properly terminated with: %}";
        }
      } else if (/^\{\{/.test(token)) {
        this.nodelist.push(this.createVariable(token));
      } else {
        this.nodelist.push(token);
      } // Ignores tokens that are empty
      token = tokens.shift();
    }

    this.assertMissingDelimitation();
  },

  endTag: function () {},

  unknownTag: function (tag, params, tokens) {
    switch (tag) {
    case 'else':
      throw this.blockName + " tag does not expect else tag";
      break;
    case 'end':
      throw "'end' is not a valid delimiter for " + this.blockName + " tags. use " + this.blockDelimiter;
      break;
    default:
      throw 'Unknown tag: ' + tag;
    }
  },

  createVariable: function (token) {
    var match = token.match(/^\{\{(.*)\}\}$/);
    if (match) {
      return new Liquid.Variable(match[1]);
    } else {
      throw "Variable '" + token + "' was not properly terminated with: }}";
    }
  },

  render: function (context) {
    return this.renderAll(this.nodelist, context);
  },

  renderAll: function (list, context) {
    return (list || []).map(function (token, i) {
      var output = '';
      try {
        output = token.render ? token.render(context) : token;
      } catch (e) {
        output = context.handleError(e);
      }
      return output;
    });
  },

  assertMissingDelimitation: function () {
    throw this.blockName + " tag was never closed";
  }
});
Liquid.Document = Liquid.Block.extend({

  init: function(tokens){
    this.blockDelimiter = []; // [], really?
    this.parse(tokens);
  },

  assertMissingDelimitation: function() {
  }
});
Liquid.Strainer = Class.extend({

  init: function(context) {
    this.context = context;
  },

  respondTo: function(methodName) {
    methodName = methodName.toString();
    if (methodName.match(/^__/)) return false;
    if (Liquid.Strainer.requiredMethods.include(methodName)) return false;
    return (methodName in this);
  }
});

Liquid.Strainer.filters = {};

Liquid.Strainer.globalFilter = function(filters) {
  for (var f in filters) {
    Liquid.Strainer.filters[f] = filters[f];
  }
}

Liquid.Strainer.requiredMethods = ['respondTo', 'context'];

Liquid.Strainer.create = function(context) {
  var strainer = new Liquid.Strainer(context);
  for (var f in Liquid.Strainer.filters) {
    strainer[f] = Liquid.Strainer.filters[f];
  }
  return strainer;
}
Liquid.Context = Class.extend({

  init: function (assigns, registers, rethrowErrors) {
    this.scopes = [ assigns ? assigns : {} ];
    this.registers = registers ? registers : {};
    this.errors = [];
    this.rethrowErrors = rethrowErrors;
    this.strainer = Liquid.Strainer.create(this);
  },

  get: function (varname) {
    return this.resolve(varname);
  },

  set: function (varname, value) {
    this.scopes[0][varname] = value;
  },

  hasKey: function (key) {
    return (this.resolve(key)) ? true : false;
  },

  push: function () {
    var scpObj = {};
    this.scopes.unshift(scpObj);
    return scpObj; // Is this right?
  },

  merge: function (newScope) {
    return Liquid.extensions.object.update.call(this.scopes[0], newScope);
  },

  pop: function () {
    if (this.scopes.length === 1) {
      throw "Context stack error";
    }
    return this.scopes.shift();
  },

  stack: function (lambda, bind) {
    var result = null;
    this.push();
    try {
      result = lambda.apply(bind ? bind : this.strainer);
    } finally {
      this.pop();
    }
    return result;
  },

  invoke: function (method, args) {
    if (this.strainer.respondTo(method)) {
      var result = this.strainer[method].apply(this.strainer, args);
      return result;
    } else {
      return (args.length === 0) ? null : args[0]; // was: $pick
    }
  },

  resolve: function (key) {
    switch (key) {
    case null:
    case 'nil':
    case 'null':
    case '':
      return null;

    case 'true':
      return true;

    case 'false':
      return false;

    case 'blank':
    case 'empty':
      return '';

    default:
      if ((/^'(.*)'$/).test(key)) {
        return key.replace(/^'(.*)'$/, '$1');
      }
      else if ((/^"(.*)"$/).test(key)) {
        return key.replace(/^"(.*)"$/, '$1');
      }
      else if ((/^(\d+)$/).test(key)) {
        return parseInt( key.replace(/^(\d+)$/ , '$1'), 10 );
      }
      else if ((/^(\d[\d\.]+)$/).test(key)) {
        return parseFloat( key.replace(/^(\d[\d\.]+)$/, '$1') );
      }
      else if ((/^\((\S+)\.\.(\S+)\)$/).test(key)) {
        var range = key.match(/^\((\S+)\.\.(\S+)\)$/),
            left  = parseInt(range[1], 10),
            right = parseInt(range[2], 10),
            arr   = [],
            limit;
        if (isNaN(left) || isNaN(right)) {
          left = range[1].charCodeAt(0);
          right = range[2].charCodeAt(0);

          limit = right - left + 1;
          for (var i = 0; i < limit; i++) {
            arr.push(String.fromCharCode(i + left));
          }
        } else { // okay to make array
          limit = right - left + 1;
          for (var i = 0; i < limit; i++) {
            arr.push(i + left);
          }
        }
        return arr;
      } else {
        var result = this.variable(key);
        return result;
      }
    }
  },

  findVariable: function (key) {
    var
      scope,
      variable,
      i,
      numScopes = this.scopes.length
    ;
    for (i = 0; i < numScopes; i++) {
      scope = this.scopes[i];
      if( scope && typeof(scope[key]) !== 'undefined' ) {
        variable = scope[key];
        if (typeof(variable) === 'function') {
          variable = variable.apply(this);
          scope[key] = variable;
        }
        if (variable && typeof(variable) === 'object') {
          if (variable.toLiquid) {
            variable = variable.toLiquid();
          }
          if (variable.setContext) {
            variable.setContext(this);
          }
        }
        return variable;
      }
    }
    return null;
  },

  variable: function (markup) {
    if (typeof markup !== 'string') {
      return null;
    }

    var
      self        = this,
      parts       = markup.match( /\[[^\]]+\]|(?:[\w\-]\??)+/g ),
      firstPart   = parts.shift(),
      squareMatch = firstPart.match(/^\[(.*)\]$/),
      object
    ;

    if (squareMatch) {
      firstPart = this.resolve( squareMatch[1] );
    }

    object = this.findVariable(firstPart);

    if (object) {
      parts.forEach(function (part) {
        var squareMatch = part.match(/^\[(.*)\]$/);
        if (squareMatch) {
          var part = self.resolve( squareMatch[1] );
          if (typeof(object[part]) === 'function') {
            object[part] = object[part].apply(this);
          }
          object = object[part];
          if (object != null && typeof(object) === 'object' && object.toLiquid) {
            object = object.toLiquid();
          }
        } else {
          if ( typeof(object) === 'object' && (part in object) ) {
            var res = object[part];
            if (typeof(res) === 'function') {
              res = object[part] = res.apply(self);
            }
            if ( res != null && typeof(res) === 'object' && res.toLiquid ) {
              object = res.toLiquid();
            } else {
              object = res;
            }
          }
          else if ( (/^\d+$/).test(part) ) {
            var index = parseInt(part, 10);
            if (typeof(object[index]) === 'function') {
              object[index] = object[index].apply(self);
            }
            if ( object[index] != null && typeof(object[index]) === 'object' && object[index].toLiquid ) {
              object = object[index].toLiquid();
            } else {
              object = object[index];
            }
          }
          else if ( object && typeof(object[part]) === 'function' && ['length', 'size', 'first', 'last'].include(part) ) {
            object = object[part].apply(part);
            if (object.toLiquid) {
              object = object.toLiquid();
            }
          }
          else {
            object = null;
          }
          if (object != null && typeof(object) === 'object' && object.setContext) {
            object.setContext(self);
          }
        }
      });
    }
    return object;
  },

  addFilters: function (filters) {
    filters = filters.flatten();
    filters.forEach(function (f) {
      if (typeof f !== 'object') {
        throw 'Expected object but got: ' + typeof f;
      }
      this.strainer.addMethods(f);
    });
  },

  handleError: function (err) {
    this.errors.push(err);
    if (this.rethrowErrors) {
      throw err;
    }
    return "Liquid error: " + (err.message ? err.message : (err.description ? err.description : err));
  }

});
Liquid.Template = Class.extend({

  init: function() {
    this.root = null;
    this.registers = {};
    this.assigns = {};
    this.errors = [];
    this.rethrowErrors = false;
  },

  parse: function(src) {
    this.root = new Liquid.Document( Liquid.Template.tokenize(src) );
    return this;
  },

  render: function() {
    if(!this.root){ return ''; }
    var args = {
      ctx: arguments[0],
      filters: arguments[1],
      registers: arguments[2]
    }
    var context = null;

    if(args.ctx instanceof Liquid.Context ) {
      context = args.ctx;
      this.assigns = context.assigns;
      this.registers = context.registers;
    } else {
      if(args.ctx){
        Liquid.extensions.object.update.call(this.assigns, args.ctx);
      }
      if(args.registers){
        Liquid.extensions.object.update.call(this.registers, args.registers);
      }
      context = new Liquid.Context(this.assigns, this.registers, this.rethrowErrors)
    }

    if(args.filters){ context.addFilters(arg.filters); }

    try {
      return this.root.render(context).join('');
    } finally {
      this.errors = context.errors;
    }
  },

  renderWithErrors: function() {
    var savedRethrowErrors = this.rethrowErrors;
    this.rethrowErrors = true;
    var res = this.render.apply(this, arguments);
    this.rethrowErrors = savedRethrowErrors;
    return res;
  }
});


Liquid.Template.tags = {};

Liquid.Template.registerTag = function(name, klass) {
  Liquid.Template.tags[ name ] = klass;
}

Liquid.Template.registerFilter = function(filters) {
  Liquid.Strainer.globalFilter(filters)
}

Liquid.Template.tokenize = function(src) {
  var tokens = src.split( /(\{\%.*?\%\}|\{\{.*?\}\}?)/ );
  if(tokens[0] == ''){ tokens.shift(); }
  return tokens;
}


Liquid.Template.parse =  function(src) {
  return (new Liquid.Template()).parse(src);
}
Liquid.Variable = Class.extend({

  init: function(markup) {
    this.markup = markup;
    this.name = null;
    this.filters = [];
    var self = this;
    var match = markup.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)/);
    if( match ) {
      this.name = match[1];
      var filterMatches = markup.match(/\|\s*(.*)/);
      if(filterMatches) {
        var filters = filterMatches[1].split(/\|/);
        filters.forEach(function(f){
          var matches = f.match(/\s*(\w+)/);
          if(matches) {
            var filterName = matches[1];
            var filterArgs = [];
            (f.match(/(?:[:|,]\s*)("[^"]+"|'[^']+'|[^\s,|]+)/g) || []).flatten().forEach(function(arg){
              var cleanupMatch = arg.match(/^[\s|:|,]*(.*?)[\s]*$/);
              if (cleanupMatch) {
                filterArgs.push( cleanupMatch[1] );
              }
            });
            self.filters.push( [filterName, filterArgs] );
          }
        });
      }
    }
  },

  render: function(context) {
    if(this.name == null){ return ''; }
    var output = context.get(this.name);
    this.filters.forEach(function(filter) {
      var filterName = filter[0],
          filterArgs = (filter[1] || []).map(function(arg){
            return context.get(arg);
          });
      filterArgs.unshift(output); // Push in input value into the first argument spot...
      output = context.invoke(filterName, filterArgs);
    });

    return (output != null) ? output : '';
  }
});
Liquid.Condition = Class.extend({

  init: function (left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
    this.childRelation = null;
    this.childCondition = null;
    this.attachment = null;
  },

  evaluate: function (context) {
    context = context || new Liquid.Context();
    var result = this.interpretCondition(this.left, this.right, this.operator, context);
    switch (this.childRelation) {
    case 'or':
      return (result || this.childCondition.evaluate(context));
    case 'and':
      return (result && this.childCondition.evaluate(context));
    default:
      return result;
    }
  },

  or: function (condition) {
    this.childRelation = 'or';
    this.childCondition = condition;
  },

  and: function (condition) {
    this.childRelation = 'and';
    this.childCondition = condition;
  },

  attach: function (attachment) {
    this.attachment = attachment;
    return this.attachment;
  },

  isElse: false,

  interpretCondition: function (left, right, op, context) {
    if (!op) {
      return context.get(left);
    }

    left = context.get(left);
    right = context.get(right);
    op = Liquid.Condition.operators[op];
    if (!op) {
      throw 'Unknown operator ' + op;
    }

    var results = op(left, right);
    return results;
  },

  toString: function () {
    return '<Condition ' + this.left + ' ' + this.operator + ' ' + this.right + '>';
  }

});

Liquid.Condition.operators = {
  '==': function (l, r) { return (l == r); },
  '=':  function (l, r) { return (l == r); },
  '!=': function (l, r) { return (l != r); },
  '<>': function (l, r) { return (l != r); },
  '<':  function (l, r) { return (l < r); },
  '>':  function (l, r) { return (l > r); },
  '<=': function (l, r) { return (l <= r); },
  '>=': function (l, r) { return (l >= r); },

  contains : function (l, r) {
    return l.include(r);
  },
  hasKey : function (l, r) {
    return l.hasOwnProperty(r);
  },
  hasValue : function (l, r) {
    var p;
    for (p in l) {
      if (l[p] === r) {
        return true;
      }
    }

    return false;
  }
};

Liquid.ElseCondition = Liquid.Condition.extend({

  isElse: true,

  evaluate: function (context) {
    return true;
  },

  toString: function () {
    return "<ElseCondition>";
  }

});
Liquid.Drop = Class.extend({
  setContext: function(context) {
    this.context = context;
  },
  beforeMethod: function(method) {

  },
  invokeDrop: function(method) {
    var results = this.beforeMethod();
    if( !results && (method in this) )
      { results = this[method].apply(this); }
    return results;
  },
  hasKey: function(name) {
    return true;
  }
});
var hackObjectEach = function(fun /*, thisp*/) {
  if (typeof fun != "function")
    throw 'Object.each requires first argument to be a function';

  var i = 0,
      thisp = arguments[1];
  for (var p in this) {
    var value = this[p],
      pair = [p, value];

    pair.key = p;
    pair.value = value;
    fun.call(thisp, pair, i, this);
    i++;
  }

  return null;
};

Liquid.Template.registerTag( 'assign', Liquid.Tag.extend({

  tagSyntax: /((?:\(?[\w\-\.\[\]]\)?)+)\s*=\s*((?:"[^"]+"|'[^']+'|[^\s,|]+)+)/,

  init: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.to   = parts[1];
      this.from = parts[2];
    } else {
      throw ("Syntax error in 'assign' - Valid syntax: assign [var] = [source]");
    }
    this._super(tagName, markup, tokens)
  },
  render: function(context) {
    context.scopes.last()[this.to.toString()] = context.get(this.from);
    return '';
  }
}));

Liquid.Template.registerTag( 'cache', Liquid.Block.extend({
  tagSyntax: /(\w+)/,

  init: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.to = parts[1];
    } else {
      throw ("Syntax error in 'cache' - Valid syntax: cache [var]");
    }
    this._super(tagName, markup, tokens);
  },
  render: function(context) {
    var output = this._super(context);
    context.scopes.last()[this.to] = [output].flatten().join('');
    return '';
  }
}));


Liquid.Template.registerTag( 'capture', Liquid.Block.extend({
  tagSyntax: /(\w+)/,

  init: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.to = parts[1];
    } else {
      throw ("Syntax error in 'capture' - Valid syntax: capture [var]");
    }
    this._super(tagName, markup, tokens);
  },
  render: function(context) {
    var output = this._super(context);
    context.set( this.to, [output].flatten().join('') );
    return '';
  }
}));

Liquid.Template.registerTag( 'case', Liquid.Block.extend({

  tagSyntax     : /("[^"]+"|'[^']+'|[^\s,|]+)/,
  tagWhenSyntax : /("[^"]+"|'[^']+'|[^\s,|]+)(?:(?:\s+or\s+|\s*\,\s*)("[^"]+"|'[^']+'|[^\s,|]+.*))?/,

  init: function(tagName, markup, tokens) {
    this.blocks = [];
    this.nodelist = [];

    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.left = parts[1];
    } else {
      throw ("Syntax error in 'case' - Valid syntax: case [condition]");
    }

    this._super(tagName, markup, tokens);
  },
  unknownTag: function(tag, markup, tokens) {
    switch(tag) {
      case 'when':
        this.recordWhenCondition(markup);
        break;
      case 'else':
        this.recordElseCondition(markup);
        break;
      default:
        this._super(tag, markup, tokens);
    }

  },
  render: function(context) {
    var self = this,
        output = [],
        execElseBlock = true;

    context.stack(function(){
      for (var i=0; i < self.blocks.length; i++) {
        var block = self.blocks[i];
        if( block.isElse  ) {
          if(execElseBlock == true){ output = [output, self.renderAll(block.attachment, context)].flatten(); }
          return output;
        } else if( block.evaluate(context) ) {
          execElseBlock = false;
          output = [output, self.renderAll(block.attachment, context)].flatten();
        }
      };
    });

    return output;
  },
  recordWhenCondition: function(markup) {
    while(markup) {
      var parts = markup.match(this.tagWhenSyntax);
      if(!parts) {
        throw ("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ");
      }

      markup = parts[2];

      var block = new Liquid.Condition(this.left, '==', parts[1]);
      this.blocks.push( block );
      this.nodelist = block.attach([]);
    }
  },
  recordElseCondition: function(markup) {
    if( (markup || '').trim() != '') {
      throw ("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")
    }
    var block = new Liquid.ElseCondition();
    this.blocks.push(block);
    this.nodelist = block.attach([]);
  }
}));

Liquid.Template.registerTag( 'comment', Liquid.Block.extend({
  render: function(context) {
    return '';
  }
}));

Liquid.Template.registerTag( 'cycle', Liquid.Tag.extend({

  tagSimpleSyntax: /"[^"]+"|'[^']+'|[^\s,|]+/,
  tagNamedSyntax:  /("[^"]+"|'[^']+'|[^\s,|]+)\s*\:\s*(.*)/,

  init: function(tag, markup, tokens) {
    var matches, variables;
    matches = markup.match(this.tagNamedSyntax);
    if(matches) {
      this.variables = this.variablesFromString(matches[2]);
      this.name = matches[1];
    } else {
      matches = markup.match(this.tagSimpleSyntax);
      if(matches) {
        this.variables = this.variablesFromString(markup);
        this.name = "'"+ this.variables.toString() +"'";
      } else {
        throw ("Syntax error in 'cycle' - Valid syntax: cycle [name :] var [, var2, var3 ...]");
      }
    }
    this._super(tag, markup, tokens);
  },

  render: function(context) {
    var self   = this,
        key    = context.get(self.name),
        output = '';

    if(!context.registers['cycle']) {
      context.registers['cycle'] = {};
    }

    if(!context.registers['cycle'][key]) {
      context.registers['cycle'][key] = 0;
    }

    context.stack(function(){
      var iter    = context.registers['cycle'][key],
          results = context.get( self.variables[iter] );
      iter += 1;
      if(iter == self.variables.length){ iter = 0; }
      context.registers['cycle'][key] = iter;
      output = results;
    });

    return output;
  },

  variablesFromString: function(markup) {
    return markup.split(',').map(function(varname){
      var match = varname.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)\s*/);
      return (match[1]) ? match[1] : null
    });
  }
}));

Liquid.Template.registerTag( 'for', Liquid.Block.extend({
  tagSyntax: /(\w+)\s+in\s+((?:\(?[\w\-\.\[\]]\)?)+)/,

  init: function(tag, markup, tokens) {
    var matches = markup.match(this.tagSyntax);
    if(matches) {
      this.variableName = matches[1];
      this.collectionName = matches[2];
      this.name = this.variableName +"-"+ this.collectionName;
      this.attributes = {};
      var attrmarkup = markup.replace(this.tagSyntax, '');
      var attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g);

      if(attMatchs) {
        attMatchs.forEach(function(pair){
          pair = pair.split(":");
          this.attributes[pair[0].trim()] = pair[1].trim();
        }, this);
      }
    } else {
      throw ("Syntax error in 'for loop' - Valid syntax: for [item] in [collection]");
    }
    this._super(tag, markup, tokens);
  },

  render: function(context) {
    var self       = this,
        output     = [],
        collection = (context.get(this.collectionName) || []),
        range      = [0, collection.length];

    if(!context.registers['for']){ context.registers['for'] = {}; }

    if(this.attributes['limit'] || this.attributes['offset']) {
      var offset   = 0,
          limit    = 0,
          rangeEnd = 0,
          segment = null;

      if(this.attributes['offset'] == 'continue') {
        offset = context.registers['for'][this.name];
      } else {
        offset = context.get( this.attributes['offset'] ) || 0;
      }

      limit = context.get( this.attributes['limit'] );

      rangeEnd = (limit) ? offset + limit : collection.length;
      range = [ offset, rangeEnd ];

      context.registers['for'][this.name] = rangeEnd;
    }

    segment = collection.slice(range[0], range[1]);
    if(!segment || segment.length == 0){ return ''; }

    context.stack(function(){
      var length = segment.length;

      segment.forEach(function(item, index){
        context.set( self.variableName, item );
        context.set( 'forloop', {
          name:   self.name,
          length: length,
          index:  (index + 1),
          index0: index,
          rindex: (length - index),
          rindex0:(length - index - 1),
          first:  (index == 0),
          last:   (index == (length - 1))
        });
        output.push( (self.renderAll(self.nodelist, context) || []).join('') );
      });
    });

    return [output].flatten().join('');
  }
}));

Liquid.Template.registerTag( 'if', Liquid.Block.extend({

  tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*([=!<>a-z_]+)?\s*("[^"]+"|'[^']+'|[^\s,|]+)?/i,

  init: function(tag, markup, tokens) {
    this.nodelist = [];
    this.blocks = [];
    this.pushBlock('if', markup);
    this._super(tag, markup, tokens);
  },

  unknownTag: function(tag, markup, tokens) {
    if( ['elsif', 'else'].include(tag) ) {
      this.pushBlock(tag, markup);
    } else {
      this._super(tag, markup, tokens);
    }
  },

  render: function(context) {
    var self = this,
        output = '';
    context.stack(function(){
      for (var i=0; i < self.blocks.length; i++) {
        var block = self.blocks[i];
        if( block.evaluate(context) ) {
          output = self.renderAll(block.attachment, context);
          return;
        }
      };
    })
    return [output].flatten().join('');
  },

  pushBlock: function(tag, markup) {
    var block;
    if(tag == 'else') {
      block = new Liquid.ElseCondition();
    } else {
      var expressions = markup.split(/\b(and|or)\b/).reverse(),
          expMatches  = expressions.shift().match( this.tagSyntax );

      if (!expMatches){
        throw ("Syntax Error in tag '"+ tag +"' - Valid syntax: "+ tag +" [expression]");
      }

      var condition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3]);

      while (expressions.length > 0) {
        var operator = expressions.shift(),
            expMatches  = expressions.shift().match( this.tagSyntax );
        if(!expMatches){ throw ("Syntax Error in tag '"+ tag +"' - Valid syntax: "+ tag +" [expression]"); }

        var newCondition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3]);
        newCondition[operator](condition);
        condition = newCondition;
      }

      block = condition;
    }
    block.attach([]);
    this.blocks.push(block);
    this.nodelist = block.attachment;
  }
}));

Liquid.Template.registerTag( 'ifchanged', Liquid.Block.extend({

  render: function(context) {
    var self = this,
        output = '';
    context.stack(function(){
      var results = self.renderAll(self.nodelist, context).join('');
      if(results != context.registers['ifchanged']) {
        output = results;
        context.registers['ifchanged'] = output;
      }
    });
    return output;
  }
}));

Liquid.Template.registerTag( 'include', Liquid.Tag.extend({

  tagSyntax: /((?:"[^"]+"|'[^']+'|[^\s,|]+)+)(\s+(?:with|for)\s+((?:"[^"]+"|'[^']+'|[^\s,|]+)+))?/,

  init: function(tag, markup, tokens) {
    var matches = (markup || '').match(this.tagSyntax);
    if(matches) {
      this.templateName = matches[1];
      this.templateNameVar = this.templateName.substring(1, this.templateName.length - 1);
      this.variableName = matches[3];
      this.attributes = {};
        
      var attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g);
      if(attMatchs) {
        attMatchs.forEach(function(pair){
          pair = pair.split(":");
          this.attributes[pair[0].trim()] = pair[1].trim();
        }, this);
      }
    } else {
      throw ("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]");
    }
    this._super(tag, markup, tokens);
  },

  render: function(context) {
    var self     = this,
        source   = Liquid.readTemplateFile( context.get(this.templateName) ),
        partial  = Liquid.parse(source),
        variable = context.get((this.variableName || this.templateNameVar)),
        output   = '';
    context.stack(function(){
      self.attributes.each = hackObjectEach;
      self.attributes.each(function(pair){
        context.set(pair.key, context.get(pair.value));
      })

      if(variable instanceof Array) {
        output = variable.map(function(variable){
          context.set( self.templateNameVar, variable );
          return partial.render(context);
        });
      } else {
        context.set(self.templateNameVar, variable);
        output = partial.render(context);
      }
    });
    output = [output].flatten().join('');
    return output
  }
}));

Liquid.Template.registerTag( 'unless', Liquid.Template.tags['if'].extend({

  render: function(context) {
    var self = this,
        output = '';
    context.stack(function(){
      var block = self.blocks[0];
      if( !block.evaluate(context) ) {
        output = self.renderAll(block.attachment, context);
        return;
      }
      for (var i=1; i < self.blocks.length; i++) {
        var block = self.blocks[i];
        if( block.evaluate(context) ) {
          output = self.renderAll(block.attachment, context);
          return;
        }
      };
    })
    return output;
  }
}));
Liquid.Template.registerFilter({

  size: function (iterable) {
    return (iterable['length']) ? iterable.length : 0;
  },

  downcase: function (input) {
    return input.toString().toLowerCase();
  },

  upcase: function (input) {
    return input.toString().toUpperCase();
  },

  capitalize: function (input) {
    return input.toString().capitalize();
  },

  escape: function (input) {
    return input.toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
  },

  h: this.escape,

  truncate: function (input, length, string) {
    if (!input) {
      return '';
    }
    length = length || 50;
    string = string || '...';

    return (input.length > length ?
            input.slice(0, length) + string :
            input);
  },

  truncatewords: function (input, words, string) {
    if (!input) {
      return '';
    }
    words = parseInt(words || 15, 10);
    string = string || '...';
    var wordlist = input.toString().split(' '),
        l = Math.max(words, 0);
    return (wordlist.length > l) ? wordlist.slice(0, l).join(' ') + string : input;
  },

  truncate_words: this.truncatewords,

  strip_html: function (input) {
    return input.toString().replace(/<.*?>/g, '');
  },

  strip_newlines: function (input) {
    return input.toString().replace(/\n/g, '');
  },

  join: function (input, separator) {
    separator = separator || ' ';
    return input.join(separator);
  },

  sort: function (input) {
    return input.sort();
  },

  reverse: function (input) {
    return input.reverse();
  },

  replace: function (input, string, replacement) {
    replacement = replacement || '';
    return input.toString().replace(new RegExp(string, 'g'), replacement);
  },

  replace_first: function (input, string, replacement) {
    replacement = replacement || '';
    return input.toString().replace(new RegExp(string, ''), replacement);
  },

  newline_to_br: function (input) {
    return input.toString().replace(/\n/g, '<br/>\n');
  },

  date: function (input, format) {
    var date;
    if (input instanceof Date) {
      date = input;
    }
    if (!(date instanceof Date) && input == 'now') {
      date = new Date();
    }
    if (!(date instanceof Date)) {
      date = new Date(input);
    }
    if (!(date instanceof Date)) {
      date = new Date(Date.parse(input));
    }
    if (!(date instanceof Date)) {
      return input;
    }
    return date.strftime(format);
  },

  first: function (input) {
    return input[0];
  },

  last: function (input) {
    return input[input.length - 1];
  }
});


/*jshint
  devel:true,
  browser:true,
  onevar:true,
  sloppy:true,
  curly:true,
  evil:true,
  strict:true,
  eqeqeq:true,
  trailing:true,
  white:true,
  latedef:true,
  undef:true,
  immed:true,
  newcap:true,
  maxerr:20,
  indent:2,
  jquery:true
*/
/*global
  jQuery:false,
  Storenvy:false,
  Sea:false,
  _:false,
  define:false,
  require:true
*/
/*
 strftime for Javascript
 Copyright (c) 2008, Philip S Tellis <philip@bluesmoon.info>
 All rights reserved.

 This code is distributed under the terms of the BSD licence

 Redistribution and use of this software in source and binary forms, with
 or without modification, are permitted provided that the following
 conditions are met:

   * Redistributions of source code must retain the above copyright notice,
     this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above copyright notice,
     this list of conditions and the following disclaimer in the documentation
     and/or other materials provided with the distribution.
   * The names of the contributors to this file may not be used to endorse or
     promote products derived from this software without specific prior written
     permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * \file strftime.js
 * \author Philip S Tellis \<philip@bluesmoon.info\>
 * \version 1.3
 * \date 2008/06
 * \brief Javascript implementation of strftime
 *
 * Implements strftime for the Date object in javascript based on the PHP implementation described at
 * http://www.php.net/strftime  This is in turn based on the Open Group specification defined
 * at http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html This implementation does not
 * include modified conversion specifiers (i.e., Ex and Ox)
 *
 * The following format specifiers are supported:
 *
 * \copydoc formats
 *
 * \%a, \%A, \%b and \%B should be localised for non-English locales.
 *
 * \par Usage:
 * This library may be used as follows:
 * \code
 *     var d = new Date();
 *
 *     var ymd = d.strftime('%Y/%m/%d');
 *     var iso = d.strftime('%Y-%m-%dT%H:%M:%S%z');
 *
 * \endcode
 *
 * \sa \link Date.prototype.strftime Date.strftime \endlink for a description of each of the supported format specifiers
 * \sa Date.ext.locales for localisation information
 * \sa http://www.php.net/strftime for the PHP implementation which is the basis for this
 * \sa http://tech.bluesmoon.info/2008/04/strftime-in-javascript.html for feedback
 */

(function (Date) {

  "use strict";

  Date.ext = {};

  Date.ext.util = {};

  /**
  \brief Left pad a number with something
  \details Takes a number and pads it to the left with the passed in pad character
  \param x  The number to pad
  \param pad  The string to pad with
  \param r  [optional] Upper limit for pad.  A value of 10 pads to 2 digits, a value of 100 pads to 3 digits.
      Default is 10.

  \return The number left padded with the pad character.  This function returns a string and not a number.
  */
  Date.ext.util.xPad = function (x, pad, r) {
    if (typeof r === 'undefined') {
      r = 10;
    }
    for (; parseInt(x, 10) < r && r > 1; r /= 10) {
      x = pad.toString() + x;
    }
    return x.toString();
  };

  /**
  \brief Currently selected locale.
  \details
  The locale for a specific date object may be changed using \code Date.locale = "new-locale"; \endcode
  The default will be based on the lang attribute of the HTML tag of your document
  */
  Date.prototype.locale = 'en-GB';
  if (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) {
    Date.prototype.locale = document.documentElement.lang;
  }

  /**
  \brief Localised strings for days of the week and months of the year.
  \details
  To create your own local strings, add a locale object to the locales object.
  The key of your object should be the same as your locale name.  For example:
     en-US,
     fr,
     fr-CH,
     de-DE
  Names are case sensitive and are described at http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
  Your locale object must contain the following keys:
  \param a  Short names of days of week starting with Sunday
  \param A  Long names days of week starting with Sunday
  \param b  Short names of months of the year starting with January
  \param B  Long names of months of the year starting with February
  \param c  The preferred date and time representation in your locale
  \param p  AM or PM in your locale
  \param P  am or pm in your locale
  \param x  The  preferred date representation for the current locale without the time.
  \param X  The preferred time representation for the current locale without the date.

  \sa Date.ext.locales.en for a sample implementation
  \sa \ref localisation for detailed documentation on localising strftime for your own locale
  */
  Date.ext.locales = {};

  /**
   * \brief Localised strings for English (British).
   * \details
   * This will be used for any of the English dialects unless overridden by a country specific one.
   * This is the default locale if none specified
   */
  Date.ext.locales.en = {
    a : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    A : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    b : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    B : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    c : '%a %d %b %Y %T %Z',
    p : ['AM', 'PM'],
    P : ['am', 'pm'],
    x : '%d/%m/%y',
    X : '%T'
  };

  Date.ext.locales['en-US'] = Date.ext.locales.en;
  Date.ext.locales['en-US'].c = '%a %d %b %Y %r %Z';
  Date.ext.locales['en-US'].x = '%D';
  Date.ext.locales['en-US'].X = '%r';

  Date.ext.locales['en-GB'] = Date.ext.locales.en;

  Date.ext.locales['en-AU'] = Date.ext.locales['en-GB'];

  /**
   * \details
   * \arg \%a - abbreviated weekday name according to the current locale
   * \arg \%A - full weekday name according to the current locale
   * \arg \%b - abbreviated month name according to the current locale
   * \arg \%B - full month name according to the current locale
   * \arg \%c - preferred date and time representation for the current locale
   * \arg \%C - century number (the year divided by 100 and truncated to an integer, range 00 to 99)
   * \arg \%d - day of the month as a decimal number (range 01 to 31)
   * \arg \%D - same as %m/%d/%y
   * \arg \%e - day of the month as a decimal number, a single digit is preceded by a space (range ' 1' to '31')
   * \arg \%g - like %G, but without the century
   * \arg \%G - The 4-digit year corresponding to the ISO week number
   * \arg \%h - same as %b
   * \arg \%H - hour as a decimal number using a 24-hour clock (range 00 to 23)
   * \arg \%I - hour as a decimal number using a 12-hour clock (range 01 to 12)
   * \arg \%j - day of the year as a decimal number (range 001 to 366)
   * \arg \%m - month as a decimal number (range 01 to 12)
   * \arg \%M - minute as a decimal number
   * \arg \%n - newline character
   * \arg \%p - either `AM' or `PM' according to the given time value, or the corresponding strings for the current locale
   * \arg \%P - like %p, but lower case
   * \arg \%r - time in a.m. and p.m. notation equal to %I:%M:%S %p
   * \arg \%R - time in 24 hour notation equal to %H:%M
   * \arg \%S - second as a decimal number
   * \arg \%t - tab character
   * \arg \%T - current time, equal to %H:%M:%S
   * \arg \%u - weekday as a decimal number [1,7], with 1 representing Monday
   * \arg \%U - week number of the current year as a decimal number, starting with
   *            the first Sunday as the first day of the first week
   * \arg \%V - The ISO 8601:1988 week number of the current year as a decimal number,
   *            range 01 to 53, where week 1 is the first week that has at least 4 days
   *            in the current year, and with Monday as the first day of the week.
   * \arg \%w - day of the week as a decimal, Sunday being 0
   * \arg \%W - week number of the current year as a decimal number, starting with the
   *            first Monday as the first day of the first week
   * \arg \%x - preferred date representation for the current locale without the time
   * \arg \%X - preferred time representation for the current locale without the date
   * \arg \%y - year as a decimal number without a century (range 00 to 99)
   * \arg \%Y - year as a decimal number including the century
   * \arg \%z - numerical time zone representation
   * \arg \%Z - time zone name or abbreviation
   * \arg \%% - a literal `\%' character
   */
  Date.ext.formats = {
    a : function (d) {
      return Date.ext.locales[d.locale].a[d.getDay()];
    },
    A : function (d) {
      return Date.ext.locales[d.locale].A[d.getDay()];
    },
    b : function (d) {
      return Date.ext.locales[d.locale].b[d.getMonth()];
    },
    B : function (d) {
      return Date.ext.locales[d.locale].B[d.getMonth()];
    },
    c : 'toLocaleString',
    C : function (d) {
      return Date.ext.util.xPad(parseInt(d.getFullYear() / 100, 10), 0);
    },
    d : ['getDate', '0'],
    e : ['getDate', ' '],
    g : function (d) {
      return Date.ext.util.xPad(parseInt(Date.ext.util.G(d) / 100, 10), 0);
    },
    G : function (d) {
        var
          y = d.getFullYear(),
          V = parseInt(Date.ext.formats.V(d), 10),
          W = parseInt(Date.ext.formats.W(d), 10)
        ;

        if (W > V) {
          y++;
        } else if (W === 0 && V >= 52) {
          y--;
        }

        return y;
      },
    H : ['getHours', '0'],
    I : function (d) {
      var I = d.getHours() % 12;
      return Date.ext.util.xPad(I === 0 ? 12 : I, 0);
    },
    j : function (d) {
        var
          ms = d - new Date('' + d.getFullYear() + '/1/1 GMT'),
          doy
        ;
        ms += d.getTimezoneOffset() * 60000;
        doy = parseInt(ms / 60000 / 60 / 24, 10) + 1;
        return Date.ext.util.xPad(doy, 0, 100);
      },
    m : function (d) {
      return Date.ext.util.xPad(d.getMonth() + 1, 0);
    },
    M : ['getMinutes', '0'],
    p : function (d) {
      return Date.ext.locales[d.locale].p[d.getHours() >= 12 ? 1 : 0];
    },
    P : function (d) {
      return Date.ext.locales[d.locale].P[d.getHours() >= 12 ? 1 : 0];
    },
    S : ['getSeconds', '0'],
    u : function (d) {
      var dow = d.getDay();
      return dow === 0 ? 7 : dow;
    },
    U : function (d) {
        var
          doy = parseInt(Date.ext.formats.j(d), 10),
          rdow = 6 - d.getDay(),
          woy = parseInt((doy + rdow) / 7, 10)
        ;
        return Date.ext.util.xPad(woy, 0);
      },
    V : function (d) {
        var
          woy = parseInt(Date.ext.formats.W(d), 10),
          dow1_1 = (new Date('' + d.getFullYear() + '/1/1')).getDay(),
          idow = woy + (dow1_1 > 4 || dow1_1 <= 1 ? 0 : 1)
        ;
        if (idow === 53 && (new Date('' + d.getFullYear() + '/12/31')).getDay() < 4) {
          idow = 1;
        } else if (idow === 0) {
          idow = Date.ext.formats.V(new Date('' + (d.getFullYear() - 1) + '/12/31'));
        }

        return Date.ext.util.xPad(idow, 0);
      },
    w : 'getDay',
    W : function (d) {
        var
          doy = parseInt(Date.ext.formats.j(d), 10),
          rdow = 7 - Date.ext.formats.u(d),
          woy = parseInt((doy + rdow) / 7, 10)
        ;
        return Date.ext.util.xPad(woy, 0, 10);
      },
    y : function (d) {
      return Date.ext.util.xPad(d.getFullYear() % 100, 0);
    },
    Y : 'getFullYear',
    z : function (d) {
        var
          o = d.getTimezoneOffset(),
          H = Date.ext.util.xPad(parseInt(Math.abs(o / 60), 10), 0),
          M = Date.ext.util.xPad(o % 60, 0)
        ;
        return (o > 0 ? '-' : '+') + H + M;
      },
    Z : function (d) {
      return d.toString().replace(/^.*\(([^)]+)\)$/, '$1');
    },
    '%' : function (d) {
      return '%';
    }
  };

  /**
  \brief List of aggregate format specifiers.
  \details
  Aggregate format specifiers map to a combination of basic format specifiers.
  These are implemented in terms of Date.ext.formats.

  A format specifier that maps to 'locale' is read from Date.ext.locales[current-locale].

  \sa Date.ext.formats
  */
  Date.ext.aggregates = {
    c : 'locale',
    D : '%m/%d/%y',
    h : '%b',
    n : '\n',
    r : '%I:%M:%S %p',
    R : '%H:%M',
    t : '\t',
    T : '%H:%M:%S',
    x : 'locale',
    X : 'locale'
  };

  Date.ext.aggregates.z = Date.ext.formats.z(new Date());
  Date.ext.aggregates.Z = Date.ext.formats.Z(new Date());

  /**
   * \details
   * All format specifiers supported by the PHP implementation are supported by
   * this javascript implementation.
   */
  Date.ext.unsupported = {};


  /**
   * \brief Formats the date according to the specified format.
   * \param fmt  The format to format the date in.  This may be a combination of the following:
   * \copydoc formats
   *
   * \return  A string representation of the date formatted based on the passed in parameter
   * \sa http://www.php.net/strftime for documentation on format specifiers
  */
  Date.prototype.strftime = function (fmt) {
    if (!(Date.ext.locales[this.locale])) {
      if (this.locale.replace(/-[a-zA-Z]+$/, '') in Date.ext.locales) {
        this.locale = this.locale.replace(/-[a-zA-Z]+$/, '');
      } else {
        this.locale = 'en-GB';
      }
    }

    var d = this,
      str,
      aggregateReplacer
    ;

    aggregateReplacer = function (m0, m1) {
      var f = Date.ext.aggregates[m1];
      return (f === 'locale' ? Date.ext.locales[d.locale][m1] : f);
    };

    while (fmt.match(/%[cDhnrRtTxXzZ]/)) {
      fmt = fmt.replace(/%([cDhnrRtTxXzZ])/g, aggregateReplacer);
    }

    str = fmt.replace(/%([aAbBCdegGHIjmMpPSuUVwWyY%])/g, function (m0, m1) {
      var f = Date.ext.formats[m1];
      if (typeof f  === 'string') {
        return d[f]();
      } else if (typeof f === 'function') {
        return f.call(d, d);
      } else if (typeof f === 'object' && typeof f[0] === 'string') {
        return Date.ext.util.xPad(d[f[0]](), f[1]);
      } else {
        return m1;
      }
    });

    d = null;
    return str;
  };

}(this.Date));

/**
 * \mainpage strftime for Javascript
 *
 * \section toc Table of Contents
 * - \ref intro_sec
 * - <a class="el" href="strftime.js">Download full source</a> / <a class="el" href="strftime-min.js">minified</a>
 * - \subpage usage
 * - \subpage format_specifiers
 * - \subpage localisation
 * - \link strftime.js API Documentation \endlink
 * - \subpage demo
 * - \subpage changelog
 * - \subpage faq
 * - <a class="el" href="http://tech.bluesmoon.info/2008/04/strftime-in-javascript.html">Feedback</a>
 * - \subpage copyright_licence
 *
 * \section intro_sec Introduction
 *
 * C and PHP developers have had access to a built in strftime function for a long time.
 * This function is an easy way to format dates and times for various display needs.
 *
 * This library brings the flexibility of strftime to the javascript Date object
 *
 * Use this library if you frequently need to format dates in javascript in a variety of ways.  For example,
 * if you have PHP code that writes out formatted dates, and want to mimic the functionality using
 * progressively enhanced javascript, then this library can do exactly what you want.
 *
 *
 *
 *
 * \page usage Example usage
 *
 * \section usage_sec Usage
 * This library may be used as follows:
 * \code
 *     var d = new Date();
 *
 *     var ymd = d.strftime('%Y/%m/%d');
 *     var iso = d.strftime('%Y-%m-%dT%H:%M:%S%z');
 *
 * \endcode
 *
 * \subsection examples Examples
 *
 * To get the current time in hours and minutes:
 * \code
 *   var d = new Date();
 *   d.strftime("%H:%M");
 * \endcode
 *
 * To get the current time with seconds in AM/PM notation:
 * \code
 *   var d = new Date();
 *   d.strftime("%r");
 * \endcode
 *
 * To get the year and day of the year for August 23, 2009:
 * \code
 *   var d = new Date('2009/8/23');
 *   d.strftime("%Y-%j");
 * \endcode
 *
 * \section demo_sec Demo
 *
 * Try your own examples on the \subpage demo page.  You can use any of the supported
 * \subpage format_specifiers.
 *
 *
 *
 *
 * \page localisation Localisation
 * You can localise strftime by implementing the short and long forms for days of the
 * week and months of the year, and the localised aggregates for the preferred date
 * and time representation for your locale.  You need to add your locale to the
 * Date.ext.locales object.
 *
 * \section localising_fr Localising for french
 *
 * For example, this is how we'd add French language strings to the locales object:
 * \dontinclude index.html
 * \skip Generic french
 * \until };
 * The % format specifiers are all defined in \ref formats.  You can use any of those.
 *
 * This locale definition may be included in your own source file, or in the HTML file
 * including \c strftime.js, however it must be defined \em after including \c strftime.js
 *
 * The above definition includes generic french strings and formats that are used in France.
 * Other french speaking countries may have other representations for dates and times, so we
 * need to override this for them.  For example, Canadian french uses a Y-m-d date format,
 * while French french uses d.m.Y.  We fix this by defining Canadian french to be the same
 * as generic french, and then override the format specifiers for \c x for the \c fr-CA locale:
 * \until End french
 *
 * You can now use any of the French locales at any time by setting \link Date.prototype.locale Date.locale \endlink
 * to \c "fr", \c "fr-FR", \c "fr-CA", or any other french dialect:
 * \code
 *     var d = new Date("2008/04/22");
 *     d.locale = "fr";
 *
 *     d.strftime("%A, %d %B == %x");
 * \endcode
 * will return:
 * \code
 *     mardi, 22 avril == 22.04.2008
 * \endcode
 * While changing the locale to "fr-CA":
 * \code
 *     d.locale = "fr-CA";
 *
 *     d.strftime("%A, %d %B == %x");
 * \endcode
 * will return:
 * \code
 *     mardi, 22 avril == 2008-04-22
 * \endcode
 *
 * You can use any of the format specifiers defined at \ref formats
 *
 * The locale for all dates defaults to the value of the \c lang attribute of your HTML document if
 * it is set, or to \c "en" otherwise.
 * \note
 * Your locale definitions \b MUST be added to the locale object before calling
 * \link Date.prototype.strftime Date.strftime \endlink.
 *
 * \sa \ref formats for a list of format specifiers that can be used in your definitions
 * for c, x and X.
 *
 * \section locale_names Locale names
 *
 * Locale names are defined in RFC 1766. Typically, a locale would be a two letter ISO639
 * defined language code and an optional ISO3166 defined country code separated by a -
 *
 * eg: fr-FR, de-DE, hi-IN
 *
 * \sa http://www.ietf.org/rfc/rfc1766.txt
 * \sa http://www.loc.gov/standards/iso639-2/php/code_list.php
 * \sa http://www.iso.org/iso/country_codes/iso_3166_code_lists/english_country_names_and_code_elements.htm
 *
 * \section locale_fallback Locale fallbacks
 *
 * If a locale object corresponding to the fully specified locale isn't found, an attempt will be made
 * to fall back to the two letter language code.  If a locale object corresponding to that isn't found
 * either, then the locale will fall back to \c "en".  No warning will be issued.
 *
 * For example, if we define a locale for de:
 * \until };
 * Then set the locale to \c "de-DE":
 * \code
 *     d.locale = "de-DE";
 *
 *     d.strftime("%a, %d %b");
 * \endcode
 * In this case, the \c "de" locale will be used since \c "de-DE" has not been defined:
 * \code
 *     Di, 22 Apr
 * \endcode
 *
 * Swiss german will return the same since it will also fall back to \c "de":
 * \code
 *     d.locale = "de-CH";
 *
 *     d.strftime("%a, %d %b");
 * \endcode
 * \code
 *     Di, 22 Apr
 * \endcode
 *
 * We need to override the \c a specifier for Swiss german, since it's different from German german:
 * \until End german
 * We now get the correct results:
 * \code
 *     d.locale = "de-CH";
 *
 *     d.strftime("%a, %d %b");
 * \endcode
 * \code
 *     Die, 22 Apr
 * \endcode
 *
 * \section builtin_locales Built in locales
 *
 * This library comes with pre-defined locales for en, en-GB, en-US and en-AU.
 *
 *
 *
 *
 * \page format_specifiers Format specifiers
 *
 * \section specifiers Format specifiers
 * strftime has several format specifiers defined by the Open group at
 * http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html
 *
 * PHP added a few of its own, defined at http://www.php.net/strftime
 *
 * This javascript implementation supports all the PHP specifiers
 *
 * \subsection supp Supported format specifiers:
 * \copydoc formats
 *
 * \subsection unsupportedformats Unsupported format specifiers:
 * \copydoc unsupported
 *
 *
 *
 *
 * \page demo strftime demo
 * <div style="float:right;width:45%;">
 * \copydoc formats
 * </div>
 * \htmlinclude index.html
 *
 *
 *
 *
 * \page faq FAQ
 *
 * \section how_tos Usage
 *
 * \subsection howtouse Is there a manual on how to use this library?
 *
 * Yes, see \ref usage
 *
 * \subsection wheretoget Where can I get a minified version of this library?
 *
 * The minified version is available <a href="strftime-min.js" title="Minified strftime.js">here</a>.
 *
 * \subsection which_specifiers Which format specifiers are supported?
 *
 * See \ref format_specifiers
 *
 * \section whys Why?
 *
 * \subsection why_lib Why this library?
 *
 * I've used the strftime function in C, PHP and the Unix shell, and found it very useful
 * to do date formatting.  When I needed to do date formatting in javascript, I decided
 * that it made the most sense to just reuse what I'm already familiar with.
 *
 * \subsection why_another Why another strftime implementation for Javascript?
 *
 * Yes, there are other strftime implementations for Javascript, but I saw problems with
 * all of them that meant I couldn't use them directly.  Some implementations had bad
 * designs.  For example, iterating through all possible specifiers and scanning the string
 * for them.  Others were tied to specific libraries like prototype.
 *
 * Trying to extend any of the existing implementations would have required only slightly
 * less effort than writing this from scratch.  In the end it took me just about 3 hours
 * to write the code and about 6 hours battling with doxygen to write these docs.
 *
 * I also had an idea of how I wanted to implement this, so decided to try it.
 *
 * \subsection why_extend_date Why extend the Date class rather than subclass it?
 *
 * I tried subclassing Date and failed.  I didn't want to waste time on figuring
 * out if there was a problem in my code or if it just wasn't possible.  Adding to the
 * Date.prototype worked well, so I stuck with it.
 *
 * I did have some worries because of the way for..in loops got messed up after json.js added
 * to the Object.prototype, but that isn't an issue here since {} is not a subclass of Date.
 *
 * My last doubt was about the Date.ext namespace that I created.  I still don't like this,
 * but I felt that \c ext at least makes clear that this is external or an extension.
 *
 * It's quite possible that some future version of javascript will add an \c ext or a \c locale
 * or a \c strftime property/method to the Date class, but this library should probably
 * check for capabilities before doing what it does.
 *
 * \section curiosity Curiosity
 *
 * \subsection how_big How big is the code?
 *
 * \arg 26K bytes with documentation
 * \arg 4242 bytes minified using <a href="http://developer.yahoo.com/yui/compressor/">YUI Compressor</a>
 * \arg 1477 bytes minified and gzipped
 *
 * \subsection how_long How long did it take to write this?
 *
 * 15 minutes for the idea while I was composing this blog post:
 * http://tech.bluesmoon.info/2008/04/javascript-date-functions.html
 *
 * 3 hours in one evening to write v1.0 of the code and 6 hours the same
 * night to write the docs and this manual.  As you can tell, I'm fairly
 * sleepy.
 *
 * Versions 1.1 and 1.2 were done in a couple of hours each, and version 1.3
 * in under one hour.
 *
 * \section contributing Contributing
 *
 * \subsection how_to_rfe How can I request features or make suggestions?
 *
 * You can leave a comment on my blog post about this library here:
 * http://tech.bluesmoon.info/2008/04/strftime-in-javascript.html
 *
 * \subsection how_to_contribute Can I/How can I contribute code to this library?
 *
 * Yes, that would be very nice, thank you.  You can do various things.  You can make changes
 * to the library, and make a diff against the current file and mail me that diff at
 * philip@bluesmoon.info, or you could just host the new file on your own servers and add
 * your name to the copyright list at the top stating which parts you've added.
 *
 * If you do mail me a diff, let me know how you'd like to be listed in the copyright section.
 *
 * \subsection copyright_signover Who owns the copyright on contributed code?
 *
 * The contributor retains copyright on contributed code.
 *
 * In some cases I may use contributed code as a template and write the code myself.  In this
 * case I'll give the contributor credit for the idea, but will not add their name to the
 * copyright holders list.
 *
 *
 *
 *
 * \page copyright_licence Copyright & Licence
 *
 * \section copyright Copyright
 * \dontinclude strftime.js
 * \skip Copyright
 * \until rights
 *
 * \section licence Licence
 * \skip This code
 * \until SUCH DAMAGE.
 *
 *
 *
 * \page changelog ChangeLog
 *
 * \par 1.3 - 2008/06/17:
 * - Fixed padding issue with negative timezone offsets in %r
 *   reported and fixed by Mikko:
 *   http://tech.bluesmoon.info/2008/04/strftime-in-javascript.html
 * - Added support for %P
 * - Internationalised %r, %p and %P
 *
 * \par 1.2 - 2008/04/27:
 * - Fixed support for c (previously it just returned toLocaleString())
 * - Add support for c, x and X
 * - Add locales for en-GB, en-US and en-AU
 * - Make en-GB the default locale (previous was en)
 * - Added more localisation docs
 *
 * \par 1.1 - 2008/04/27:
 * - Fix bug in xPad which wasn't padding more than a single digit
 * - Fix bug in j which had an off by one error for days after March 10th because of daylight savings
 * - Add support for g, G, U, V and W
 *
 * \par 1.0 - 2008/04/22:
 * - Initial release with support for a, A, b, B, c, C, d, D, e, H, I, j, m, M, p, r, R, S, t, T, u, w, y, Y, z, Z, and %
 */
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
var split;

split = split || function (undef) {

    var nativeSplit = String.prototype.split,
        compliantExecNpcg = /()??/.exec("")[1] === undef, // NPCG: nonparticipating capturing group
        self;

    self = function (str, separator, limit) {
        if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
            return nativeSplit.call(str, separator, limit);
        }
        var output = [],
            flags = (separator.ignoreCase ? "i" : "") +
                    (separator.multiline  ? "m" : "") +
                    (separator.extended   ? "x" : "") + // Proposed for ES6
                    (separator.sticky     ? "y" : ""), // Firefox 3+
            lastLastIndex = 0,
            separator = new RegExp(separator.source, flags + "g"),
            separator2, match, lastIndex, lastLength;
        str += ""; // Type-convert
        if (!compliantExecNpcg) {
            separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
        }
        /* Values for `limit`, per the spec:
         * If undefined: 4294967295 // Math.pow(2, 32) - 1
         * If 0, Infinity, or NaN: 0
         * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
         * If negative number: 4294967296 - Math.floor(Math.abs(limit))
         * If other: Type-convert, then use the above rules
         */
        limit = limit === undef ?
            -1 >>> 0 : // Math.pow(2, 32) - 1
            limit >>> 0; // ToUint32(limit)
        while (match = separator.exec(str)) {
            lastIndex = match.index + match[0].length;
            if (lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));
                if (!compliantExecNpcg && match.length > 1) {
                    match[0].replace(separator2, function () {
                        for (var i = 1; i < arguments.length - 2; i++) {
                            if (arguments[i] === undef) {
                                match[i] = undef;
                            }
                        }
                    });
                }
                if (match.length > 1 && match.index < str.length) {
                    Array.prototype.push.apply(output, match.slice(1));
                }
                lastLength = match[0].length;
                lastLastIndex = lastIndex;
                if (output.length >= limit) {
                    break;
                }
            }
            if (separator.lastIndex === match.index) {
                separator.lastIndex++;
            }
        }
        if (lastLastIndex === str.length) {
            if (lastLength || !separator.test("")) {
                output.push("");
            }
        } else {
            output.push(str.slice(lastLastIndex));
        }
        return output.length > limit ? output.slice(0, limit) : output;
    };

    String.prototype.split = function (separator, limit) {
        return self(this, separator, limit);
    };

    return self;

}();

  return Liquid;

}));
