module.exports = {
    registrationPath: '/mds/metadata',
    requestPath: '/portal/study-reg/request-access',
    registerPath: '/portal/study-reg',

    searchBar: '//input[@placeholder="Search studies by keyword..."]',

    studyDrawer: '//div[@class="ant-drawer-body"]',
    studyTable: '//div[@class="discovery-studies-container"]',
    requestAccessButton: '//span[normalize-space()="Request Access to Register This Study"]',
    backButton: '//button[@class="ant-btn ant-btn-text discovery-modal__close-button"]',
    studyCheckBoxButton: '//td[@class="ant-table-cell ant-table-selection-column"]//label[@class="ant-checkbox-wrapper ant-checkbox-wrapper-disabled"]',

    //REQUEST ACCESS STAGE
    formPage: '//div[@class="generic-access-form-container"]',
    projectTitle: '//textarea[@id="generic-access-request-form_Study Grant_doNotInclude"]',
    firstName: '//input[@id="generic-access-request-form_First Name"]',
    lastName: '//input[@id="generic-access-request-form_Last Name"]',
    emailAddress: '//input[@id="generic-access-request-form_E-mail Address"]',
    institute: '//input[@id="generic-access-request-form_Affiliated Institution"]',
    roleRadioButton:'//input[@value="Principal Investigator"]',
    submitButton: '//button[@type="submit"]',
    successMessage: '//div[@class="ant-result ant-result-success"]',
    goToDiscoverPageButton: '//button[@type="button"]',

    //REGISTER STUDY STAGE
    registerStudyButton: '//span[normalize-space()="Register This Study"]',
    registerForm: '//form[@id="study-reg-form"]',
    studyTitle: '//span[@class="ant-select-selection-item"]',
    cedarUUID: '//input[@placeholder="Provide your CEDAR user UUID here"]',
    registerSubmitButton: '//span[normalize-space()="Submit"]',
};