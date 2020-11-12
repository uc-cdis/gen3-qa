FROM python:slim

USER root

ENV SDET_HOME /var/sdet_home

ARG user=sdet
ARG group=sdet
ARG uid=1000
ARG gid=1000

RUN addgroup -gid ${gid} ${group} \
    && adduser --home "$SDET_HOME" --uid ${uid} --gid ${gid} --disabled-password --shell /bin/sh ${user}

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

# install everything
RUN apt-get update \
  && apt-get install -y lsb-release \
    gcc \
    zip \
    unzip \
    less \
    vim \
    libc-dev \
    libffi-dev \
    make \
    libssl-dev \
    libcurl4-openssl-dev \
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

RUN which poetry
RUN poetry version
RUN chown -R ${user}:${group} ${SDET_HOME}
USER sdet
RUN which poetry
RUN poetry version
RUN echo "$(whoami)"

CMD ["poetry", "run", "gen3qa-controller/gen3qa-controller.py"]
