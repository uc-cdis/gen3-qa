import kubernetes
import os
import logging

from triage.pod_analyzer import PodAnalyzer

logging.basicConfig(
    format='%(asctime)s %(levelname)-8s %(message)s',
    level=logging.DEBUG,
    datefmt='%Y-%m-%d %H:%M:%S')
log = logging.getLogger(__name__)

def main():
  kubernetes.config.load_incluster_config()
  v1 = kubernetes.client.CoreV1Api()
  w = kubernetes.watch.Watch()
  log.info('k8s modules loaded successfully!')

  pa = PodAnalyzer()

  for event in w.stream(v1.list_namespaced_pod, os.environ["MY_POD_NAMESPACE"]):
    type_of_event = event['type']
    obj = event['object']
    pod_container = obj.spec.containers[0]
    pod_img_version = pod_container.image.split(':')[1]

    log.debug('type of event: {}'.format(type_of_event))
    log.debug('pod name: {}'.format(pod_container.name))
    log.debug('pod image: {}'.format(pod_container.image))
    log.debug('pod status.phase: {}'.format(obj.status.phase))

    pa.check_for_new_versions(type_of_event, pod_container.name, pod_img_version, obj.status.phase)

    # keep track of svc versions
    pa.map_svc_version(pod_container.name, pod_img_version)


if __name__ == "__main__":
    main()
