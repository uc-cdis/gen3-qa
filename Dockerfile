# To run: docker run -d --name=dataportal -p 80:80 quay.io/cdis/data-portal
# To check running container: docker exec -it dataportal /bin/bash

FROM ubuntu:16.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    libssl-dev \
    libcurl4-openssl-dev \
    git \
    nginx \
    vim \
    python2.7 \
    python-dev \
    python-pip \
    python-setuptools \
    && pip install pip==9.0.3 \
    && pip install requests \
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

COPY . /gen3-qa

WORKDIR /gen3-qa

ARG APP=dev
ARG BASENAME
