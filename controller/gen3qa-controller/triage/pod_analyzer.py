import logging

logging.basicConfig(
    format='%(asctime)s %(levelname)-8s %(message)s',
    level=logging.DEBUG,
    datefmt='%Y-%m-%d %H:%M:%S')
log = logging.getLogger(__name__)

class PodAnalyzer(object):
  _instance = None
  _svc_versions_map = {}

  def __new__(cls):
    if cls._instance is None:
      log.debug('initializing pod analyzer...')
      cls._instance = super(PodAnalyzer, cls).__new__(cls)
    return cls._instance

  def map_svc_version(self, svc_name, version):
    self._svc_versions_map[svc_name] = version

  def check_for_new_versions(self, event, svc_name, version, phase):
    if svc_name not in self._svc_versions_map:
      self.map_svc_version(svc_name, version)
    log.debug('version in memory: {}'.format(self._svc_versions_map[svc_name]))
    log.debug('latest version: {}'.format(version))
    if ((event == "MODIFIED") and
      (svc_name == 'fence') and
      (version != self._svc_versions_map[svc_name]) and
      (phase == "Running")):
        log.info('a new {} version has been identified!'.format(svc_name))
