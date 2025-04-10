# Wikipedia Watchlist Playwright Tests

This repository contains automated end-to-end tests written with [Playwright](https://playwright.dev) to verify the functionality of the Wikipedia watchlist feature. It uses Playwright's storage state to persist login sessions across test runs.

## Features Covered

- Add multiple articles to the watchlist via article pages
- Verify articles appear in the "Edit Watchlist" UI
- Remove articles from the watchlist
- Confirm article removal reflects accurately
- Navigate from a watchlist item to the article page and verify the title
- Automatically clear the watchlist and log out after tests complete

---
## Prerequisites

Before you begin, ensure you have the following installed:

* [Node.js](https://nodejs.org/) (includes `npm`)
* [Git](https://git-scm.com/) (for cloning the repository)

Also, make sure you have a valid [Wikipedia account](https://en.wikipedia.org/w/index.php?title=Special:CreateAccount) for login-based tests.

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/mchc1/wiki-watchlist.git
    cd wiki-watchlist
    ```

2.  **Install Dependencies:**
    Install the necessary Node.js packages, including Playwright and `dotenv`.
    ```bash
    npm install
    ```

3.  **Install Playwright Browsers:**
    This command downloads the browser binaries required by Playwright.
    ```bash
    npx playwright install
    ```

## Configuration: Setting Up Wikipedia Credentials

These tests require you to be logged into a Wikipedia account. Instead of logging in during each test run, this setup uses Playwright's **Storage State** feature. This means you log in *once*, save the session's state (cookies, local storage), and the tests will reuse this state to run as if already logged in. All you need is a .env file in the project root to save your credentials.

**One Step to Add Wikipedia Credentials:**

1.  **Set Environment Variables:**
    For sensitive information like credentials, recommended to use text editor to add your info to your .env file. Run the following to create the file:
    ```bash
    touch .env
    echo 'WIKI_USER=<Your Username>' >> .env
    echo 'WIKI_PASS=<Your Password>' >> .env
    ```
    
    Then open .env in your text editor to add your info directly:
    ```dotenv
    # .env file
    WIKI_USER=<Your Username>
    WIKI_PASS=<Your Password>
    ```

**Security Note:** The `storageState.json` and .env files will contain sensitive information. Ensure these are added to your `.gitignore` files.

```gitignore
[...]
.env
.auth/
```

## Run the tests

Run all tests headlessly using:
```bash
npx playwright test
```
Or, run all tests in UI mode:
```bash
npx playwright test --ui
```
Playwright will generate a `storageState.json` file as it runs all the test cases.

## Project structure
```pgsql
.
├── .auth/                  # Stores the login session
│   └── storageState.json
├── node_modules
├── playwright-report
├── test-results
├── tests/
│   └── watchlist.spec.js
├── .env                    # Wikipedia credentials (not committed)
├── .gitignore
├── package.json
├── playwright.config.js
├── README.md
```
