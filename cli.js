import { Nor } from "./Nor.js";

const fn = Deno.args[0];
const s = await Deno.readTextFile(fn);
new Nor(s).run();
