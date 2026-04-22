package com.ssafy.oh_jjeom_oh.domain.user.entity;

import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Gender;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Provider;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 12)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 8)
    private String nickname;

    @Column(unique = true, length = 100)
    private String email;

    @Column(length = 100)
    private String school;

    @Column(name = "school_code", length = 100)
    private String schoolcode;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    @Column(length = 20)
    private String grade;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private Provider provider = Provider.LOCAL;

    @Column(name = "provider_id", length = 100)
    private String providerId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private Role role = Role.CHILD;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
