import requests
import os

print("Uploading indexd records for QA_DCP")
url = f"https://qa-dcp.planx-pla.net/index/index"
json_body = {
    "acl": [
        "phs000178"
    ],
    "authz": [
        "/programs/phs000178"
    ],
    "file_name": "load_test_file",
    "form": "object",
    "hashes": {
        "md5": "e5c9a0d417f65226f564f438120381c5" #pragma: allowlist secret
    },
    "metadata": {},
    "size": 129,
    "urls": [
        "s3://qa-dcp-databucket-gen3/testdata", "gs://qa-dcp-databucket-gen3/file.txt"
    ],
}
# getting access_token from environment variable
auth_token = os.environ["ACCESS_TOKEN"].strip()

header = { 
    "Content-Type": "application/json" 
}

post_request = requests.post(url, json=json_body, auth=auth_token, headers=header)
print("Status code:", post_request.status_code)
print("Request body:", post_request.json())