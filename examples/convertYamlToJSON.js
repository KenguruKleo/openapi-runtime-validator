const fs = require("fs");

const yaml = require("js-yaml");

try {
  const doc = yaml.load(fs.readFileSync("./schema.yaml", "utf8"));
  fs.writeFileSync("./schema.json", JSON.stringify(doc, null, 2));
  console.log("Successfully generated!");
} catch (e) {
  console.log(e);
}
