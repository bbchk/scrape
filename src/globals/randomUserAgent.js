import randomUseragent from "random-useragent";

let userAgents = randomUseragent.getAll();
userAgents = userAgents.filter((userAgent) => !userAgent.includes("MSIE"));
export const randomUserAgent =
  userAgents[Math.floor(Math.random() * userAgents.length)];
