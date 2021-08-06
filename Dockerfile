FROM quay.io/cdis/debian:bullseye

USER root

ENV SDET_HOME /var/sdet_home

ARG user=sdet
ARG group=sdet
ARG uid=1000
ARG gid=1000

RUN addgroup --gid ${gid} ${group} \
    && useradd -m -d "$SDET_HOME" -u ${uid} -g ${group} -s /bin/bash ${user}

ENV DEBIAN_FRONTEND=noninteractive

# Install python/pip
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    POETRY_VERSION=1.1.4 \
    POETRY_HOME="${SDET_HOME}/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1 \
    PYSETUP_PATH="${SDET_HOME}/pysetup" \
    VENV_PATH="${SDET_HOME}/pysetup/.venv"

# prepend poetry and venv to path
ENV PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"

RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && ln -sf python3 /usr/bin/python \
    && pip3 install --no-cache --upgrade pip setuptools

# install everything else
RUN set -xe && apt-get update && apt-get upgrade -y && apt-get install -y \
    zip \
    unzip \
    less \
    vim \
    gcc \
    xvfb \
    libxi6 \
    libgconf-2-4 \
    libc-dev \
    libffi-dev \
    make \
    libssl-dev \
    libghc-regex-pcre-dev \
    zlib1g-dev \
    linux-headers-amd64 \
    curl \
    wget \
    jq \
    nodejs \
    npm \
    openjdk-11-jre-headless

# Copy the gen3-qa framework scripts (test suites + service and utils modules)
COPY package.json \
     package-lock.json \
     test_setup.js \
     .eslintrc.js ${SDET_HOME}/
# gen3-qa-in-a-box requires a couple of changes to its webdriver config
COPY gen3.qa.in.a.box.codecept.conf.js ${SDET_HOME}/codecept.conf.js
COPY helpers ${SDET_HOME}/helpers/
COPY hooks ${SDET_HOME}/hooks/
COPY services ${SDET_HOME}/services/
COPY suites ${SDET_HOME}/suites/
COPY utils ${SDET_HOME}/utils/

# install poetry - respects $POETRY_VERSION & $POETRY_HOME
RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python

# Copy only requirements to cache them in docker layer
RUN mkdir -p ${SDET_HOME}/controller/gen3qa-controller
WORKDIR ${SDET_HOME}/controller

# Install google chrome
RUN curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64]  http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get -y update \
    && apt-get -y install google-chrome-stable

# utilize the selenium sidecar as there is no selenium-hub in prod-tier environments
RUN cd ${SDET_HOME} \
    && npm install \
    && npx selenium-standalone install \
    && sed -i "s/      host: 'selenium-hub',/      host: 'localhost',/" codecept.conf.js

# poetry artifacts
COPY controller/poetry.lock controller/pyproject.toml ${SDET_HOME}/controller/

# copy controller scripts
COPY controller/gen3qa-controller ${SDET_HOME}/controller/gen3qa-controller/

# Project initialization:
# install runtime deps - uses $POETRY_VIRTUALENVS_IN_PROJECT internally
RUN poetry install --no-dev

RUN chown -R ${user}:${group} ${SDET_HOME}
USER sdet

CMD ["poetry", "run", "python", "gen3qa-controller/gen3qa-controller.py"]
