// this test targets all the login in the env with 
// InCommons Login and Google Login
const loginProps = require('../../services/portal/login/loginProps.js');

Feature('InCommons and Google Login @requires-portal @requires-fence');

const I = actor();

Scenario('Login with InCommons Login', async ({ I, home, login }) => {
    home.do.goToHomepage();
    I.saveScreenshot('Homepage.png');
    I.seeElement(login.props.inCommonsLoginButton);
    I.click(login.props.inCommonsSelection);
    I.click('#react-select-2-option-4113')
    I.saveScreenshot('afterSelection.png');
    I.click(login.props.inCommonsLoginButton);
    I.wait(5);
    I.saveScreenshot('afterLogin.png');
    // check if you are directed to orka login
    I.seeInCurrentUrl('shibboleth2');
    I.saveScreenshot('shibbolethPage.png')
});

