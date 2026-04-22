package com.ssafy.oh_jjeom_oh.domain.user.dto.response;

import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Gender;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import lombok.Getter;

@Getter
public class UserInfoResponse {

    private final String username;
    private final String nickname;
    private final String email;
    private final String school;
    private final String grade;
    private final Gender gender;
    private final Role role;
    private final boolean hasWishBoard;

    private UserInfoResponse(String username, String nickname, String email,
                              String school, String grade, Gender gender,
                              Role role, boolean hasWishBoard) {
        this.username = username;
        this.nickname = nickname;
        this.email = email;
        this.school = school;
        this.grade = grade;
        this.gender = gender;
        this.role = role;
        this.hasWishBoard = hasWishBoard;
    }

    public static UserInfoResponse of(User user, boolean hasWishBoard) {
        return new UserInfoResponse(
                user.getUsername(),
                user.getNickname(),
                user.getEmail(),
                user.getSchool(),
                user.getGrade(),
                user.getGender(),
                user.getRole(),
                hasWishBoard
        );
    }
}
