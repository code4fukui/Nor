import * as t from "https://deno.land/std/testing/asserts.ts";
import { Nor } from "./Nor.js";

const run = (s) => {
  const res = [];
  const runtime = new Nor(s, (s) => res.push(s));
  runtime.run();
  return res;
};

Deno.test("print", () => {
  t.assertEquals(run("print 3"), ["3"]);
  t.assertEquals(run(`print "ABC"`), ["ABC"]);
  t.assertEquals(run(`print "ABC", 3`), ["ABC 3"]);
});
Deno.test("var", () => {
  t.assertEquals(run("a = 1\nb = 0\nc = a nor b\nprint c"), ["0"]);
  t.assertEquals(run("a = 0\nb = 0\nc = a nor b\nprint c"), ["1"]);
});
Deno.test("const", () => {
  t.assertEquals(run("A = 1\nprint A"), ["1"]);
  t.assertThrows(() => run("A = 1\nA = 2"));
  t.assertEquals(run("Aa = 1\nAa = 2\nprint Aa"), ["2"]);
});
