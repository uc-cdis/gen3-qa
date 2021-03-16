FROM selenium/node-chrome:4.0.0-beta-1-prerelease-20201202

# Copying configuration script generator
COPY generate_config /opt/bin/generate_config

# Generating a default config during build time
RUN /opt/bin/generate_config


EXPOSE 5900
