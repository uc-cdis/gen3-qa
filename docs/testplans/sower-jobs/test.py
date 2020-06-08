import os

MEH = os.environ.get('DBGAP_STUDY_ENDPOINT', "http://google.com")

print('result: {}'.format(MEH))
