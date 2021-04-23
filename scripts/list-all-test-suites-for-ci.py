import os
import subprocess


def collect_test_suites_from_codeceptjs_dryrun():
  bashCommand = "npx codeceptjs dry-run 2>&1"
  process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
  output, error = process.communicate()

  test_suites = []

  for line in output.splitlines():
    line = line.decode('utf-8')
    # print(f'### line: {line}')

    # ignore pre-release test suites
    if 'pre-release' in line:
      continue
    elif '.js' in line:
      full_path_to_test_js = line.split('/')

      # TODO: check if there are any @manual annotations in any of the scenarios

      suite_folder = full_path_to_test_js[-2]
      # print(f'## suite_folder: {suite_folder}')
      test_script = full_path_to_test_js[-1]
      # print(f'## test_script: {test_script}')
      test_script_without_extension = test_script[0:test_script.index('.')]

      test_suite = f"test-{suite_folder}-{test_script_without_extension}"
      test_suites.append(test_suite)

  return test_suites

def main():
  test_suites = collect_test_suites_from_codeceptjs_dryrun()
  print(f"## ## test_suites: {test_suites}")
  print(f"## test_suites size: {len(test_suites)}")

if __name__ == '__main__':
  main()
