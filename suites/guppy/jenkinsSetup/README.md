# TL;DR

Some helpers for setting up guppy indexes for jenkins test environments that are guppyTest.js friendly.

## Overview

We copied the index mappings and some data from the canine commons.  Check [this script](./jenkinsSetup.sh) for steps to setup the elastic search indices.

The following shows how to run the guppy.  The `GUPPY_FRICKJACK` environment variable triggers the script to save missing test responses for use in subsequent tests.

```
GUPPY_FRICKJACK=true RUNNING_LOCAL=true NAMESPACE=reuben npm test -- --verbose --grep '@guppyAPI'
```
