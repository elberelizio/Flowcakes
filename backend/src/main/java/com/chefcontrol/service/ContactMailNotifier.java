package com.chefcontrol.service;

import com.chefcontrol.entity.ContactMessageEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ContactMailNotifier {

    private final JavaMailSender mailSender;
    private final String destinationEmail;
    private final String fromEmail;
    private final boolean mailEnabled;

    public ContactMailNotifier(
        @Autowired(required = false) JavaMailSender mailSender,
        @Value("${app.contact.destination-email:commit976@gmail.com}") String destinationEmail,
        @Value("${spring.mail.username:}") String fromEmail,
        @Value("${spring.mail.host:}") String mailHost
    ) {
        this.mailSender = mailSender;
        this.destinationEmail = destinationEmail;
        this.fromEmail = fromEmail;
        this.mailEnabled = mailSender != null && mailHost != null && !mailHost.isBlank();
    }

    public void notifyTeam(ContactMessageEntity entity) {
        if (!mailEnabled) {
            System.out.println("ℹ️ SMTP não configurado — reclamação guardada sem envio de e-mail (id=" + entity.getId() + ").");
            return;
        }

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(destinationEmail);
        if (fromEmail != null && !fromEmail.isBlank()) {
            mail.setFrom(fromEmail);
        }
        mail.setSubject("[Flow Cakes] Reclamação / contacto — " + entity.getFullName());

        String replyEmail = trimOrDash(entity.getEmail());
        String replyPhone = trimOrDash(entity.getPhone());
        mail.setText(String.join("\n",
            "Nova reclamação ou pedido de contacto",
            "",
            "Nome: " + entity.getFullName(),
            "E-mail: " + replyEmail,
            "Telefone: " + replyPhone,
            "",
            "Mensagem:",
            entity.getMessage(),
            "",
            "Página: " + trimOrDash(entity.getPageUrl()),
            "ID interno: " + entity.getId(),
            "",
            "— Enviado pelo formulário de contacto do site Flow Cakes."
        ));

        mailSender.send(mail);
    }

    private String trimOrDash(String value) {
        if (value == null || value.isBlank()) return "—";
        return value.trim();
    }
}
