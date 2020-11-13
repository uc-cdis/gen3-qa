# Hatchery (Gen3 Workspaces) test plan

## Overview of the service
The Hatchery service launches web enabled tools onto a kubernetes cluster on a per-user basis (more information [here](https://github.com/uc-cdis/hatchery/blob/master/doc/explanation/hatcheryOverview.md)).
e.g., After navigating to https://qa-dcp.planx-pla.net/workspace and launching a "Jupyter Notebook Bio Python" application, a Kubernetes pod is created in a separate k8s namespace.
```
qa-dcp@cdistest_dev_admin:~$ kubectl get pods --namespace jupyter-pods-qa-dcp
NAME                                 READY   STATUS              RESTARTS   AGE
hatchery-marcelo-40uchicago-2eedu   0/2     ContainerCreating   0          73s
```

## User flow
The initial coverage comprises the following scenarios:
1. Go to the target Gen3 Commons environment, login and click on the `Workspace` button at the top navigation bar.
2. Check if the list of available notebooks listed on the environment's `hatchery.json` manifest show up (That usually includes "Jupyter Notebook Bio Python" or "R Studio" applications).
3. Open the "Jupyter Notebook Bio Python" and wait until the notebook is loaded.
(You can also check if the pod is coming up on the `jupyter-pods-<namespace>`)
4. Terminate the notebook and wait until the Workspace page loads again listing all available applications.
## Load Tests
N/A
### Auto-scaling config
N/A
