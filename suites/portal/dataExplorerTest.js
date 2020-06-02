Feature('Data Explorer');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const { expect } = chai;

Scenario('Faceted search - Numeric fields in faceted search are displayed as a slider @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Navigate to Data Explorer page (e.g. https://qa-brain.planx-pla.net/explorer)
            2. Numerical fields ar displayed as a slider
            3. The slider range is from the minimum value to the maximum value of the field
       `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Faceted search - Text fields in faceted search are displayed as checkboxes @manual', ifInteractive(
  async () => {
    const result = await interactive(`
              1. Navigate to Data Explorer page (e.g. https://qa-brain.planx-pla.net/explorer)
              2. Text fields ar displayed as checkboxes
              3. There is a separate checkbox for each value of the field
         `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Faceted search - Filters can be organized in multiple tabs @manual', ifInteractive(
  async () => {
    const result = await interactive(`
                1. Configure portal to show multiple tabs in filters like:
                    "filters": {
                        "tabs": [
                        {
                            "title": "Demographic",
                            "fields":[
                            "project_id",
                            "Days_To_Birth"
                            ]
                        },
                        {
                            "title": "ActionableMutations",
                            "fields":[
                            "ActionableMutations.Lab",
                            "ActionableMutations.DaysFromAnchorDateToBxDate"
                            ]
                        },
                        {
                            "title": "Oncology_Primary",
                            "fields":[
                            "Oncology_Primary.Multiplicitycounter",
                            "Oncology_Primary.ICDOSite"
                            ]
                        }
                        ]
                    }
                2. Navigate to Data Explorer page (e.g. https://qa-brain.planx-pla.net/explorer)
                3. Separate tabs should be shown in faceted search as configured
                4. Filters in each tab should correspond to the configuration
           `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Faceted search - Display names can be set for the filters @manual', ifInteractive(
  async () => {
    const result = await interactive(`
                  1. Configure portal to display field names differently, like:
                  "guppyConfig": {
                    "dataType": "patients",
                    "nodeCountTitle": "Patients",
                    "fieldMapping": [
                        {
                            "id": "Oncology_Primary.Multiplicitycounter",
                            "name": "OP_Multiplicity"
                        }
                    ]
                  }
                  2. Navigate to Data Explorer page (e.g. https://qa-brain.planx-pla.net/explorer)
                  3. Filter display name is as per the above configuration
             `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Faceted search - Data shown in charts corresponds to filters set @manual', ifInteractive(
  async () => {
    const result = await interactive(`
              1. Navigate to Data Explorer page (e.g. https://qa-brain.planx-pla.net/explorer)
              2. Vary the filter selections
              3. Data shown in the charts varies to show data pertaining to the selections
         `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Faceted search - Nested data - Nested fields can be shown @manual', ifInteractive(
  async () => {
    const result = await interactive(`
                1. Configure portal to show nested fields (like "ActionableMutations.Lab") in dataExplorerConfig
                2. Navigate to Data Explorer page (e.g. https://qa-brain.planx-pla.net/explorer)
                3. The configured fiels is shown in the faceted search
           `);
    expect(result.didPass, result.details).to.be.true;
  },
));
