const BLACKET_MODE = false;

const reserved = [
  "print",
  //"input",
  "if", "else", "elseif", "endif",
  "for", "to", "step", "next", "while", "do", "until", "break",
  "function", "return", "end",
  //"and", "or", "not",
  "nor",
];

const isNumber = (c) => "0123456789".indexOf(c) >= 0;
const isOperator = (c) => "+-*/%=!<>,".indexOf(c) >= 0;
const isUpperAlphabet = (c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) >= 0;

const isConstantName = (s) => {
  for (const c of s) {
    if (!isUpperAlphabet(c) && c != "_") return false;
  }
  return true;
};

const MAX_LOOP = 1000;

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

export class Nor {
  constructor(s, callbackoutput) {
    this.s = s.replaceAll("\r", "");
    this.vars = {};
    this.callbackoutput = callbackoutput;
    //this.parseTokens();
    this.parse();
  }
  output(s) {
    if (this.callbackoutput) {
      this.callbackoutput(s);
    } else {
      console.log(s);
    }
  }
  getChar() {
    const res = this.s[this.p];
    this.p++;
    return res;
  }
  getToken(reteol = false) {
    const STATE_FIRST = 0;
    const STATE_WORD = 1;
    const STATE_STRING = 2;
    const STATE_COMMENT = 3;
    const STATE_COMMENT_SINGLE = 4;
    const STATE_COMMENT_MULTI = 5;
    const STATE_COMMENT_MULTI2 = 6;
    const STATE_NUMBER = 7;
    const STATE_OPERATOR = 8;
    let state = STATE_FIRST;
    const res = [];
    const pos = this.p;
    for (;;) {
      const c = this.getChar();
      if (state == STATE_FIRST) {
        if (reteol && c == "\n") {
          return { pos, type: "eol" };
        } else if (c == " " || c == "\t" || c == "\n") {
          continue;
        } else if (c === undefined) {
          return { pos, type: "eof" };
        } else if (c == "#") {
          state = STATE_COMMENT;
        } else if (c == "{" || c == "}" || c == "(" || c == ")" || c == "[" || c == "]") {
          return { pos, type: c };
        } else if (c == '"') {
          state = STATE_STRING;
        } else if (isNumber(c) || c == ".") {
          res.push(c);
          state = STATE_NUMBER;
        } else if (isOperator(c)) {
          res.push(c);
          state = STATE_OPERATOR;
        } else {
          res.push(c);
          state = STATE_WORD;
        }
      } else if (state == STATE_WORD) {
        if (c == " " || c == "\t" || c == "\n" || isOperator(c) || c == "(" || c == ")" || c == "[" || c == "]" || c === undefined) {
          this.p--;
          const w = res.join("");
          if (reserved.indexOf(w) >= 0) {
            if (w == "nor") {
              return { pos, type: "operator", operator: "nor" };
            }
            return { pos, type: w };
          } else {
            return { pos, type: "var", name: w };
          }
        } else {
          res.push(c);
        }
      } else if (state == STATE_STRING) {
        if (c == '"') {
          const w = res.join("");
          return { pos, type: "string", value: w };
        } else if (c == "\n" || c === undefined) {
          //throw new Error("文字列が閉じられていません");
          throw new Error(`string is not closed with '"'`);
        } else {
          res.push(c);
        }
      } else if (state == STATE_COMMENT) {
        if (c == "=") {
          state = STATE_COMMENT_MULTI;
        } else {
          this.p--;
          state = STATE_COMMENT_SINGLE;
        }
      } else if (state == STATE_COMMENT_SINGLE) {
        if (c == "\n") {
          return { pos, type: "eol" };
        } else if (c === undefined) {
          return { pos, type: "eof" };
        }
      } else if (state == STATE_COMMENT_MULTI) {
        if (c == "=") {
          state = STATE_COMMENT_MULTI2;
        } else if (c === undefined) {
          return { pos, type: "eof" };
        }
      } else if (state == STATE_COMMENT_MULTI2) {
        if (c == "#") {
          return { pos, type: "eol" };
        } else if (c === undefined) {
         return { pos, type: "eof" };
        } else {
          state = STATE_COMMENT_MULTI;
        }
      } else if (state == STATE_NUMBER) {
        if (isNumber(c) || c == ".") {
          res.push(c);
        } else {
          this.p--;
          const w = res.join("");
          return { pos, type: "num", value: parseFloat(w) };
        }
      } else if (state == STATE_OPERATOR) {
        if (isOperator(c)) {
          res.push(c);
        } else {
          this.p--;
          const w = res.join("");
          return { pos, type: "operator", operator: w };
        }
      }
    }
  }
  backToken(token) {
    this.p = token.pos;
  }
  getExpression1() {
    let res = this.getValue();
    for (;;) {
      const op = this.getToken();
      if (op.type != "operator" || (
          op.operator != "nor" &&
          op.operator != "*" &&
          op.operator != "/" &&
          op.operator != "%" &&
          op.operator != "//"
      )) {
        this.backToken(op);
        return res;
      }
      const v2 = this.getValue();
      const o = op.operator;
      if (o != "nor" && o != "*" && o != "/" && o != "%" && o != "//") {
        //throw new Error("非対応の演算子が使われています: " + o);
        throw new Error("illegal operator: " + o);
      }
      res = {
        type: "BinaryExpression",
        left: res,
        operator: o,
        right: v2,
      };
    }
  }
  getExpression() {
    let res = this.getExpression1();
    for (;;) {
      const op = this.getToken();
      if (op.type != "operator" || op.operator == ",") {
        this.backToken(op);
        return res;
      }
      const v2 = this.getExpression1();
      if (op.operator == "+") {
        res = {
          type: "BinaryExpression",
          left: res,
          operator: "+",
          right: v2,
        };
      } else {
        if (typeof res == "string" || typeof v2 == "string") {
          //throw new Error("文字列では使用できない演算子です");
          throw new Error("this operator can not use for string");
        }
        if (op.operator == "-") {
          res = {
            type: "BinaryExpression",
            left: res,
            operator: "-",
            right: v2,
          };
        } else {
          //throw new Error("未対応の演算子です : " + op.operator);
          this.backToken(op);
          return res;
        }
      }
    }
  }
  getValue() {
    const t1 = this.getToken();
    if (t1.type == "(") {
      const res = this.getExpression();
      const t2 = this.getToken();
      if (t2.type != ")") {
        //throw new Error("カッコが閉じられていません");
        throw new Error("missing close blacket");
      }
      return res;
    }
    if (t1.type == "[") {
      const elements = [];
      for (;;) {
        const t2 = this.getToken();
        if (t2.type == "]") break;
        this.backToken(t2);
        elements.push(this.getExpression());
        const t3 = this.getToken();
        if (t3.type == "]") break;
        if (t3.type != "operator" && t3.operator != ",") {
          //throw new Error("配列の定義は , で区切る必要があります");
          throw new Error(`array values must separate by ","`);
        }
      }
      return {
        type: "ArrayExpression",
        elements,
      };
    }
    if (t1.type == "num" || t1.type == "string") {
      return {
        type: "Literal",
        value: t1.value,
      };
    } else if (t1.type == "operator" && t1.operator == "-") {
      return {
        type: "UnaryExpression",
        operator: "-",
        argument: this.getValue(),
      };
    } else if (t1.type == "var") {
      const chk = this.getToken();
      if (chk.type != "(") {
        this.backToken(chk);
        return this.getVar(t1.name);
      }
      // function call
      const args = [];
      const chk1 = this.getToken();
      if (chk1.type != ")") {
        this.backToken(chk1);
        for (;;) {
          args.push(this.getExpression());
          const chk2 = this.getToken();
          if (chk2.type == ")") break;
          if (chk2.type != "operator" && chk2.operator != ",") {
            //throw new Error("関数呼び出しのパラメータは , 区切りが必要です");
            throw new Error(`function call arguments must separate by  ","`);
          }
        }
      }
      return {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: t1.name,
        },
        arguments: args,
      };

      /*
    } else if (t1.operator == "-") {
      const t2 = this.getToken();
      if (t2.type == "num") {
        return {
          type: "Literal",
          value: -t2.value,
        };
      } else {
        throw new Error("式ではないものが指定されています : " + t1.type);
      }
      */
    } else {
      //throw new Error("式ではないものが指定されています : " + t1.type);
      throw new Error("illegal expression: " + t1.type);
    }
  }
  getConditionValue1() {
    const t1 = this.getToken();
    if (t1.type == "(") {
      const res = this.getCondition();
      const t2 = this.getToken();
      if (t2.type != ")") {
        //throw new Error("カッコが閉じられていません");
        throw new Error("missing blacket close");
      }
      return res;
    } else {
      this.backToken(t1);
    }
    //const v1 = this.getValue();
    const v1 = this.getExpression();
    const op = this.getToken();
    if (op.type != "operator") {
      this.backToken(op);
      return v1;
    }
    //const v2 = this.getValue();
    const v2 = this.getExpression();
    if (["==", "!=", ">", "<", ">=", ">=", "<="].indexOf(op.operator) == -1) {
      //throw new Error("条件式で未対応の演算子です : " + op.operator);
      throw new Error("illegal operator in condition : " + op.operator);
    }
    return {
      type: "BinaryExpression",
      left: v1,
      operator: op.operator,
      right: v2,
    };
  }
  getConditionValue() {
    const chknot = this.getToken();
    let flg = true;
    if (chknot.type == "not") {
      flg = false;
    } else {
      this.backToken(chknot);
    }
    const n = this.getConditionValue1();
    if (flg) {
      return n;
    } else {
      return {
        type: "UnaryExpression",
        operator: "not",
        argument: n,
      };
    }
  }
  getConditionAnd() {
    let res = this.getConditionValue();
    for (;;) {
      const op = this.getToken();
      if (op.type != "and") {
        this.backToken(op);
        return res;
      }
      const v2 = this.getConditionValue();
      if (op.type == "and") {
        res = {
          type: "BinaryExpression",
          left: res,
          operator: "and",
          right: v2,
        };
      } else {
        //throw new Error("未対応の演算子です : " + op.operator);
        throw new Error("illegal operator : " + op.operator);
      }
    }
  }
  getCondition() {
    let res = this.getConditionAnd();
    for (;;) {
      const op = this.getToken();
      if (op.type != "or") {
        this.backToken(op);
        return res;
      }
      const v2 = this.getConditionAnd();
      if (op.type == "or") {
        res = {
          type: "BinaryExpression",
          left: res,
          operator: "or",
          right: v2,
        };
      } else {
        //throw new Error("未対応の演算子です : " + op.operator);
        throw new Error("illegal operator : " + op.operator);
      }
    }
  }
  getVar(name) {
    let op = this.getToken();

    const array = [];
    for (;;) {
      if (op.type != "[") {
        this.backToken(op);
        break;
      }
      const idx = this.getExpression();
      const op2 = this.getToken();
      if (op2.type != "]") {
        //throw new Error("配列の要素指定が ] で囲われていません");
        throw new Error("missing close array blacket");
      }
      array.push(idx);
      op = this.getToken();
    }
    if (array.length == 0) {
      return {
        type: "Identifier",
        name: name,
      };
    }
    let left = {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: name,
      },
      property: array[0],
      computed: true,
      //optional: false,
    };
    for (let i = 1; i < array.length; i++) {
      left = {
        type: "MemberExpression",
        object: left,
        property: array[i],
        computed: true,
        //optional: false,
      };
    }
    return left;
  }
  parseCommand(body, forcetoken) {
    const token = forcetoken || this.getToken();
    //console.log("parseCommand", token);
    if (token.type == "eof") return false;
    if (BLACKET_MODE) {
      if (token.type == "}") {
        this.backToken(token);
        return false;
      }
    } else {
      if (["endif", "else", "elseif", "next", "until", "end"].indexOf(token.type) >= 0) {
        this.backToken(token);
        return false;
      }
    }
    if (token.type == "print") {
      const res = [];
      const chk = this.getToken(true);
      if (chk.type == "eol" || chk.type == "eof") {
        this.backToken(chk);
      } else {
        this.backToken(chk);
        for (;;) {
          res.push(this.getExpression());
          const op = this.getToken();
          if (op.type == "eol" || op.type == "eof") {
            this.backToken(op);
            break;
          }
          if (op.operator != ",") {
            this.backToken(op);
            break;
            //throw new Error("表示はコンマ区切りのみ対応しています");
          }
        }
      }
      body.push({
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "print",
          },
          arguments: res,
        },
      });
    } else if (token.type == "var" || token.type == "input") {
      const chk = this.getToken();
      if (chk.type == "(") { // function
        const params = [];
        const chk = this.getToken();
        if (chk.type != ")") {
          this.backToken(chk);
          for (;;) {
            params.push(this.getExpression());
            const cma = this.getToken();
            if (cma.type == ")") break;
            if (cma.type != "operator" && cma.operator != ",") {
              //throw new Error("引数の区切り , が必要です");
              throw new Error(`function call arguments must separete by ","`);
            }
          }
        }
        body.push({
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: token.name,
            },
            arguments: params,
          },
        });
      } else { // var
        this.backToken(chk);
        let token2 = token;
        const res = [];
        for (;;) {
          const left = this.getVar(token2.name);
          const op = this.getToken();
          if (op.type != "operator" || op.operator != "=") {
            //throw new Error("代入は変数の後に = で続ける必要があります");
            throw new Error(`assign operation must have "="`);
          }
          const right = this.getExpression();
          res.push({
            type: "AssignmentExpression",
            operator: "=",
            left,
            right,
          });
          //if (isConstantName(token2.name) && this.vars[token2.name] !== undefined) throw new Error("定数には再代入できません");
          //this.vars[token2.name] = val;

          const op2 = this.getToken();
          if (op2.type == "eol" || op2.type == "eof") {
            this.backToken(op2);
            break;
          }
          if (op2.operator != ",") {
            //throw new Error("代入はコンマ区切りのみ対応しています");
            this.backToken(op2);
            break;
          }
          token2 = this.getToken();
          if (token2.type != "var") {
            //throw new Error("コンマ区切りで続けられるのは代入文のみです");
            throw new Error("only assign operation after comma");
          }
        }
        if (res.length == 1) {
          body.push({
            type: "ExpressionStatement",
            expression: res[0],
          });
        } else {
          body.push({
            type: "ExpressionStatement",
            expression: {
              type: "SequenceExpression",
              expressions: res,
            }
          });
        }
      }
    } else if (token.type == "if") {
      const cond = this.getCondition();
      if (BLACKET_MODE) {
        const tthen = this.getToken();
        //console.log("tthen", tthen);
        if (tthen.type != "{") {
          //throw new Error(`if文の条件の後に"{"がありません`);
          throw new Error(`missing "{" after if`);
        }
      }
      const then = [];
      for (;;) {
        if (!this.parseCommand(then)) {
          const endblacket = this.getToken();
          if (BLACKET_MODE) {
            if (endblacket.type != "}") {
              //throw new Error(`"}"で閉じられていません`);
              throw new Error(`missing "}"`);
            }
            break;
          } else {
            if (endblacket.type != "endif" && endblacket.type != "else" && endblacket.type != "elseif") {
              throw new Error("if must have endif, else or elseif");
            }
            this.backToken(endblacket);
            break;
          }
        }
      }
      const telse = this.getToken();
      if (!BLACKET_MODE && telse.type == "elseif") {
        const bodyelse = [];
        const forcetoken = { type: "if" };
        this.parseCommand(bodyelse, forcetoken);
        body.push({
          type: "IfStatement",
          test: cond,
          consequent: {
            type: "BlockStatement",
            body: then,
          },
          alternate: bodyelse[0],
        });
      } else if (telse.type == "else") {
        if (BLACKET_MODE) {
          const telse2 = this.getToken();
          if (telse2.type == "if") {
            this.backToken(telse2);
            const bodyelse = [];
            this.parseCommand(bodyelse);
            body.push({
              type: "IfStatement",
              test: cond,
              consequent: {
                type: "BlockStatement",
                body: then,
              },
              alternate: bodyelse[0],
            });        
            return true;
          }
          if (telse2.type != "{") throw new Error(`else文の条件の後に"{"がありません`);
        }
        const bodyelse = [];
        for (;;) {
          if (!this.parseCommand(bodyelse)) {
            const endblacket = this.getToken();
            if (BLACKET_MODE) {
              if (endblacket.type != "}") {
                //throw new Error(`"}"で閉じられていません`);
                throw new Error(`missing "}"`);
              }
            } else {
              if (endblacket.type != "endif") {
                throw new Error("else must have endif");
              }
              //this.backToken(endblacket);
            }
            break;
          }
        }
        body.push({
          type: "IfStatement",
          test: cond,
          consequent: {
            type: "BlockStatement",
            body: then,
          },
          alternate: {
            type: "BlockStatement",
            body: bodyelse,
          },
        });        
      } else if (telse.type == "endif") {
        body.push({
          type: "IfStatement",
          test: cond,
          consequent: {
            type: "BlockStatement",
            body: then,
          },
          alternate: null,
        });
      }
    } else if (token.type == "while") {
      const cond = this.getCondition();
      //console.log("tthen", tthen);
      if (BLACKET_MODE) {
        const tthen = this.getToken();
        if (tthen.type != "{") throw new Error(`while文の条件の後に"{"がありません`);
      }
      const then = [];
      for (;;) {
        if (!this.parseCommand(then)) {
          const endblacket = this.getToken();
          if (BLACKET_MODE) {
            if (endblacket.type != "}") throw new Error(`while文が"}"で閉じられていません`);
          } else {
            if (endblacket.type != "next") throw new Error(`while must have next`);
          }
          break;
        }
      }
      body.push({
        type: "WhileStatement",
        test: cond,
        body: {
          type: "BlockStatement",
          body: then,
        }
      });
    } else if (token.type == "do") {
      if (BLACKET_MODE) {
        const tthen = this.getToken();
        if (tthen.type != "{") throw new Error(`do文の条件の後に"{"がありません`);
      }
      const then = [];
      for (;;) {
        if (!this.parseCommand(then)) {
          const endblacket = this.getToken();
          if (BLACKET_MODE) {
            if (endblacket.type != "}") throw new Error(`do文が"}"で閉じられていません`);
          } else {
            if (endblacket.type != "until") throw new Error(`do must have until`);
            this.backToken(endblacket);
          }
          break;
        }
      }
      const whileoruntil = this.getToken();
      if (BLACKET_MODE && whileoruntil.type == "while") {
        const cond = this.getCondition();
        body.push({
          type: "DoWhileStatement",
          body: {
            type: "BlockStatement",
            body: then,
          },
          test: cond,
        });
      } else if (whileoruntil.type == "until") {
        const cond = this.getCondition();
        body.push({
          type: "DoWhileStatement",
          body: {
            type: "BlockStatement",
            body: then,
          },
          test: {
            type: "UnaryExpression",
            operator: "not",
            argument: cond,
          },
        });
      } else {
        if (BLACKET_MODE) {
          throw new Error("do文の後は while または until が必要です");
        } else {
          throw new Error("do must have until");
        }
      }
    } else if (token.type == "for") {
      const varname = this.getToken();
      if (varname.type != "var") {
        //throw new Error("for文の後は変数名が必要です");
        throw new Error("need var name after for");
      }
      const eq = this.getToken();
      if (eq.operator != "=") {
        // throw new Error("for文の変数名の後は = が必要です");
        throw new Error("need = after for var name");
      }
      const initval = this.getExpression();
      const to = this.getToken();
      if (to.type != "to") {
        //throw new Error("for文の初期変数設定の後は to が必要です");
        throw new Error("need to after for initial assign");
      }
      const endval = this.getExpression();
      const chkstep = this.getToken();
      let step = {
        type: "Literal",
        value: 1,
      };
      if (chkstep.type != "step") {
        this.backToken(chkstep);
      } else {
        step = this.getExpression();
        if (!(
          step.type == "Literal" ||
          step.type == "UnaryExpression" && step.operator == "-" && step.argument.type == "Literal"
        )) {
          //throw new Error("stepには数値のみ指定可能です");
          throw new Error("step must be literal");
        }
      }
      if (BLACKET_MODE) {
        const tthen = this.getToken();
        if (tthen.type != "{") throw new Error(`for文の後に"{"がありません`);
      }
      const then = [];
      for (;;) {
        if (!this.parseCommand(then)) {
          const endblacket = this.getToken();
          if (BLACKET_MODE) {
            if (endblacket.type != "}") throw new Error(`for文が"}"で閉じられていません`);
          } else {
            if (endblacket.type != "next") throw new Error(`for must have "next"`);
          }
          break;
        }
      }
      const astvar = {
        type: "Identifier",
        name: varname.name,
      };
      const stepval = step.type == "Literal" ? step.value : -step.argument.value;
      body.push({
        type: "ForStatement",
        init: {
          type: "AssignmentExpression",
          operator: "=",
          left: astvar,
          right: initval,
        },
        test: {
          type: "BinaryExpression",
          left: astvar,
          operator: stepval > 0 ? "<=" : ">=",
          right: endval,
        },
        update: {
          type: "AssignmentExpression",
          operator: "=",
          left: astvar,
          right: {
            type: "BinaryExpression",
            left: astvar,
            operator: "+",
            right: step,
          },
        },
        body: {
          type: "BlockStatement",
          body: then,
        },
      });
    } else if (token.type == "function") {
      const varname = this.getToken();
      if (varname.type != "var") {
        //throw new Error("function文の後は関数名が必要です");
        throw new Error("need function name after function");
      }
      const blacket = this.getToken();
      if (blacket.type != "(") {
        //throw new Error("関数名の後は ( が必要です");
        throw new Error(`need "(" after function name`);
      }
      const params = [];
      const chk = this.getToken();
      if (chk.type != ")") {
        this.backToken(chk);
        for (;;) {
          const chk = this.getToken();
          if (chk.type != "var") {
            //throw new Error("引数名がありません");
            throw new Error("need parameter name");
          }
          params.push(chk.name);
          const cma = this.getToken();
          if (cma.type == ")") break;
          if (cma.type != "operator" && cma.operator != ",") {
            //throw new Error("引数の区切り , が必要です");
            throw new Error(`need comma for separation of parameters`);
          }
        }
      }
      if (BLACKET_MODE) {
        const b2 = this.getToken();
        if (b2.type != "{") throw new Error("関数の中身記述に { が必要です");
      }
      const body2 = [];
      for (;;) {
        if (!this.parseCommand(body2)) {
          const endblacket = this.getToken();
          if (BLACKET_MODE) {
            if (endblacket.type != "}") throw new Error(`関数が"}"で閉じられていません`);
          } else {
            if (endblacket.type != "end") throw new Error(`function must have end`);
          }
          break;
        }
      }
      body.push({
        type: "FunctionDeclaration",
        id: {
          type: "Identifier",
          name: varname.name,
        },
        params: params.map(i => ({ type: "Identifier", name: i })),
        body: {
          type: "BlockStatement",
          body: body2,
        }
      });
    } else if (token.type == "return") {
      body.push({
        type: "ReturnStatement",
        argument: this.getExpression(),
      });
    } else if (token.type == "break") {
      body.push({
        type: "BreakStatement",
      });
    } else {
      //throw new Error("対応していない type " + token.type + " です");
    }
    //console.log(token);
    return true;
  }
  parse() {
    this.p = 0;
    const body = [];
    while (this.parseCommand(body));
    const ast = { "type": "Program", body };
    this.ast = ast;
  }
  parseTokens() {
    this.p = 0;
    for (;;) {
      const c = this.getToken(true);
      console.log(c);
      if (c.type == "eof") break;
    }
  }
  getArrayIndex(ast, scope) {
    const prop = this.calcExpression(ast, scope);
    if (prop < 0 || typeof prop == "string" && parseInt(prop).toString() != prop) {
      throw new Error("配列には0または正の整数のみ指定可能です");
    }
    return prop;
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
          throw new Error("非対応の type です " + cmd.left.type);
        }
      } else if (cmd.type == "CallExpression") {
        const name = cmd.callee.name;
        if (name == "print") {
          this.output(cmd.arguments.map(i => this.calcExpression(i, scope)).join(" "));
        } else {
          if (!scope.isDefined(name)) {
            throw new Error("定義されていない関数 " + name + " が使われました");
          }
          const func = scope.getVar(name);
          if (ast.arguments.length != func.params.length) {
            throw new Error("引数の数が合っていません");
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
              throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
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
              throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
            }
          }
        } catch (e) {
          if (!(e instanceof Break)) {
            throw e;
          }
        }
      } else if (cmd.type == "ForStatement") {
        this.runBlock(cmd.init, scope);
        try {
          for (let i = 0;; i++) {
            const cond = this.calcExpression(cmd.test, scope);
            if (!cond) break;
            this.runBlock(cmd.body, scope);
            this.runBlock(cmd.update, scope);
            if (i >= MAX_LOOP) {
              throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
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
          throw new Error("すでに宣言済みに名前では関数を定義できません");
        }
        scope.setVar(name, cmd);
      } else if (cmd.type == "ReturnStatement") {
        const val = this.calcExpression(cmd.argument, scope);
        throw new Return(val);
      } else if (cmd.type == "BreakStatement") {
        throw new Break();
      } else {
        throw new Error("対応していない expression type が使われました。 " + cmd.type);
      }
    }
  }
  run() {
    this.scope = new Scope();
    this.runBlock(this.ast, this.scope);
    //console.log(this.vars);
  }
  getVarName(ast) {
    for (;;) {
      if (ast.type == "Identifier") return ast.name;
      else if (ast.type == "MemberExpression") ast = ast.object;
      else throw new Error("非対応の type です " + ast.type);
    }
  }
  calcExpression(ast, scope) {
    if (ast.type == "Literal") {
      return ast.value;
    } else if (ast.type == "Identifier") {
      if (!scope.isDefined(ast.name)) {
        //console.log("var", this.vars)
        throw new Error("初期化されていない変数 " + ast.name + " が使われました");
      }
      return scope.getVar(ast.name);
    } else if (ast.type == "MemberExpression") {
      const name = this.getVarName(ast);
      if (!scope.isDefined(name)) {
        throw new Error("初期化されていない配列 " + name + " が使われました");
      }
      const idx = this.getArrayIndex(ast.property, scope);
      const v = scope.getVar(name);
      if (typeof v == "string") {
        if (idx >= 0 && idx < v.length) return v[idx];
        return "";
      } else {
        return v[idx];
      }
    } else if (ast.type == "UnaryExpression") {
      const n = this.calcExpression(ast.argument, scope);
      if (ast.operator == "not") {
        return !n;
      } else if (ast.operator == "-") {
        return -n;
      } else {
        throw new Error("対応していない演算子 " + ast.operator + " です");
      }
    } else if (ast.type == "ArrayExpression") {
      const ar = ast.elements.map(i => this.calcExpression(i, scope));
      return ar;
    } else if (ast.type == "BinaryExpression" || ast.type == "LogicalExpression") {
      const n = this.calcExpression(ast.left, scope);
      const m = this.calcExpression(ast.right, scope);
      const op = ast.operator;
      if (typeof n == "string" || typeof m == "string") {
        if (op != "+" && op != "==" && op != "!=") throw new Error("文字列では使用できない演算子です: " + op);
      }
      if (op == "nor") {
        return n || m ? 0 : 1;
      } else if (op == "+") {
        return n + m;
      } else if (op == "-") {
        return n - m;
      } else if (op == "*") {
        return n * m;
      } else if (op == "/") {
        return n / m;
      } else if (op == "%") {
        return n % m;
      } else if (op == "//") {
        return Math.floor(n / m);
      } else if (op == "==") {
        return n == m;
      } else if (op == "!=") {
        return n != m;
      } else if (op == "<") {
        return n < m;
      } else if (op == "<=") {
        return n <= m;
      } else if (op == ">") {
        return n > m;
      } else if (op == ">=") {
        return n >= m;
      } else if (op == "and") {
        return n && m;
      } else if (op == "or") {
        return n || m;
      } else {
        throw new Error("対応していない演算子が使われました");
      }
    } else if (ast.type == "CallExpression") {
      const name = ast.callee.name;
      if (name == "input") {
        if (ast.arguments.length > 1) {
          throw new Error("引数の数が合っていません");
        }
        const q = ast.arguments.length ? this.calcExpression(ast.arguments[0], scope) : "入力してください";
        const s = prompt(q);
        if (s == null) return "";
        const f = parseFloat(s);
        if (!isNaN(f) && f.toString() == s) return f;
        return s;
      }
      if (!scope.isDefined(name)) {
        throw new Error("定義されていない関数 " + name + " が使われました");
      }
      const func = scope.getVar(name);
      if (ast.arguments.length != func.params.length) {
        throw new Error("引数の数が合っていません");
      }
      const scope2 = new Scope(scope);
      for (let i = 0; i < ast.arguments.length; i++) {
        const localvarname = func.params[i].name;
        scope2.setVar(localvarname, this.calcExpression(ast.arguments[i], scope), true);
      }
      try {
        this.runBlock(func.body, scope2);
        throw new Error("関数が値を返しませんでした");
      } catch (e) {
        if (e instanceof Return) {
          return e.getValue();
        }
        throw e;
      }
    } else {
      throw new Error("対応していない expression type が使われました。 " + ast.type);
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
