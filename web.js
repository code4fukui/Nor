import { Nor } from "./Nor.js";

const scrs = document.querySelectorAll(`script[type="text/nor"]`);
for (const scr of scrs) {
  const src = scr.textContent;
  const runtime = new Nor(src, (s) => {
    alert(s);
  });
  runtime.run();
}
