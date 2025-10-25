  async function getName() {
    const name = await page.$(selectors.landing.name);
    return await page
      .evaluate((el) => el.textContent, name)
      .catch((e) => console.log(`name is not found\n`));
  }

