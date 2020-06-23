require 'rake'

task :default => :selenium

desc "start selenium"
task :selenium do
  sh('docker stop selenium || true')
  sh('docker stop selenium-node || true')
  sh('docker run --rm -d -p 4444:4444 --name=selenium --rm -v /dev/shm:/dev/shm selenium/hub:3.141.59')
  sh('docker run --rm -d --link selenium:hub --name=selenium-node selenium/node-chrome:3.141.59')
end

desc "stop selenium containers"
task :stop do
  sh('docker stop selenium || true')
  sh('docker stop selenium-node || true')
end

desc "start grafana and influxdb"
task :monitoring do
  sh('docker-compose -f load-testing/grafana/docker-compose.yaml stop')
  sh('docker-compose -f load-testing/grafana/docker-compose.yaml up -d')
end
