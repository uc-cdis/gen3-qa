module.exports = {
  path: 'workspace',
  readyCue: {
    css: '.workspace__options',
  },
  // Launch button
  getLaunchButton: (name) => ({
    xpath: `//h3[text()="${name}"]/parent::div[@class="workspace-option"]/button[text()="Launch"]`,
  }),
  // Launched workspace
  iframeWorkspace: {
    xpath: '//iframe[@class="workspace"]',
  },
  // Jupyter notebook
  jupyterNb: {
    xpath: '//body[@class="notebook_app command_mode"]',
  },
  // New button in Jupyter notebook
  jupyterNbNewButton: {
    xpath: '//button[@id="new-dropdown-button"]',
  },
  // Python 3 kernel from New dropdown
  jupyterNbNewPython3: {
    xpath: '//li[@id="kernel-python3"]',
  },
  // Input for command in Jupyter notebook
  jupyterNbInput: {
    xpath: '//div[@class="input_area"]',
  },
  // Run button in Jupyter notebook
  jupyterNbRunButton: {
    xpath: '//button[@aria-label="Run"]',
  },
  // Output of running a cell
  jupyterNbOutput: {
    xpath: '//div[@class="output_subarea output_text output_stream output_stdout"]',
  },
};
