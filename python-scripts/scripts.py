#!/usr/bin/env python2
import os
from os import listdir
from os.path import isfile, join
import requests
import sys
import getopt
import argparse
import json

CHUNK_SIZE = 45

# python scripts.py data-create --host  https://giangb.planx-pla.net --dir ~/Desktop/Projects/data-simulator/SampleJsonOutput --project "DEV/test" --access_token token.txt
def gen_test_data(args):

    api_endpoint = args.host + '/api/v0/submission/' + args.project
    chunk_size = int(args.chunk_size) if args.chunk_size else  CHUNK_SIZE

    token = ''
    if os.path.isfile(args.access_token):
        with open(args.access_token, 'r') as reader:
            token = reader.read()
        token = token[:-1]
    else:
        print('There is no input token text file. Continue anyway!')

    submission_order = ''
    if(os.path.isfile(join(args.dir, 'DataImportOrder.txt'))):
        with open(join(args.dir, 'DataImportOrder.txt'), 'r') as reader:
            submission_order = reader.read()
    else:
        print('There is no DataImportOrder.txt file!')
        return

    submission_order = submission_order.split('\n')

    for fname in (submission_order):
        if fname is None or fname == '':
            print('There is no {} in input directory'.format(fname))
            continue
        with open(join(args.dir, fname), 'r') as rfile:
            data = json.loads(rfile.read())
            if isinstance(data, list) == False:
                response = requests.put(api_endpoint, data=data, headers={
                                        'content-type': 'application/json', 'Authorization': 'bearer ' + token})
                continue
            index = 0
            while index < len(data):
                response = requests.put(api_endpoint, data=json.dumps(list(data[index:min(index+chunk_size, len(data))])), headers={
                                        'content-type': 'application/json', 'Authorization': 'bearer ' + token})
                if response.status_code != 200:
                    print(
                        "\n\n==============================={}=======================================".format(fname))
                    print('Failed at chunk {}'.format(index/chunk_size))
                    if index == 0:
                        print response.content
                    print response.status_code

                index = index + chunk_size
            print('Done submitting {}'.format(fname))


def parse_arguments():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(title='action', dest='action')

    create_data = subparsers.add_parser('data-create')
    create_data.add_argument('--host', required=True, help="host to submit")
    create_data.add_argument('--dir', required=True,
                             help="a directory contaning meta-data to submit in json format")
    create_data.add_argument('--project', required=True,
                             help="project url for submission")
    create_data.add_argument('--chunk_size', help="number of node instances is submitted in one request")
    create_data.add_argument('--access_token', required=True,
                             help="auth key file")

    return parser.parse_args()


if __name__ == "__main__":

    args = parse_arguments()
    if args.action == 'data-create':
        gen_test_data(args)
