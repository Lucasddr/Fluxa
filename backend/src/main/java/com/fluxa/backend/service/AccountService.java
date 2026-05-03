package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Account;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.CreateAccountDTO;
import com.fluxa.backend.dto.RegisterDTO;
import com.fluxa.backend.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@RequiredArgsConstructor
@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public void createDefaultAccount(User user){

        Account account = new Account();

        account.setUser(user);
        account.setName("Principal");
        account.setStartBalance(BigDecimal.ZERO);
        account.setCurrentBalance(BigDecimal.ZERO);
        account.setCurrency("BRL");

        accountRepository.save(account);

        log.info(
                "[ACCOUNT] default account created | user: {} | accountName: {} | currency: {}",
                user.getId(),
                account.getName(),
                account.getCurrency()
        );
    }

    public void createCustomAccount(User user, CreateAccountDTO dto){
        Account account = new Account();

        account.setUser(user);
        account.setName(dto.name());
        account.setStartBalance(BigDecimal.ZERO);
        account.setCurrentBalance(BigDecimal.ZERO);
        account.setCurrency("BRL");

        accountRepository.save(account);
    }
}
