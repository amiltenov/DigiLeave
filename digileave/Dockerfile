FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests clean package


FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

EXPOSE 8080

COPY --from=build /app/target/*-SNAPSHOT.jar /app/app.jar

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC"

CMD ["sh", "-c", "java -Dserver.port=$PORT $JAVA_OPTS -jar /app/app.jar"]
