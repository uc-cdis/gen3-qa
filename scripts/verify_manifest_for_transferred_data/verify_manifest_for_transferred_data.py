import csv
import requests
import json


"""
Verify all file's md5, file name and file size

Args:
    manifest_file (str): true manifest_file for transferred data
    manifest_file_delimiter (str): delimeter in manifest_file
    datacommons (str): name of datacommons which to check the transferred data
    for example: 'qa-brain.planx-pla.net'
"""
def verify_manifest(manifest_file, manifest_file_delimiter, datacommons):
    errorLog = open("verify-manifest-errors-for-{}.log".format(manifest_file), "w")
    with open(manifest_file) as manifest:
        reader = csv.DictReader(manifest, delimiter=manifest_file_delimiter)
        for row in reader:
            row['size'] = row.pop('file_size')
            url = row['urls']
            requesturl = 'https://{}/index/index?url={}'
            r = requests.get(requesturl.format(datacommons, url))
            manifest_to_verify = json.loads(r.text)
            for key in row:
                try:
                    if key == 'md5':
                        item_to_verify = manifest_to_verify['records'][0]['hashes'][key]
                    elif key == 'acl' or 'urls':
                        # TODO : verify acl in future if needed
                        continue
                    else:
                        item_to_verify = manifest_to_verify['records'][0][key]
                except KeyError:
                    errormsg = 'For {}, {} not found!\n'
                    errorLog.write(errormsg.format(url,key))
                    print(errormsg.format(url,key))
                    continue
                except IndexError:
                    # records is empty
                    errormsg = 'For {}, no record found!\n'
                    errorLog.write(errormsg.format(url))
                    print(errormsg.format(url))
                    break

                if item_to_verify != row[key]:
                    errormsg = 'For {}, the true value of {} is {}, but get {}\n'
                    errorLog.write(errormsg.format(url,key,row[key],item_to_verify))
                    print(errormsg.format(url,key,row[key],item_to_verify))
                else:
                    print('{} is succefully copied'.format(url))

        errorLog.close()



# TODO: Get these parameters from jenkins
manifest_file = "example_manifest.tsv"
manifest_file_delimiter = "\t"
datacommons = 'qa-brain.planx-pla.net'

verify_manifest(manifest_file, manifest_file_delimiter, datacommons) 



