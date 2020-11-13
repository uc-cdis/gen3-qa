import kubernetes
import os

kubernetes.config.load_incluster_config()
v1 = kubernetes.client.CoreV1Api()

w = kubernetes.watch.Watch()

for event in w.stream(v1.list_namespaced_pod, os.environ["MY_POD_NAMESPACE"]):
  print(event)
  # TODO: Parse tests-config.json and trigger tests for target services
