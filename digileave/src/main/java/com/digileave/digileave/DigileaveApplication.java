package com.digileave.digileave;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DigileaveApplication {
  public static void main(String[] args) {
    Dotenv dotenv = Dotenv.configure()
        .ignoreIfMalformed()
        .ignoreIfMissing()
        .load();

    String mongo = dotenv.get("MONGO_URI");
    String cid   = dotenv.get("CLIENT_ID");
    String cs    = dotenv.get("CLIENT_SECRET");

    if (mongo == null) {
      throw new IllegalStateException("Missing MONGO_URI in environment or .env");
    }
    if (cid == null) {
      throw new IllegalStateException("Missing CLIENT_ID in environment or .env");
    }
    if (cs == null) {
      throw new IllegalStateException("Missing CLIENT_SECRET in environment or .env");
    }

    System.setProperty("MONGO_URI", mongo);
    System.setProperty("CLIENT_ID", cid);
    System.setProperty("CLIENT_SECRET", cs);

	System.out.println("[ENV] MONGO_URI=" + mongo);

    SpringApplication.run(DigileaveApplication.class, args);
  }
}

