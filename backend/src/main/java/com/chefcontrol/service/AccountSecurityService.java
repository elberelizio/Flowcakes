package com.chefcontrol.service;

import com.chefcontrol.entity.UserEntity;
import com.chefcontrol.exception.InvalidPasswordException;
import com.chefcontrol.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Tentativas falhadas de senha (login ou alteração de contacto). Bloqueio automático após 4.
 */
@Service
public class AccountSecurityService {

    public static final int MAX_PASSWORD_ATTEMPTS = 4;

    private final UserRepository userRepository;
    private final SecurityEventService securityEventService;

    public AccountSecurityService(UserRepository userRepository, SecurityEventService securityEventService) {
        this.userRepository = userRepository;
        this.securityEventService = securityEventService;
    }

    public void assertNotBlocked(UserEntity user) {
        if (user.isBlocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Conta bloqueada. Contacte o suporte para recuperar o acesso.");
        }
    }

    public void resetFailedAttempts(UserEntity user) {
        if (user.getFailedPasswordAttempts() > 0) {
            user.setFailedPasswordAttempts(0);
            userRepository.save(user);
        }
    }

    /** Senha incorrecta: incrementa tentativas, regista evento e bloqueia após o limite. */
    public void registerFailedPassword(
            UserEntity user,
            String failedEventType,
            String contextLabel,
            String ipAddress,
            String userAgent
    ) {
        int attempts = user.getFailedPasswordAttempts() + 1;
        user.setFailedPasswordAttempts(attempts);
        int remaining = Math.max(0, MAX_PASSWORD_ATTEMPTS - attempts);

        securityEventService.log(
                failedEventType,
                user,
                contextLabel + " — tentativa " + attempts + " de " + MAX_PASSWORD_ATTEMPTS,
                ipAddress,
                userAgent
        );

        if (attempts >= MAX_PASSWORD_ATTEMPTS) {
            user.setBlocked(true);
            user.setBlockReason(SecurityEventService.BLOCK_REASON_PASSWORD_ATTEMPTS);
            userRepository.save(user);
            securityEventService.log(
                    SecurityEventService.EVENT_ACCOUNT_AUTO_BLOCKED,
                    user,
                    "Bloqueio automático após " + MAX_PASSWORD_ATTEMPTS + " tentativas falhadas de senha",
                    ipAddress,
                    userAgent
            );
            throw blockedException();
        }

        userRepository.save(user);
        throw new InvalidPasswordException(
                "Senha incorrecta. Restam " + remaining + " tentativa(s) antes do bloqueio da conta.",
                remaining
        );
    }

    public ResponseStatusException blockedException() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Conta bloqueada por excesso de tentativas incorrectas. Contacte o suporte.");
    }

    public void unblockByAdmin(UUID targetUserId, UUID adminUserId, String ipAddress, String userAgent) {
        UserEntity u = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizador não encontrado"));
        u.setBlocked(false);
        u.setBlockReason(null);
        u.setFailedPasswordAttempts(0);
        userRepository.save(u);
        securityEventService.log(
                SecurityEventService.EVENT_ACCOUNT_UNBLOCKED,
                u,
                "Desbloqueio pelo administrador " + adminUserId,
                ipAddress,
                userAgent
        );
    }
}
