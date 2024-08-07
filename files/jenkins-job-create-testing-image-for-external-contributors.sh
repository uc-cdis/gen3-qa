#!/bin/bash

set -x
set -e

# This automation is required so Gen3 Engineering can produce a copy of a branch from a forked-repo
# and trigger a Quay image build that is utilized in our CI Pipeline.

git config --global user.email "cdis@uchicago.edu"
git config --global user.name "$GITHUB_USERNAME"

URL_PREFIX="https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/uc-cdis/"
OUR_REMOTE_URL="${URL_PREFIX}${OUR_GEN3_SERVICE_REPO_NAME}"

echo "cloning $OUR_REMOTE_URL..."
git clone $OUR_REMOTE_URL

pwd

echo "stepping into $OUR_GEN3_SERVICE_REPO_NAME"
cd $OUR_GEN3_SERVICE_REPO_NAME

ls -ilha

set +e
# delete branch if it already exists
branch_exists=$(git ls-remote --heads ${OUR_REMOTE_URL}.git automatedCopy-$NAME_OF_THE_BRANCH)
set -e

if [[ -z $branch_exists ]]; then
  echo "git ls-remote output empty. The branch does not exist."
else
  echo "WARN: git ls-remote output is NOT empty."
  echo " Deleting the existing automatedCopy branch to create a new copy based on new changes from the forked-repo branch..."
  set +e
  git branch -D automatedCopy-$NAME_OF_THE_BRANCH
  set -e
  git push origin --delete automatedCopy-$NAME_OF_THE_BRANCH
fi

echo "creating new branch automatedCopy-$NAME_OF_THE_BRANCH"
git checkout -b automatedCopy-$NAME_OF_THE_BRANCH

echo "changing origin to pull changes from external repo: https://${EXTERNAL_REPO_REMOTE_URL}"
git remote set-url origin https://${EXTERNAL_REPO_REMOTE_URL}

echo "pulling changes from external branch $NAME_OF_THE_BRANCH"
git pull origin $NAME_OF_THE_BRANCH --ff-only

echo "restore original origin $OUR_REMOTE_URL"
git remote set-url origin ${URL_PREFIX}${OUR_GEN3_SERVICE_REPO_NAME}.git

echo "finish branch cloning process but pushing local changes to our repo's branch."
git push --set-upstream origin automatedCopy-$NAME_OF_THE_BRANCH
