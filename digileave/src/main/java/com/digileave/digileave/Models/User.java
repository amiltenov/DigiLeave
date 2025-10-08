package com.digileave.digileave.Models;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.digileave.digileave.Models.enums.Role;


@Document(collection = "users") 
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    @Indexed
    private Role role = Role.USER;

    private String fullName;

    private int availableLeaveDays = 20;
    private int contractLeaveDays;
    private LocalDate workingSince;
    
    private List<String> assigneeIds = new ArrayList<>();


    
    // # Getters & Setters
    public String getId(){ return id; }
    public void setId(String id){ this.id = id; }

    public String getFullName(){ return fullName; }
    public void setFullName(String fullName){ this.fullName = fullName; }

    public String getEmail(){ return email; }
    public void setEmail(String email){ this.email = email; }

    public Role getRole(){ return role; }
    public void setRole(Role role){ this.role = role; }

    public int getAvailableLeaveDays(){ return availableLeaveDays; }
    public void setAvailableLeaveDays(int availableLeaveDays){ this.availableLeaveDays = availableLeaveDays; }

    public int getContractLeaveDays(){ return contractLeaveDays; }
    public void setContractLeaveDays(int contractLeaveDays){ this.contractLeaveDays = contractLeaveDays; }

    public LocalDate getWorkingSince(){ return workingSince; }
    public void setWorkingSince(LocalDate workingSince){ this.workingSince = workingSince; }

    public List<String> getAssigneeIds(){ return assigneeIds; }
    public void setAssigneeIds(List<String> assigneeIds){ this.assigneeIds = assigneeIds;}
    public void addAssignee(String assignee){ this.assigneeIds.add(assignee); }
    public void deleteAssignee(String assignee){ this.assigneeIds.remove(assignee); }


}