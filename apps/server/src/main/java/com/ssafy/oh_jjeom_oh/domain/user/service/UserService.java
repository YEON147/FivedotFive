package com.ssafy.oh_jjeom_oh.domain.user.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishItemRepository;
import com.ssafy.oh_jjeom_oh.domain.comment.repository.WishCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.user.controller.request.PasswordUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.user.controller.request.UserRegisterRequest;
import com.ssafy.oh_jjeom_oh.domain.user.controller.request.UserUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.user.dto.response.UserInfoResponse;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Gender;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final WishBoardRepository wishBoardRepository;
    private final WishItemRepository wishItemRepository;
    private final WishCommentRepository wishCommentRepository;
    private final PasswordEncoder passwordEncoder;

    public UserInfoResponse getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        boolean hasWishBoard = wishBoardRepository.existsByUser_Id(userId);

        return UserInfoResponse.of(user, hasWishBoard);
    }

    @Transactional
    public void registerMyInfo(Long userId, UserRegisterRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        user.registerProfile(
                request.school(),
                request.gender(),
                request.grade()
        );
    }

    @Transactional
    public void updateMyInfo(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!user.getNickname().equals(request.nickname())) {
            if (userRepository.existsByNickname(request.nickname())) {
                throw new CustomException(ErrorCode.DUPLICATE_NICKNAME);
            }
        }

        Gender genderEnum = (request.gender() != null) ? Gender.valueOf(request.gender().toUpperCase()) : null;

        user.updateProfile(
                request.school(),
                request.nickname(),
                genderEnum,
                request.grade(),
                request.schoolcode()
        );
    }

    @Transactional
    public Long updatePassword(Long userId, PasswordUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new CustomException(ErrorCode.WRONG_PASSWORD);
        }

        if (request.currentPassword().equals(request.newPassword())) {
            throw new CustomException(ErrorCode.SAME_PASSWORD);
        }

        String encryptedPassword = passwordEncoder.encode(request.newPassword());
        user.updatePassword(encryptedPassword);

        return user.getId();
    }

    @Transactional
    public void updateSchool(Long userId, String newSchool) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        user.updateSchool(newSchool);
    }

    @Transactional
    public void updateGender(Long userId, String genderStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        try {
            Gender newGender = Gender.valueOf(genderStr.toUpperCase());
            user.updateGender(newGender);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_GENDER_TYPE);
        }
    }

    @Transactional
    public void updateNickname(Long userId, String newNickname) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getNickname().equals(newNickname)) {
            return; // 변경사항 없음으로 간주하고 종료
        }

        if (userRepository.existsByNickname(newNickname)) {
            throw new CustomException(ErrorCode.DUPLICATE_NICKNAME);
        }

        user.updateNickname(newNickname);
    }

    @Transactional
    public void updateGrade(Long userId, String newGrade) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        user.updateGrade(newGrade);
    }

    @Transactional
    public void withdraw(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!user.getPasswordHash().equals("OAUTH_USER")) {
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                throw new CustomException(ErrorCode.WRONG_PASSWORD);
            }
        }
        wishBoardRepository.findByUser_Id(userId).ifPresent(board -> {
            wishItemRepository.deleteByBoard(board);
            wishCommentRepository.deleteByWishBoard(board);
            wishBoardRepository.delete(board);
        });

        userRepository.delete(user);
    }
}