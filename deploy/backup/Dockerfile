# mongo:7 ya trae mongodump, mongorestore y mongosh (MongoDB Database Tools).
FROM mongo:7
RUN apt-get update \
 && apt-get install -y --no-install-recommends age rclone curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY *.sh /opt/backup/
ENTRYPOINT []
