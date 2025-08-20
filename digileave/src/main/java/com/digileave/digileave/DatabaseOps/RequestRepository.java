package com.digileave.digileave.DatabaseOps;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.digileave.digileave.Models.Request;

public interface RequestRepository extends MongoRepository<Request, String> {
    List<Request> findByUserEmail(String userEmail);
}

