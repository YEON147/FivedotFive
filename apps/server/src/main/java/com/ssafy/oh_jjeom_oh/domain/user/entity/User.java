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

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 50)
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

    @Column(name = "team_tag", length = 50)
    private String teamTag;

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

    public void registerProfile(String school, Gender gender, String grade) {
        this.school = school;
        this.gender = gender;
        this.grade = grade;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void updatePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void updateSchool(String school) {
        this.school = school;
    }

    public void updateGender(Gender gender) {
        this.gender = gender;
    }

    public void updateGrade(String grade) {
        this.grade = grade;
    }

    public void promoteToAdmin() {
        this.role = Role.ADMIN;
    }

    public void promoteToTeam(String teamTag) {
        this.role = Role.TEAM;
        this.teamTag = teamTag;
    }

    public void withdraw() {
        this.status = Status.DELETED; // Status.INACTIVE
    }

    public void updateProfile(String school, String nickname, Gender gender, String grade, String schoolcode) {
        this.school = school;
        this.nickname = nickname;
        this.gender = gender;
        this.grade = grade;
        this.schoolcode = schoolcode;
    }
}