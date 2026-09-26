FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .

RUN grep -n "flyway" pom.xml
RUN mvn dependency:tree -Dincludes=org.flywaydb:*

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn clean package -DskipTests
RUN jar tf target/*.jar | grep flyway


FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]