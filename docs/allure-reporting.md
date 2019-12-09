# Starting Allure in your Dev VM and share executable test results

## Standing up the allure k8s pod:

Download 2 files (`allure-deployment.yaml` & `allure-service.yaml`) from
https://gist.github.com/themarcelor/59cf7938744444a9f789f51892e78294
and `scp` them into your dev VM.

Run `kubectl apply -f allure-service.yaml`
and `kubectl apply -f allure-deployment.yaml`.

Make sure the pod is running ok:
`kubectl get pods | grep allure`

## Ad-hoc report publishing

Run the following command in your terminal:
% ssh -L 127.0.0.1:4040:localhost:$((OFFSET + 4040)) <your_name>@cdistest.csoc

Once you're in the dev VM run this other command:
```
$ g3kubectl -n <the_namespace> port-forward deployment/allure-deployment $((OFFSET+4040)):4040
Forwarding from 127.0.0.1:4163 -> 4040
Forwarding from [::1]:4163 -> 4040
```
_*<the_namespace>=the name of the owner of the k8s namespace where the allure pod is running_

Navigate to `http://localhost:4040/` and make sure you can access Allure's Web GUI.

## Quick and dirty way to publish the results of executable tests

From your terminal:
`gen3-qa % scp output/b7bc67b3-a3c7-4859-aac9-032346577b7b-testsuite.xml <your_name>@cdistest.csoc:/home/<your_name>/devplanetv1/`

From the vm:
`<your_name>@cdistest_dev_admin:~/devplanetv1$ kc cp b7bc67b3-a3c7-4859-aac9-032346577b7b-testsuite.xml allure-deployment-5979f79958-g6bvs:/allure-results -c allure`

Refresh your browser:
`http://localhost:4040/`

Share the port forwarding instructions with your colleagues.
Make sure they are pointing to the correct Kubernetes namespace (`-n <the_namespace>`) where you have the Allure pod running:
`$ g3kubectl -n <the_namespace> port-forward deployment/allure-deployment $((OFFSET+4040)):4040`
