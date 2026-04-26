package com.ssafy.oh_jjeom_oh.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendEmail(String toEmail, String title, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setFrom("l17806500@gmail.com");
        message.setSubject(title);
        message.setText(text);

        try {
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("메일 발송 중 에러 발생: " + e.getMessage());
        }
    }
}