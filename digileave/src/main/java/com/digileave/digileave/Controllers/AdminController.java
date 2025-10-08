package com.digileave.digileave.Controllers;

import com.digileave.digileave.DTOs.UserExportDto;
import com.digileave.digileave.DTOs.UserPatchDto;
import com.digileave.digileave.Models.User;
import com.digileave.digileave.Repositories.UserRepository;
import com.digileave.digileave.Services.LeaveDaysAdditionService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final LeaveDaysAdditionService leaveDaysAdditionService;

    // # DB Operations
    private final UserRepository users;
    public AdminController(UserRepository users , LeaveDaysAdditionService leaveDaysAdditionService) {
        this.users = users;
        this.leaveDaysAdditionService = leaveDaysAdditionService;
    }

    // # Return All Users
    @GetMapping("/users")
    public List<UserExportDto> allUsers() {
        return users.findAll()
                .stream()
                .map(UserExportDto::from)
                .toList();
    }

    // # Patch User
    @PatchMapping("/users/{id}")
    public ResponseEntity<UserExportDto> patchUser(@PathVariable String id, @Valid @RequestBody UserPatchDto body) {
        var u = users.findById(id);
        if (u.isEmpty()) return ResponseEntity.notFound().build();

        User user = u.get();

        if (body.email() != null) user.setEmail(body.email());
        if (body.fullName() != null) user.setFullName(body.fullName());
        if (body.role() != null) user.setRole(body.role());
        if (body.availableLeaveDays() != null) user.setAvailableLeaveDays(body.availableLeaveDays());
        if (body.assigneeIds() != null) user.setAssigneeIds(new ArrayList<>(body.assigneeIds()));
        if (body.contractLeaveDays() != null) user.setContractLeaveDays(body.contractLeaveDays());
        if (body.workingSince() != null)      user.setWorkingSince(body.workingSince());

        var saved = users.save(user);
        return ResponseEntity.ok(UserExportDto.from(saved));
    }

    // #Delete User
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!users.existsById(id)) return ResponseEntity.notFound().build();
        users.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // TODO : Make It Check and execute on itself
    // ! Force Yearly Contract Leave Days Addition in case of sleeping server 
    @PostMapping("/force-contract-leave-days-addition")
    public ResponseEntity<Void> forceContractLeaveDaysAddition() {
        leaveDaysAdditionService.addYearlyContractLeaveDays();
        return ResponseEntity.noContent().build();
    }
}
