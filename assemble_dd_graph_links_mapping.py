import json
import sys
import requests
import base64
import jwt
from pprint import pprint
import re

# parse api_key from credentials.json
# obtain iss to take note of the environment's hostname
# send POST request to fence with the api_key to obtain an access_token
# use access token to shoot a request against https://<environment>.planx-pla.net/data/schema.json
# use schema.json to list all node types and store them
# pass node types and dictionary (schema.json) to a function
# the function must assemble the complex query and send it to https://qa-dcp.planx-pla.net/api/v0/submission/graphql
# parse the response and convert it to a new-data-simulator generator_configuration.json file

def main():
  if len(sys.argv) == 1:
    print('please provide the credentials.json path')
    sys.exit(1)

  credentials_path = sys.argv[1]
  print('reading credentials.json path: {}'.format(credentials_path))

  credentials_data = None
  with open(credentials_path) as f:
    credentials_data = json.load(f)

  print('credentials_data: {}'.format(credentials_data))

  decoded_api_key = jwt.decode(credentials_data['api_key'], verify=False)

  print('the api_key: {}'.format(decoded_api_key))

  hostname = decoded_api_key['iss'].replace('/user', '')
  
  access_token = requests.post(
    '{}/user/credentials/api/access_token'.format(hostname),
    data = {
      "api_key": credentials_data['api_key'],
      "Content-Type": "application/json",
    }
  ).json()['access_token']

  print('the access_token: {}'.format(access_token))

  dd_schema = requests.get(
    '{}/data/schema.json'.format(hostname),
  )

  print('the dd_schema: ')
  # pprint(dd_schema.json()['data']['__schema']['types'])

  types = dd_schema.json()['data']['__schema']['types']

  ba_graphql_query = "{"
  
  for type in types:
    #pprint(type)
    if type == "Root" or type.startswith("Transaction"):
      continue
    ba_graphql_query += '{} (project_id:\"DEV-test\"),'.format(type['name'])
  ba_graphql_query += "}\" }"
  
  print('the ba_graphql_query: {}'.format(ba_graphql_query))

  graphql_links = requests.post(
    '{}/api/v0/submission/graphql'.format(hostname),
    data = {
      "query": ba_graphql_query
    },
    headers = {
      "Authorization": "Bearer {}".format(access_token)
    }
  )

  print('the graphql_links: {}'.format(graphql_links)) # Response 401 Unauthorized. HALP!!
  
if __name__ == '__main__':
    main()


