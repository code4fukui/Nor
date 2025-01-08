import { dir2array } from "https://js.sabae.cc/dir2array.js";
import { CSV } from "https://js.sabae.cc/CSV.js";

const ext = ".nor";

const fns = await dir2array("examples");
const list = [];
for (const fn of fns) {
  if (!fn.endsWith(ext)) continue;
  if (fn == "test" + ext) continue;
  const s = await Deno.readTextFile("examples/" + fn);
  const ss = s.split("\n");
  const title = ss[0].substring(1).trim();
  list.push({
    fn,
    title,
  });
}
const title2n = (s) => {
  const n = parseInt(s);
  //console.log(s, n)
  return n;
};
list.sort((a, b) => title2n(a.title) - title2n(b.title));
await Deno.writeTextFile("examples.csv", CSV.stringify(list));
