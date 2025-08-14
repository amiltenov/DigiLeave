package com.digileave.digileave;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DigileaveApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.load();
        System.setProperty("CLIENT_ID", dotenv.get("CLIENT_ID"));
        System.setProperty("CLIENT_SECRET", dotenv.get("CLIENT_SECRET"));

		SpringApplication.run(DigileaveApplication.class, args);
	}

}
