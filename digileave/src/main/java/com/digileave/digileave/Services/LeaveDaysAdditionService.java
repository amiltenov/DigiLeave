package com.digileave.digileave.Services;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.digileave.digileave.Models.User;
import com.digileave.digileave.Repositories.UserRepository;

@Component
public class LeaveDaysAdditionService {
    
    private static final int MAX_BALANCE = 60;

    private final UserRepository users;

    public LeaveDaysAdditionService(UserRepository users){
        this.users = users;
    }

    @Scheduled(cron = "0 45 0 1 1 *", zone = "Europe/Sofia" )// 00:45 Jan 1st Sofia
    public void addYearlyContractLeaveDays(){
        var allUsers = users.findAll();

        for (User u : allUsers){
    
            var leaveDaysBalance = u.getAvailableLeaveDays();
            var yearlyByContract = u.getContractLeaveDays();
            if(leaveDaysBalance + yearlyByContract > MAX_BALANCE){
                u.setAvailableLeaveDays(MAX_BALANCE);
            }
            else{
                u.setAvailableLeaveDays(leaveDaysBalance + yearlyByContract);
            }
        }

        users.saveAll(allUsers);
    }
    
}
