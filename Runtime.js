const MAX_LOOP = 1000;

const isUpperAlphabet = (c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) >= 0;

const isConstantName = (s) => {
  for (const c of s) {
    if (!isUpperAlphabet(c) && c != "_") return false;
  }
  return true;
};

class Return {
  constructor(val) {
    this.val = val;
  }
  getValue() {
    return this.val;
  }
}

class Break {
}

class Scope {
  constructor(parent = null) {
    this.vars = {};
    this.parent = parent;
  }
  isDefined(name) {
    // return this.vars[name] !== undefined;
    for (let scope = this; scope; scope = scope.parent) {
      if (scope.vars[name] !== undefined) {
        return true;
      }
    }
    return false;
  }
  getVar(name) {
    for (let scope = this; scope; scope = scope.parent) {
      if (scope.vars[name] !== undefined) {
        return scope.vars[name];
      }
    }
    /*
    if (this.vars[name] !== undefined) {
      return this.vars[name];
    }
    */
    //throw new Error("定義されていない変数 " + name + " が使われました");
    throw new Error("undefined var " + name + " is used");
  }
  setVar(name, o, forcelocal = false) {
    /*
    if (!forcelocal) {
      for (let scope = this; scope; scope = scope.parent) {
        if (scope.vars[name] !== undefined) {
          scope.vars[name] = o;
          return;
        }
      }
    }
    */
    this.vars[name] = o;
  }
}

export class Runtime {
  constructor(ast, callbackoutput) {
    this.vars = {};
    this.callbackoutput = callbackoutput;
    this.ast = ast;
  }
  output(s) {
    if (this.callbackoutput) {
      this.callbackoutput(s);
    } else {
      console.log(s);
    }
  }
  run() {
    this.scope = new Scope();
    this.runBlock(this.ast, this.scope);
    //console.log(this.vars);
  }
  binarray2int(a) {
    let res = 0;
    let m = 0;
    for (let i = a.length - 1; i >= 0; i--) {
      res += a[i] << m;
      m++;
    }
    return res;
  }
  getArrayIndex(ast, scope) {
    const prop = this.calcExpression(ast, scope);
    if (typeof prop == "number") {
      return prop;
    } else if (Array.isArray(prop)) {
      return this.binarray2int(prop);
    } else {
    //if (prop < 0 || typeof prop == "string" && parseInt(prop).toString() != prop) {
      //throw new Error("配列には0または正の整数のみ指定可能です");
      throw new Error("array index must be number or binary array of numbers");
    }
  }
  runBlock(ast, scope) {
    const body = ast.type == "BlockStatement" || 
      ast.type == "Program" ? ast.body :
      ast.type == "SequenceExpression" ? ast.expressions : [ast];
    for (const cmd of body) {
      //console.log(cmd)
      if (cmd.type == "ExpressionStatement") {
        this.runBlock(cmd.expression, scope);
      } else if (cmd.type == "AssignmentExpression") {
        const name = this.getVarName(cmd.left);
        if (scope.isDefined(name) && isConstantName(name)) {
          //throw new Error("定数には再代入できません");
          throw new Error("constant can't assign again");
        }
        if (cmd.left.type == "Identifier") {
          scope.setVar(name, this.calcExpression(cmd.right, scope));
        } else if (cmd.left.type == "MemberExpression") {
          if (!scope.isDefined(name)) {
            scope.setVar(name, []);
          }
          const idx = this.getArrayIndex(cmd.left.property, scope);
          scope.getVar(name)[idx] = this.calcExpression(cmd.right, scope);
        } else {
          //throw new Error("非対応の type です " + cmd.left.type);
          throw new Error("unsupported type : " + cmd.left.type);
        }
      } else if (cmd.type == "CallExpression") {
        const name = cmd.callee.name;
        if (name == "print") {
          this.output(cmd.arguments.map(i => this.calcExpression(i, scope)).join(" "));
        } else {
          if (!scope.isDefined(name)) {
            //throw new Error("定義されていない関数 " + name + " が使われました");
            throw new Error("undefined function used : " + name);
          }
          const func = scope.getVar(name);
          if (ast.arguments.length != func.params.length) {
            //throw new Error("引数の数が合っていません");
            throw new Error("wrong count of parameters");
          }
          const scope2 = new Scope(scope);
          for (let i = 0; i < ast.arguments.length; i++) {
            const localvarname = func.params[i].name;
            scope2.setVar(localvarname, this.calcExpression(ast.arguments[i], scope), true);
          }
          try {
            this.runBlock(func.body, scope2);
            //throw new Error("関数が値を返しませんでした");
          } catch (e) {
            if (e instanceof Return) {
              //return e.getValue();
            }
            throw e;
          }
        }
      } else if (cmd.type == "IfStatement") {
        const cond = this.calcExpression(cmd.test, scope);
        if (cond) {
          this.runBlock(cmd.consequent, scope);
        } else if (cmd.alternate) {
          this.runBlock(cmd.alternate, scope);
        }
      } else if (cmd.type == "WhileStatement") {
        try {
          for (let i = 0;; i++) {
            const cond = this.calcExpression(cmd.test, scope);
            if (!cond) break;
            this.runBlock(cmd.body, scope);
            if (i >= MAX_LOOP) {
              //throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
              throw new Error("reached the maximum count : " + MAX_LOOP);
            }
          }
        } catch (e) {
          if (!(e instanceof Break)) {
            throw e;
          }
        }
      } else if (cmd.type == "DoWhileStatement") {
        try {
          for (let i = 0;; i++) {
            this.runBlock(cmd.body, scope);
            const cond = this.calcExpression(cmd.test, scope);
            if (!cond) break;
            if (i >= MAX_LOOP) {
              //throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
              throw new Error("reached the maximum count : " + MAX_LOOP);
            }
          }
        } catch (e) {
          if (!(e instanceof Break)) {
            throw e;
          }
        }
      } else if (cmd.type == "ForStatement") {
        if (cmd.init) {
          this.runBlock(cmd.init, scope);
        }
        try {
          for (let i = 0;; i++) {
            if (cmd.test) {
              const cond = this.calcExpression(cmd.test, scope);
              if (!cond) break;
            }
            this.runBlock(cmd.body, scope);
            if (cmd.update) {
              this.runBlock(cmd.update, scope);
            }
            if (i >= MAX_LOOP) {
              //throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
              throw new Error("reached the maximum count : " + MAX_LOOP);
            }
          }
        } catch (e) {
          if (!(e instanceof Break)) {
            throw e;
          }
        }
      } else if (cmd.type == "FunctionDeclaration") {
        const name = cmd.id.name;
        if (scope.isDefined(name)) {
          //throw new Error("すでに宣言済みに名前では関数を定義できません");
          throw new Error("already defined function name : " + name);
        }
        scope.setVar(name, cmd);
      } else if (cmd.type == "ReturnStatement") {
        const val = this.calcExpression(cmd.argument, scope);
        throw new Return(val);
      } else if (cmd.type == "BreakStatement") {
        throw new Break();
      } else {
        //throw new Error("対応していない expression type が使われました。 " + cmd.type);
        throw new Error("unsupported expression type : " + cmd.type);
      }
    }
  }
  getVarName(ast) {
    for (;;) {
      if (ast.type == "Identifier") return ast.name;
      else if (ast.type == "MemberExpression") ast = ast.object;
      else {
        //throw new Error("非対応の type です " + ast.type);
        throw new Error("unsupported type : " + ast.type);
      }
    }
  }
  calcExpression(ast, scope) {
    if (ast.type == "Literal") {
      return ast.value;
    } else if (ast.type == "Identifier") {
      if (!scope.isDefined(ast.name)) {
        //console.log("var", this.vars)
        //throw new Error("初期化されていない変数 " + ast.name + " が使われました");
        throw new Error("unused var : " + ast.name);
      }
      return scope.getVar(ast.name);
    } else if (ast.type == "MemberExpression") {
      const name = this.getVarName(ast);
      if (!scope.isDefined(name)) {
        //throw new Error("初期化されていない配列 " + name + " が使われました");
        throw new Error("unused array : " + name);
      }
      const idx = this.getArrayIndex(ast.property, scope);
      const v = scope.getVar(name);
      if (typeof v == "string") {
        if (idx >= 0 && idx < v.length) return v[idx];
        return "";
      } else {
        return v[idx];
      }
    } else if (ast.type == "ArrayExpression") {
      const ar = ast.elements.map(i => this.calcExpression(i, scope));
      return ar;
    } else if (ast.type == "BinaryExpression" || ast.type == "LogicalExpression") {
      const n = this.calcExpression(ast.left, scope);
      const m = this.calcExpression(ast.right, scope);
      const op = ast.operator;
      if (op == "nor") {
        return n || m ? 0 : 1;
      } else {
        throw new Error("unsupported operator : " + op);
      }
    } else if (ast.type == "CallExpression") {
      const name = ast.callee.name;
      if (name == "input") {
        if (ast.arguments.length > 1) {
          //throw new Error("引数の数が合っていません");
          throw new Error("wrong count of parameters : " + name);
        }
        const q = ast.arguments.length ? this.calcExpression(ast.arguments[0], scope) : "入力してください";
        const s = prompt(q);
        if (s == null) return "";
        const f = parseFloat(s);
        if (!isNaN(f) && f.toString() == s) return f;
        return s;
      }
      if (!scope.isDefined(name)) {
        //throw new Error("定義されていない関数 " + name + " が使われました");
        throw new Error("undefined function : " + name);
      }
      const func = scope.getVar(name);
      if (ast.arguments.length != func.params.length) {
        //throw new Error("引数の数が合っていません");
        throw new Error("wrong count of parameters : " + name);
      }
      const scope2 = new Scope(scope);
      for (let i = 0; i < ast.arguments.length; i++) {
        const localvarname = func.params[i].name;
        scope2.setVar(localvarname, this.calcExpression(ast.arguments[i], scope), true);
      }
      try {
        this.runBlock(func.body, scope2);
        //throw new Error("関数が値を返しませんでした");
        throw new Error("function didn't return value");
      } catch (e) {
        if (e instanceof Return) {
          return e.getValue();
        }
        throw e;
      }
    } else {
      //throw new Error("対応していない expression type が使われました。 " + ast.type);
      throw new Error("unsupported expression type : " + ast.type);
    }
  }
  getVars() {
    const vars = this.scope.vars;
    const res = {};
    for (const name in vars) {
      const o = vars[name];
      if (typeof o == "object" && o.type == "FunctionDeclaration") {
        res[name] = "[function]";
      } else if (typeof o == "function") {
        res[name] = "[function in js]";
      } else {
        res[name] = o;
      }
    }
    return res;
  }
}
