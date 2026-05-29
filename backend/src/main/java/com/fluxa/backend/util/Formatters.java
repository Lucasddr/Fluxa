package com.fluxa.backend.util;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class Formatters {

    public static String  formatRelativeDate (LocalDate date){

        LocalDate now = LocalDate.now();

        long diffDays = ChronoUnit.DAYS.between(date, now);

        if (diffDays == 0) {
            return ("Hoje");
        }

        if (diffDays == 1) {
            return ("Ontem");
        }

        return ("Há " + diffDays + " dias");
    }

}
