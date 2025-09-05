package com.digileave.digileave.Controllers;

import com.digileave.digileave.DTOs.UserExportDto;
import com.digileave.digileave.Models.User;
import com.digileave.digileave.Models.enums.Role;
import com.digileave.digileave.Repositories.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    // # DB Operations
    private final UserRepository users;
    public AdminController(UserRepository users) {
        this.users = users;
    }

    // # Return All Users
    @GetMapping("/users")
    public List<UserExportDto> allUsers() {
        return users.findAll()
                .stream()
                .map(UserExportDto::from)
                .toList();
    }


    // ! TODO - Incorporate Patch DTOs in the PatchMapping
    // # Patch User
    @PatchMapping("/users/{id}")
    public ResponseEntity<User> patchUser(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Optional<User> ou = users.findById(id);
        if (ou.isEmpty()) return ResponseEntity.notFound().build();

        User u = ou.get();

        if (body.containsKey("email")) {
            Object v = body.get("email");
            u.setEmail(v == null ? u.getEmail() : v.toString());
        }
        if (body.containsKey("fullName")) {
            Object v = body.get("fullName");
            u.setFullName(v == null ? u.getFullName() : v.toString());
        }
        if (body.containsKey("role")) {
            Object v = body.get("role");
            if (v != null) {
                try { u.setRole(Role.valueOf(v.toString())); } catch (Exception ignored) {}
            }
        }
        if (body.containsKey("availableLeaveDays")) {
            Object v = body.get("availableLeaveDays");
            if (v instanceof Number n) u.setAvailableLeaveDays(n.intValue());
            else if (v != null) {
                try { u.setAvailableLeaveDays(Integer.parseInt(v.toString())); } catch (Exception ignored) {}
            }
        }
        if (body.containsKey("assignees")) {
            Object v = body.get("assignees");
            if (v instanceof List<?> list) {
                List<String> clean = new ArrayList<>();
                for (Object o : list) if (o != null) clean.add(o.toString());
                u.setAssigneeIds(clean);
            }
        }

        return ResponseEntity.ok(users.save(u));
    }

    // # Delete User
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!users.existsById(id)) return ResponseEntity.notFound().build();
        users.deleteById(id);
        return ResponseEntity.noContent().build();
    }


}
