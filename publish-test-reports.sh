#!/bin/bash

current_folder=$(echo $PWD | awk -F "/" '{print $NF}')
if [ "$current_folder" == "gen3-qa" ]; then
    echo "please run this script from the root folder of your Gen3 QA workspace. e.g., ~/workspace/gen3-qa"
    exit 1
fi

# if a custom folder is not provided, expect to find all the CodeceptJS testsuite .xml files
# inside the "gen3-qa/output" folder 
if [ -z $1 ]; then test_results_folder="output"; else test_results_folder="$1"; fi

which allure
RC=$?
if [ $RC -ne 0 ]; then
    echo "The allure CLI is not installed. Please follow the instructions on https://github.com/allure-framework/allure2#download to proceed."
    exit 1
fi

allure generate $test_results_folder
RC=$?
if [ $RC -ne 0 ]; then
    echo "The 'allure generate' command failed. Aborting script."
    exit 1
fi

