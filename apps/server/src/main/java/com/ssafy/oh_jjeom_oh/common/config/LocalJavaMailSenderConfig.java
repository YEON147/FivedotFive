package com.ssafy.oh_jjeom_oh.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Arrays;

/**
 * {@code local} 프로필에는 운영용 SMTP 설정이 없어 {@link JavaMailSender} 자동구성이 되지 않습니다.
 * 비밀번호 재설정 OTP 등은 실제 발송 대신 로그로만 출력합니다.
 */
@Configuration
@Profile("local")
public class LocalJavaMailSenderConfig {

    private static final Logger log = LoggerFactory.getLogger(LocalJavaMailSenderConfig.class);

    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        return new JavaMailSenderImpl() {
            @Override
            public void send(SimpleMailMessage simpleMessage) throws MailException {
                logMail(simpleMessage);
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) throws MailException {
                for (SimpleMailMessage m : simpleMessages) {
                    logMail(m);
                }
            }

            private void logMail(SimpleMailMessage m) {
                String to =
                        m.getTo() != null ? String.join(", ", Arrays.asList(m.getTo())) : "";
                log.info(
                        "[local-mail] 전송 생략 — to={}, subject={}, text={}",
                        to,
                        m.getSubject(),
                        m.getText());
            }
        };
    }
}
