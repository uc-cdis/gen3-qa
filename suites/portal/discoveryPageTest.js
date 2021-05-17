const uuid = require('uuid');
const user = require('../../utils/user.js');

const I = actor();
I.cache = {};

Feature('Discovery page');

Scenario('User is able to navigate to Discovery page @manual', ({ discovery }) => {
  discovery.do.goToPage();
  discovery.ask.isPageLoaded();
});

Scenario('Publish a study, search and export to workspace @manual', ({ mds, discovery }) => {
  // Publish study metadata
  const GUID = uuid.v4();
  I.cache.studyId = GUID;

  const studyMetaData = {
    _guid_type: 'discovery_metadata',
    gen3_discovery: {
      tags: [{
        category: 'Other',
        name: 'AUTOTEST Tag',
      },
      ],
      authz: [
        '/programs/open/projects/BACPAC',
      ],
      sites: 3,
      summary: '[AUTOTEST] The BACPAC Research Program, Data Integration, Algorithm Development, and Operations Management Center (DAC) will bring cohesion to research performed by the participating Mechanistic Research Centers, Technology Research Sites, and Phase 2 Clinical Trials Centers. DAC Investigators will share their vision and provide scientific leadership and organizational support to the BACPAC Consortium. The research plan consists of supporting design and conduct of clinical trials with precision interventions that focus on identifying the best treatments for individual patients. The DAC will enhance collaboration and research progress with experienced leadership, innovative design and analysis methodologies, comprehensive research operations support, a state-of-the-art data management and integration system, and superior administrative support. This integrated structure will set the stage for technology assessments, solicitation of patient input and utilities, and the evaluation of high-impact interventions through the innovative design and sound execution of clinical trials, leading to effective personalized treatment approaches for patients with chronic lower back pain.',
      location: 'Chapel Hill, Nc',
      subjects: 150,
      __manifest: [
        {
          md5sum: '694b1d13b8148756442739fa2cc37fd6', // pragma: allowlist secret
          file_name: 'test6.csv',
          file_size: 16,
          object_id: '9a44056e-5b9e-42c3-b3f8-85bc210c7b3f',
        },
      ],
      study_name: 'BACPAC Research Consortium',
      study_type: 'Other',
      institutions: 'University Of North Carolina Chapel Hill',
      year_awarded: 2019,
      investigators: 'Lavange, Lisa',
      project_title: '[AUTOTEST] Back Pain Consortium (BACPAC) Research Program Data Integration, Algorithm Development and Operations Management Center',
      protocol_name: 'BACPAC Minimum Dataset Example',
      project_number: '1U24AR076730-01',
      administering_ic: 'NIAMS',
      advSearchFilters: [
        {
          key: 'Research Focus Area',
          value: 'AUTOTEST Adv. Search',
        },
      ],
      research_program: 'Back Pain Consortium Research Program',
      research_question: 'To inform a precision medicine approach to cLBP.',
      study_description: 'Observational',
      research_focus_area: 'Clinical Research in Pain Management',
    },
  };
  mds.do.createMetadataRecord(user.mainAcct.accessTokenHeader, I.cache.studyId, studyMetaData);

  discovery.do.goToPage();

  // Tag search
  discovery.do.tagSearch('Other', 'AUTOTEST Tag');
  I.saveScreenshot('clicked_tag.png');
  discovery.ask.isStudyFound(I.cache.studyId);

  // Text search
  I.refreshPage();
  discovery.do.textSearch('[AUTOTEST]');
  I.saveScreenshot('entered_text.png');
  discovery.ask.isStudyFound(I.cache.studyId);

  // Advanced search
  I.refreshPage();
  discovery.do.advancedSearch(['AUTOTEST Adv. Search']);
  I.saveScreenshot('advanced_search.png');
  discovery.ask.isStudyFound(I.cache.studyId);

  // Open in workspace
  discovery.do.openInWorkspace(I.cache.studyId);
  I.wait(10);
  I.seeInCurrentUrl('/workspace');
}).tag('@discoveryPage', '@e2eTest');

After(({ mds }) => {
  mds.do.deleteMetadataRecord(user.mainAcct.accessTokenHeader, I.cache.guid);
});
