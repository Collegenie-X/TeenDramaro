import { register } from "node:module";
import { pathToFileURL } from "node:url";
register(pathToFileURL(new URL("./ts-resolver.mjs", import.meta.url).pathname));
