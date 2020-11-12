FROM alpine:3.12.1

USER root

ENV SDET_HOME /var/sdet_home

ARG user=sdet
ARG group=sdet
ARG uid=1500
ARG gid=1500

RUN addgroup -g ${gid} ${group} \
    && adduser --home "$SDET_HOME" --uid ${uid} --ingroup ${group} --disabled-password --shell /bin/bash ${user}

ENV DEBIAN_FRONTEND=noninteractive

# Install python/pip
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 \
    && ln -sf python3 /usr/bin/python \
    && python3 -m ensurepip \
    && pip3 install --no-cache --upgrade pip setuptools

# install everything else
RUN set -xe && apk add --no-cache --virtual .build-deps \
    zip \
    unzip \
    less \
    vim \
    gcc \
    libc-dev \
    make \
    openssl-dev \
    pcre-dev \
    zlib-dev \
    linux-headers \
    curl \
    wget \
    jq \
    nodejs \
    npm

USER sdet
