package com.digileave.digileave.DatabaseOps;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.digileave.digileave.Models.User;
import com.digileave.digileave.Models.enums.Role;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}