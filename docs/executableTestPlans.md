# TL;DR

Every gen3 feature should publish an executable test plan in https://github.com/uc-cdis/gen3-qa
under the `suites/` folder.
A test plan can support manual tests via `interactive` helpers.

## Overview

We implement a process that allows a test plan to evolve from manual checks carried out by members of the QA team to a fully automated test suite execute by our CICD pipeline.  [Codeceptjs](https://codecept.io) supports automated tests, but how can we leverage codeceptjs to execute and generate reports for manual test cycles?

The [interactive.js](../utils/interactive.js) helpers allow us to write codeceptjs test suites that present instructions to a qa tester, then interactively collect the results of the test.  This facility allows us to intermix manual and automated tests, and also support partially automated tests.

For example, one scenario pelican's [exportPfbTest](../suites/pelican/exportPfbTest.js) looks like this:

```
Scenario('Download whole of the database', ifInteractive(
  async (I) => {
    const result = await interactive(`
        1. The user should login with a valid user login credentials (Google login). After successful login, user should be able to see all the cases in the Graph.
        2. Click on 'Exploration Tab' on the top. Exploration Page is opened with Filters and Cases tables.
        3. Click on 'Export to PFB' button. A pop-on window opens on the bottom of the the page which shows the progress of the export and shows extimated time.
        4. After the export is completed, the pop-on windown will show a pre-assigned URL.
        `);
    expect(result.didPass, result.details).to.be.true;
  }
));
```
