# Homepage Chart Nodes Test Plan
Homepage Chart Nodes documentation: https://github.com/uc-cdis/cdis-wiki/blob/0d828c73dcec7f37eba63ac453e56f1d4ce46d47/dev/gen3/guides/ui_etl_configuration.md#portal-folder 

## Setup
1. Peregrine should have public datasets endabled (manifest.json: `global.public_datasets: true`)
2. Test user should have access to at least one project (_accessible projects_) and should not have access to at least one project (_unaccessible projects_)

## Homepage Chart Nodes Disabled
> Setup: The `components.index.homepageChartNodes` field should NOT be present in the portal config.

1. (not logged in) The home page (`/`) should redirect to the login page (`/login`).
2. (logged in as the test user) The home page (`/`) should display a chart displaying summary data of ONLY the _accessible projects_.
3. The `/submission` page should have a table titled `List of Projects`. The table should ONLY list the _accessible projects_.

## Homepage Chart Nodes Enabled
> Setup: The `components.index.homepageChartNodes` field should be set in the [portal config](https://github.com/uc-cdis/cdis-wiki/blob/0d828c73dcec7f37eba63ac453e56f1d4ce46d47/dev/gen3/guides/ui_etl_configuration.md#portal-folder).
1. (logged out) The home page (`/`) should display a chart showing summary data for all projects.
2. (logged in as test user) the home page (`/`) should display a chart identical to 1.
3. The `/submission` page should have a table titled `List of Projects`. The table should ONLY list the _accessible projects_.