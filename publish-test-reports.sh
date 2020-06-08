#!/bin/bash

QA_USER="qaplanetv1"

# expect to find all the CodeceptJS testsuite .xml files inside the "gen3-qa/output" folder
help() {
  cat - <<EOM
  Use: ./publish-test-reports.sh <path_to_test_results_folder> <name_of_the_report>
  e.g., ./publish-test-reports.sh output dcf_release
EOM
}

if [[ $# -lt 2 || "$1" =~ ^-*h(elp)?$ ]]; then
  help
  exit 1
fi

current_folder=$(echo $PWD | awk -F "/" '{print $NF}')
if [ "$current_folder" != "gen3-qa" ]; then
    echo "please run this script from the root folder of your Gen3 QA workspace. e.g., cd ~/workspace/gen3-qa"
    exit 1
fi

test_results_folder="$1"
name_of_the_report="$2"

which allure
RC=$?
if [ $RC -ne 0 ]; then
    echo "The allure CLI is not installed. Please follow the instructions on https://github.com/allure-framework/allure2#download to proceed."
    exit 1
fi

current_timestamp=$(date "+%Y%m%d_%H%M%S")
gen3_qa_report_folder="${name_of_the_report}_${current_timestamp}"

# Generate gen3 QA report folder
allure generate $test_results_folder -o $gen3_qa_report_folder
RC=$?
if [ $RC -ne 0 ]; then
    echo "The 'allure generate' command failed. Aborting script."
    exit 1
fi

# Copy the gen3 QA report folder to the DEV VM
scp -o ConnectTimeout=30 -r ./$gen3_qa_report_folder $QA_USER@cdistest.csoc:./reports
RC=$?
if [ $RC -ne 0 ]; then
    echo "Something wrong happened while trying to SCP (ssh/secure copy) the $gen3_qa_report_folder into the DEV VM."
    echo "Please make sure you are connected to the VPN."
    exit 1
fi

report_url_path="QA/$(date +%Y)/$(date +%-m)/${gen3_qa_report_folder}"

# ssh to the Dev VM and run the gen3 dashboard publish secure command to upload the contents of the folder and publish the report
ssh qaplanetv1@cdistest.csoc "source ~/.bashrc; gen3 dashboard publish secure ./reports/$gen3_qa_report_folder $report_url_path"
if [ $RC -ne 0 ]; then
    echo "Something wrong happened while trying to run 'gen3 dashboard publish secure ...'"
    echo "Please check if the Dev VM and the QA k8s namespace are ok (https://qa.planx-pla.net/dashboard)"
    exit 1
fi

echo "Publishing report..."
sleep 5

echo "Test report successfully published to: https://qa.planx-pla.net/dashboard/Secure/${report_url_path}/index.html"
echo
read -p "Do you wish to open this URL in your browser now? (Make sure you are authenticated on [https://qa.planx-pla.net]). [y/N] " -n 1 -r REPLY
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open https://qa.planx-pla.net/dashboard/Secure/${report_url_path}/index.html
fi

echo "done"
