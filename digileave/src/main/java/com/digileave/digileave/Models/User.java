package com.digileave.digileave.Models;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.digileave.digileave.Models.enums.Role;


@Document(collection = "users") 
public class User {

    @Id
    private String id;

    private String fullName;
    private String email;
    private Role role;
    private int availableLeaveDays;
    private List<String> assignees = new ArrayList<>();


    public String getId(){
        return id; 
    }
    public void setId(String id){
        this.id = id;
    }

    public String getFullName(){
        return fullName;
    }
    public void setFullName(String fullName){
        this.fullName = fullName;
    }

    public String getEmail(){
        return email;
    }
    public void setEmail(String email){
        this.email = email;
    }

    public Role getRole(){
        return role;
    }
    public void setRole(Role role){
        this.role = role;
    }

    public int getAvailableLeaveDays(){
        return availableLeaveDays;
    }
    public void setAvailableLeaveDays(int availableLeaveDays){
        this.availableLeaveDays = availableLeaveDays;
    }

    public List<String> getAssignees(){
        return assignees;
    }
    public void addAssignee(String assignee){
        this.assignees.add(assignee);
    }
    public void deleteAssignee(String assignee){
        this.assignees.remove(assignee);
    }
}

