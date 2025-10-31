package com.digileave.digileave.Repositories;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.digileave.digileave.Models.Request;

public interface RequestRepository extends MongoRepository<Request, String> {
    List<Request> findByUserId(String userId);
    List<Request> findByUserIdIn(List<String> userIds);
}

