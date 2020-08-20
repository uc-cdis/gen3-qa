import json
import sys
import requests
import base64

# parse api_key from credentials.json
# obtain iss to take note of the environment's hostname
# send POST request to fence with the api_key to obtain an access_token
# use access token to shoot a request against https://<environment>.planx-pla.net/data/schema.json
# use schema.json to list all node types and store them into
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
    
  split_jwt = credentials_data['api_key'].split('.')[1]
  base64_data = split_jwt.replace('-', '+').replace('_', '/')

  print('split_jwt: {}'.format(split_jwt))

  print('base64_data: {}'.format(base64.decodestring(split_jwt)))
  
  decoded_api_key = json.loads(base64_data)

  print('the api_key: {}'.format(decoded_api_key))
    
  #access_token = requests.get(,
  #    data = {
  #      "api_key": api_key,
  #      "Content-Type": "application/json",
  #    },

if __name__ == '__main__':
    main()


