import csv
import requests
import json
import os


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
            row['size'] = row.pop('*file_size')
            row['md5'] = row.pop('*md5sum')
            file_name = row['*file_name']
            requesturl = 'https://{}/index/index?file_name={}'
            r = requests.get(requesturl.format(datacommons, file_name))
            manifest_to_verify = json.loads(r.text)
            for key in row:
                try:
                    if key == 'md5':
                        item_to_verify = manifest_to_verify['records'][0]['hashes'][key]
                    elif key == 'size':
                        item_to_verify = str(manifest_to_verify['records'][0][key])
                        row[key] = row[key].replace(',',"")
                    else:
                        # TODO : verify other columns in future if needed
                        continue
                except KeyError:
                    errormsg = 'For {}, {} not found!\n'
                    errorLog.write(errormsg.format(file_name,key))
                    print(errormsg.format(file_name,key))
                    continue
                except IndexError:
                    # records is empty
                    errormsg = 'For {}, no record found!\n'
                    errorLog.write(errormsg.format(file_name))
                    print(errormsg.format(file_name))
                    break
                
                if item_to_verify != row[key]:
                    errormsg = 'For file {}, the true value of {} is {}, but from the indexd record it is {}\n'
                    errorLog.write(errormsg.format(file_name,key,row[key],item_to_verify))
                    print(errormsg.format(file_name,key,row[key],item_to_verify))
                else:
                    print('{} is succefully copied'.format(file_name))

        errorLog.close()



manifest_file = os.environ["MANIFEST_FILE"]
manifest_file_delimiter = '\t'
datacommons = os.environ["DATACOMMONS"]

verify_manifest(manifest_file, manifest_file_delimiter, datacommons) 


