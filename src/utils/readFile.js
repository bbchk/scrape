import fs from "fs";
import fsPromises from "fs/promises";
import readline from "readline";

export async function readJson(filePath) {
  try {
    const jsonString = await fsPromises.readFile(filePath, "utf8");
    const jsonObj = JSON.parse(jsonString);
    return jsonObj;
  } catch (err) {
    console.log("Error:", err);
  }
}

export async function readTxtLinesToArray(filename) {
  let array = [];
  const fileStream = fs.createReadStream(filename);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line === "") break;
    array.push(line);
  }

  return array;
}
