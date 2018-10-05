#!/usr/bin/env bash
set -e
#
# This script helps automate creating and configuring GCP projects to be used
# with the gen3-qa tests
#

cat << EOM
This script automates creating and configuring GCP projects to be used with the gen3-qa tests.
For this script to run properly, you must have the gcloud SDK installed
For setup, you'll need the following information:
    -Google account credentials for an account NOT WITHIN an organization (e.g. generic gmail account)
    -Google account credentials for an account WITHIN an organization (e.g. email within plan-x organization)
    -Fence's service account email
EOM

function addFenceServiceAccount {
  local projID=$1
  local fenceSA=$2
  local account=$3
  printf "\n=================================\n"
  printf "Adding fence service account to ${projID}\n"
  printf "=================================\n"
  gcloud projects add-iam-policy-binding ${projID} --member="serviceAccount:${fenceSA}" --role="roles/editor" --account ${account}
  gcloud projects add-iam-policy-binding ${projID} --member="serviceAccount:${fenceSA}" --role="roles/resourcemanager.projectIamAdmin" --account ${account}
}

function createProjectAndServiceAcct {
  local projID=$1
  local account=$2
  local saName=$3
  printf "\n=================================\n"
  printf "Creating project ${projID} for account ${account}\n"
  printf "=================================\n"
  gcloud projects create ${projID} --account ${account}
  printf "\n=================================\n"
  printf "Creating service account for project ${projID}\n"
  printf "=================================\n"
  gcloud iam service-accounts create ${saName} --project ${projID} --account ${account}

}

if [[ -z "$(command -v gcloud)" ]]; then
  echo "ERROR: gcloud not accessible. Make sure it is installed and in path."
  exit 1
fi

read -p "Fence service account email: " fenceServiceAcct

#
# Authenticate accounts
#
printf "\n*** Authenticate with account NOT WITHIN an organization ***\n"
read -p "Account email: " noOrgAcct
gcloud auth login ${noOrgAcct} --force --no-launch-browser

printf "\n*** Authenticate with account WITHIN an organization ***\n"
read -p "Account email: " inOrgAcct
gcloud auth login ${inOrgAcct} --force --no-launch-browser

#
# Create projects not within organization and create service account
#
projSimpleID="gen3projectsimple${RANDOM}"
projWithComputeID="gen3projectwithcompute${RANDOM}"
projServiceAcctHasKeyID="gen3projectsahaskey${RANDOM}"
projServiceAcctWithouFenceID="gen3projectwithoutfence${RANDOM}"

serviceAccountName="serviceaccount"

projectsWithoutParentOrgIDs=( $projSimpleID $projWithComputeID $projServiceAcctHasKeyID $projServiceAcctWithouFenceID )
for projID in "${projectsWithoutParentOrgIDs[@]}"
do
  createProjectAndServiceAcct ${projID} ${noOrgAcct} ${serviceAccountName}
done

#
# Add fence service account to projects
#
projectsWithFence=( $projSimpleID $projWithComputeID $projServiceAcctHasKeyID )
for projID in "${projectsWithFence[@]}"
do
  addFenceServiceAccount ${projID} ${fenceServiceAcct} ${noOrgAcct}
done

#
# Create project with parent organization and create a service account
#
projWithParentOrgID="gen3projectparentorg${RANDOM}"
createProjectAndServiceAcct ${projWithParentOrgID} ${inOrgAcct} ${serviceAccountName}

#
# Add fence service account to project with parent org
#
addFenceServiceAccount ${projWithParentOrgID} ${fenceServiceAcct} ${inOrgAcct}

#
# Create Service account key for a project
#
gcloud iam service-accounts keys create ~/googleProjKey.json --iam-account ${serviceAccountName}@${projServiceAcctHasKeyID}.iam.gserviceaccount.com --account ${noOrgAcct}


cat << EOM


!!IMPORTANT!!
To finish setup, you need to manually do the following:
    -Enable the Compute API for the gen3projectwithcompute
    -Properly configure the Google projects in the fence props file according to the projects and service accounts that were just created.
      -i.e. log into the google console and for each project copy over the project ID, service account, owner, etc...
EOM