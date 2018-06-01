
Feature('Submission');

Scenario('test submission page', (I) => {
  I.load('');
  I.seeCookie('access_token');
  I.click('Data Submission');
  I.seeInCurrentUrl('/submission');
  I.seeSubmissionDetails();
});
