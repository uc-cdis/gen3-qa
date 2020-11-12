FROM quay.io/cdis/alpine:3.12.1

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
    libffi-dev \
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

# Copy the gen3-qa framework scripts (test suites + service and utils modules)
COPY codecept.conf.js \
     package.json \
     package-lock.json \
     test_setup.js \
     .eslintrc.js \
     helpers \
     hooks \
     services \
     suites \
     utils ${SDET_HOME}/

USER sdet

# install poetry - respects $POETRY_VERSION & $POETRY_HOME
RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python

# Copy only requirements to cache them in docker layer
RUN mkdir -p ${SDET_HOME}/controller/gen3qa-controller
WORKDIR ${SDET_HOME}/controller
COPY controller/poetry.lock controller/pyproject.toml ${SDET_HOME}/controller/

# copy controller scripts
COPY controller/gen3qa-controller ${SDET_HOME}/controller/gen3qa-controller/

# Project initialization:
# install runtime deps - uses $POETRY_VIRTUALENVS_IN_PROJECT internally
RUN poetry install --no-dev

CMD ["poetry", "run", "gen3qa-controller/gen3qa-controller.py"]
