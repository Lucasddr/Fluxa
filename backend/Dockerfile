FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn clean package -DskipTests


FROM eclipse-temurin:17-jre

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx gettext-base supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY --from=build /app/target/*.jar app.jar
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/supervisord.conf /etc/supervisor/conf.d/fluxa.conf
COPY deploy/docker-entrypoint.sh /app/docker-entrypoint.sh

ENV PORT=10000

EXPOSE 10000

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
