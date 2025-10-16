package com.digileave.digileave.Services;

import java.time.LocalDate;
import java.time.MonthDay;
import java.time.ZoneId;

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
                var currentYear = java.time.Year.now().getValue();
                var workingSinceYear = u.getWorkingSince().getYear();

                // ! Variant 1
                u.setAvailableLeaveDays(leaveDaysBalance + yearlyByContract + (currentYear - workingSinceYear));

                // ! Variant 2
                u.setAvailableLeaveDays(leaveDaysBalance + yearlyByContract + (currentYear == workingSinceYear ? 0 : currentYear - workingSinceYear - 1));
            }
        }

        users.saveAll(allUsers);
    }

    // ! Variant 2 
    @Scheduled(cron = "0 0 3 * * *", zone = "Europe/Sofia") // runs daily at 03:00 Europe/Sofia
    public void addPerUserAnniversaryDay() {
        final ZoneId SOFIA_ZONE = ZoneId.of("Europe/Sofia");
        final LocalDate todayInSofia = LocalDate.now(SOFIA_ZONE);
        final MonthDay todayMonthDay = MonthDay.from(todayInSofia);

        var allUsers = users.findAll();
        for (User user : allUsers) {
            LocalDate workingSinceDate = user.getWorkingSince();
            if (workingSinceDate == null) continue;

            MonthDay anniversaryMonthDay = MonthDay.from(workingSinceDate);

            boolean isWorkAnniversary =
                anniversaryMonthDay.equals(todayMonthDay) ||
                (anniversaryMonthDay.equals(MonthDay.of(2, 29))
                    && !todayInSofia.isLeapYear()
                    && todayMonthDay.equals(MonthDay.of(2, 28)));

            if (isWorkAnniversary) {
                int updatedBalance = Math.min(MAX_BALANCE, user.getAvailableLeaveDays() + 1);
                user.setAvailableLeaveDays(updatedBalance);
            }
        }
        users.saveAll(allUsers);
    }

}
