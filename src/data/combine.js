import * as fs from "fs";
import * as path from "path";
import { readJson } from "../io/readFile.js";

// Get all .json files in the current directory
const jsonFiles = fs
  .readdirSync("./")
  .filter((file) => path.extname(file) === ".json");

let combinedArray = [];

jsonFiles.forEach((file) => {
  // Read each file and parse the JSON array
  const jsonArray = JSON.parse(fs.readFileSync(file, "utf8"));
  // Combine the arrays
  combinedArray = [...combinedArray, ...jsonArray];
});

// Write the combined array to a new .json file
fs.writeFileSync("combined.json", JSON.stringify(combinedArray, null, 2));
