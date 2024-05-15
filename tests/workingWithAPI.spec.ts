import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json';

test.beforeEach(async ({ page }) => {
  await page.route('*/**/api/tags', async route => {
    await route.fulfill({
      body: JSON.stringify(tags)
    })
  })

  await page.goto('https://angular.realworld.how');
  await page.getByText('Sign in').click();
  await page.getByRole('textbox', {name: "Email"}).fill('sanjayspear@gmail.com');
  await page.getByRole('textbox', {name: 'Password'}).fill('Welcome@123');
  await page.getByRole('button').click();
})

test('has title', async ({ page }) => {
  await page.route('*/**/api/articles*', async route => {
    const response = await route.fetch();
    const responseBody = await response.json();
    responseBody.articles[0].title = 'This is a test MOCK title';
    responseBody.articles[0].description = 'This is a test MOCK description'

    await route.fulfill({
      body: JSON.stringify(responseBody)
    })
  })

  await page.waitForSelector('text="Global Feed"', { state: 'visible' });
  await page.getByText('Global Feed').click();

  await expect(page.locator('.navbar-brand')).toHaveText('conduit');
  await page.waitForTimeout(3000);
  await expect(page.locator('app-article-list h1').first()).toHaveText('This is a test MOCK title');
  await expect(page.locator('app-article-list p').first()).toHaveText('This is a test MOCK description');
});

test('delete an article', async ({ page, request }) => {
  const response = await request.post('https://api.realworld.io/api/users/login', {
    data: {
      "user": { "email": "sanjayspear@gmail.com", "password": "Welcome@123" }
    }
  })

  const responseBody = await response.json()
  const accessToken = responseBody.user.token;

  const articleResponse = await request.post('https://api.realworld.io/api/articles/', {
    data: {
      "article":{"title":"This is a test article created through api","description":"This is a test description","body":"This is a test body","tagList":[]}
    },
    headers: {
      Authorization: `Token ${accessToken}`
    }
  })
  expect(articleResponse.status()).toEqual(201);
  await page.getByText('Global Feed').click();
  await page.getByText('This is a test article created through api').click();
  await page.getByRole('button', {name: 'Delete Article'}).first().click();
  await page.getByText('Global Feed').click();

  //Validation
  await expect(page.locator('app-article-list h1').first()).not.toContainText('This is a test article created through api');
})
