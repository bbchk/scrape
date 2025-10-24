import "dotenv/config";
const env = process.env;

export default {
  headless:       env.HEADLESS === "true",
  executablePath: env.CHROME_EXECUTABLE_PATH,
  userDataDir:    env.CHROME_USER_DATA_DIR,
  startUrl:       env.START_URL
};
