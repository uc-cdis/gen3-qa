import os
import subprocess

test_suites_that_cant_run_in_parallel = [
    "test-apis-dbgapTest",                             # not thread-safe
    "test-google-googleDataAccessTest",                # not thread-safe
    "test-google-googleServiceAccountRemovalTest",     # not thread-safe
    "test-guppy-guppyTest",                            # not thread-safe
    "test-smokeTests-brainTests",                      # manual (executable test)
    "test-batch-GoogleBucketManifestGenerationTest",   # @donot
    "test-batch-S3BucketManifestGenerationTest",       # @donot
    "test-portal-dataguidOrgTest",                     # @donot
    "test-suites-fail",                                # special suite to force failures for invalid test labels
    "test-portal-roleBasedUITest",                     # manual (executable test)
    "test-portal-limitedFilePFBExportTestPlan",        # manual (executable test)
    "test-access-accessGUITest",                       # manual (executable test)
    "test-portal-tieredAccessTest",                    # manual (executable test)
    "test-portal-discoveryPageTestPlan",               # manual (executable test)
    "test-portal-dashboardReportsTest",                # manual (executable test)
    "test-guppy-nestedAggTest",                        # manual (executable test)
    "test-portal-404pageTest",                         # manual (executable test)
    "test-apis-dcfDataReplicationTest",                # manual (executable test)
    "test-portal-exportPfbToWorkspaceTest",            # manual (executable test)
    "test-portal-studyViewerExportToWorkspaceTest",    # manual (executable test)
    "test-portal-homepageChartNodesExecutableTestPlan",# manual (executable test)
    "test-portal-profilePageTest",                     # manual (executable test)
    "test-portal-terraExportWarningTestPlan",          # manual (executable test)
    "test-pelican-exportPfbTest",                      # not ready
    "test-regressions-exportPerformanceTest",          # legacy (disabled test)
    "test-regressions-generateTestData",               # legacy (disabled test)
    "test-regressions-queryPerformanceTest",           # legacy (disabled test)
    "test-regressions-submissionPerformanceTest",      # legacy (disabled test)
    "test-dream-challenge-DCgen3clientTest",           # legacy (disabled test)
    "test-dream-challenge-synapaseLoginTest",          # legacy (disabled test)
    "test-prod-checkAllProjectsBucketAccessTest",      # prod test
    "test-portal-pfbExportTest",                       # nightly build test
    "test-apis-etlTest",                               # long-running test
    "test-apis-centralizedAuth",                       # long-running test
    "test-google-googleServiceAccountTest",            # long-running test
    "test-google-googleServiceAccountKeyTest",         # long-running test
    "test-portal-dataUploadTest",                      # SUPER long-running test
    "test-portal-indexingPageTest",                    # long-running test
    "test-apis-metadataIngestionTest",                 # long-running test
    "test-apis-auditServiceTest"                       # long-running test
]


def collect_test_suites_from_codeceptjs_dryrun():
    my_env = os.environ.copy()
    bashCommand = "npx codeceptjs dry-run"
    process = subprocess.Popen(
        bashCommand.split(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=my_env
    )
    output, error = process.communicate()

    test_suites = []

    for line in output.splitlines():
        line = line.decode("utf-8")
        # print(f'### line: {line}')

        # ignore pre-release test suites
        if "pre-release" in line:
            continue
        elif ".js" in line:
            full_path_to_test_js = line.split("/")

            suite_folder = full_path_to_test_js[-2]
            # print(f'## suite_folder: {suite_folder}')
            test_script = full_path_to_test_js[-1]
            # print(f'## test_script: {test_script}')
            test_script_without_extension = test_script[0 : test_script.index(".")]

            test_suite = f"test-{suite_folder}-{test_script_without_extension}"
            test_suites.append(test_suite)

    return test_suites


def main():
    test_suites = collect_test_suites_from_codeceptjs_dryrun()

    for ts in test_suites:
        if ts not in test_suites_that_cant_run_in_parallel:
            print(ts)

    # print(f"## ## test_suites: {test_suites}")
    # print(f"## test_suites size: {len(test_suites)}")


if __name__ == "__main__":
    main()
