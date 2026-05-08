import fs from "fs-extra";
import { parse, stringify } from "yaml";

const text = fs.readFileSync("foo.yaml", "utf-8");
const data = parse(text);
let list = [...data.proxies].filter(item => item.type === "vless");
list = list.filter(item => item._excluded_times >= 6);
const result = stringify({ proxies: list });

fs.writeFileSync("bar.yaml", result);
