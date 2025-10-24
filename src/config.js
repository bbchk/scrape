import "dotenv/config";
const env = process.env;

export default config = {
  headless:       env.HEADLESS === "true",
  executablePath: env.CHROME_EXECUTABLE_PATH,
  userDataDir:    env.CHROME_USER_DATA_DIR,
  startUrl:       env.START_URL
};
