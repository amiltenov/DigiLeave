package com.digileave.digileave.Models.enums;

public enum LeaveType {
    ANNUAL_PAID_LEAVE ("Платен годишен отпуск"),
    ANNUAL_UNPAID_LEAVE ("Неплатен годишен отпуск"),
    SICK_LEAVE ("Болничен"),
    MATERNITY_LEAVE ("Отпуск по майчинство"),
    PATERNITY_LEAVE ("Отпуск по бащинство"),
    ADDITIONAL_PAID_LEAVE ("Допълнителен платен годишен отпуск");

    private final String description;

    LeaveType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
