import fs from "fs";
import path from "path";

const inputPathResolved = path.join(
  "/Users/a1ex/Desktop/resources/pdfs/",
  "A.pdf"
);
console.log("🐽🐽 test.ts inputPathResolved:", inputPathResolved);

console.log(fs.readdirSync("/Users/a1ex/Desktop/resources/pdfs"));
console.log(fs.existsSync("/Users/a1ex/Desktop/resources/pdfs/A.pdf"));
