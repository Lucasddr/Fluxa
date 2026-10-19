package com.fluxa.backend.service;

import com.fluxa.backend.domain.entity.Account;
import com.fluxa.backend.domain.entity.User;
import com.fluxa.backend.dto.request.create.CreateAccountDTO;
import com.fluxa.backend.dto.request.update.UpdateAccountDTO;
import com.fluxa.backend.dto.response.AccountResponseDTO;
import com.fluxa.backend.exception.AccountInUseException;
import com.fluxa.backend.exception.AccountNotFoundException;
import com.fluxa.backend.repository.AccountRepository;
import com.fluxa.backend.repository.AccountBalanceObservationRepository;
import com.fluxa.backend.repository.CreditPurchaseRepository;
import com.fluxa.backend.repository.TransactionRepository;
import com.fluxa.backend.repository.UserRepository;
import com.fluxa.backend.security.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final AccountBalanceObservationRepository balanceObservationRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final CreditPurchaseRepository creditPurchaseRepository;

    public void createDefaultAccount(User user){

        Account account = new Account();

        account.setUser(user);
        account.setName("Principal");
        account.setCurrency("BRL");
        account.setDefault(true);

        accountRepository.save(account);

        log.info("[ACCOUNT] default account created | user: {} | accountName: {} | currency: {}",
                user.getId(),
                account.getName(),
                account.getCurrency()
        );
    }

    @Transactional(readOnly = true)
    public List<AccountResponseDTO> listAccounts() {
        UUID userId = UserContext.getUserId();

        return accountRepository.findAllForUser(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AccountResponseDTO createCustomAccount(CreateAccountDTO dto) {
        UUID userId = UserContext.getUserId();
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(AccountNotFoundException::new);
        String name = dto.name().trim();

        if (accountRepository.existsByUserIdAndNameIgnoreCase(userId, name)) {
            throw new AccountInUseException("Já existe uma conta com esse nome.");
        }

        Account account = new Account();
        account.setUser(user);
        account.setName(name);
        account.setCurrency("BRL");
        account.setDefault(accountRepository.findDefaultForUser(userId).isEmpty());

        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponseDTO updateAccount(UUID accountId, UpdateAccountDTO dto) {
        UUID userId = UserContext.getUserId();
        userRepository.findByIdForUpdate(userId)
                .orElseThrow(AccountNotFoundException::new);

        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(AccountNotFoundException::new);
        String name = dto.name().trim();

        if (!account.getName().equalsIgnoreCase(name)
                && accountRepository.existsByUserIdAndNameIgnoreCase(userId, name)) {
            throw new AccountInUseException("Já existe uma conta com esse nome.");
        }

        account.setName(name);
        return toResponse(account);
    }

    @Transactional
    public AccountResponseDTO setDefaultAccount(UUID accountId) {
        UUID userId = UserContext.getUserId();
        userRepository.findByIdForUpdate(userId)
                .orElseThrow(AccountNotFoundException::new);

        Account selected = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(AccountNotFoundException::new);

        if (selected.isDefault()) {
            return toResponse(selected);
        }

        accountRepository.findDefaultForUser(userId).ifPresent(current -> {
            current.setDefault(false);
            accountRepository.saveAndFlush(current);
        });

        selected.setDefault(true);
        return toResponse(accountRepository.saveAndFlush(selected));
    }

    @Transactional
    public void deleteAccount(UUID accountId) {
        UUID userId = UserContext.getUserId();
        userRepository.findByIdForUpdate(userId)
                .orElseThrow(AccountNotFoundException::new);

        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(AccountNotFoundException::new);

        if (transactionRepository.existsByAccountIdAndUserId(accountId, userId)
                || creditPurchaseRepository.existsByAccountIdAndUserId(accountId, userId)
                || balanceObservationRepository.existsByAccountIdAndUserId(accountId, userId)) {
            throw new AccountInUseException(
                    "Esta conta tem movimentações, compromissos ou saldos conferidos e não pode ser excluída.");
        }

        List<Account> accounts = accountRepository.findAllForUser(userId);
        if (accounts.size() <= 1) {
            throw new AccountInUseException("A última conta do usuário não pode ser excluída.");
        }

        if (account.isDefault()) {
            Account replacement = accounts.stream()
                    .filter(candidate -> !candidate.getId().equals(accountId))
                    .findFirst()
                    .orElseThrow(AccountNotFoundException::new);

            account.setDefault(false);
            accountRepository.saveAndFlush(account);
            replacement.setDefault(true);
            accountRepository.saveAndFlush(replacement);
        }

        accountRepository.delete(account);
    }

    private AccountResponseDTO toResponse(Account account) {
        return new AccountResponseDTO(
                account.getId(),
                account.getName(),
                account.getCurrency(),
                account.isDefault()
        );
    }
}
