import { writeFile } from "fs/promises";

export async function writeToFile(data, path) {
  try {
    await writeFile(path, data);
    console.log("Data written to file");
  } catch (error) {
    console.error(`Error writing data to file: ${error}`);
  }
}
