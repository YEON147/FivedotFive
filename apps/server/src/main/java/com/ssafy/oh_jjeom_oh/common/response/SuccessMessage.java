package com.ssafy.oh_jjeom_oh.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SuccessMessage {
    // 유저
    USER_INFO_FOUND("유저 정보 조회가 완료되었습니다."),
    USER_INFO_REGISTER("내 정보가 등록되었습니다."),
    USER_INFO_UPDATED("내 정보가 수정되었습니다."),
    SCHOOL_UPDATED("학교가 변경되었습니다."),
    GENDER_UPDATED("성별이 변경되었습니다."),
    NICKNAME_UPDATED("닉네임이 변경되었습니다."),
    GRADE_UPDATED("학년이 변경되었습니다."),
    USER_INFO_DELETED("회원 탈퇴가 완료되었습니다."),
    NICKNAME_VALID("사용 가능한 닉네임입니다."),
    NICKNAME_CREATED("랜덤 닉네임이 생성되었습니다."),
    OTP_SENT("임시 비밀번호가 발송되었습니다."),
    OTP_VERIFIED("인증번호가 확인되었습니다."),
    PASSWORD_RESET_SUCCESS("비밀번호가 재설정되었습니다."),

    LOGIN_SUCCESS("로그인 되었습니다."),
    SIGNUP_SUCCESS("회원가입이 완료되었습니다."),
    CHECK_SUCCESS("조회가 완료되었습니다."),
    AVAILABLE_ID("사용 가능한 아이디입니다."),
    DUPLICATE_ID("이미 사용 중인 아이디입니다."),
    AVAILABLE_EMAIL("사용 가능한 이메일입니다."),
    LOGOUT_SUCCESS("로그아웃 되었습니다."),
    REFRESH_SUCCESS("토큰이 재발급되었습니다."),

    // 위시보드
    BOARD_CREATED("위시보드가 생성되었습니다."),
    BOARD_FOUND("위시보드 조회가 완료되었습니다."),
    BOARD_EXISTS_CHECKED("위시보드 존재 여부 조회가 완료되었습니다."),
    BOARD_UPDATED("위시보드가 수정되었습니다."),
    BOARD_VISIBILITY_UPDATED("보드 공개 여부가 변경되었습니다."),

    // 위시 아이템
    WISH_ITEM_FOUND("위시 아이템 조회가 완료되었습니다."),
    WISH_ITEM_UPDATED("위시 아이템이 수정되었습니다."),
    WISH_ITEM_DELETED("위시 아이템이 삭제되었습니다."),
    WISH_ITEM_LIKED("공감이 반영되었습니다."),

    // 보드 에셋
    BACKGROUND_LIST_FOUND("배경 목록 조회가 완료되었습니다."),
    BACKGROUND_FOUND("배경 조회가 완료되었습니다."),
    BACKGROUND_UPDATED("배경이 변경되었습니다."),
    BACKGROUND_DELETED("배경이 삭제되었습니다."),
    STICKER_LIST_FOUND("스티커 목록 조회가 완료되었습니다."),
    STICKER_FOLDER_LIST_FOUND("스티커 폴더 목록 조회가 완료되었습니다."),
    STICKER_FOLDER_FOUND("스티커 폴더 조회가 완료되었습니다."),
    STICKER_FOUND("스티커 조회가 완료되었습니다."),
    STICKER_UPDATED("스티커가 변경되었습니다."),
    STICKER_DELETED("스티커가 삭제되었습니다."),
    GIFT_ICON_LIST_FOUND("선물 아이콘 목록 조회가 완료되었습니다."),

    // 댓글
    COMMENT_LIST_FOUND("댓글 목록 조회가 완료되었습니다."),
    COMMENT_CREATED("댓글이 작성되었습니다."),
    COMMENT_UPDATED("댓글이 수정되었습니다."),
    COMMENT_DELETED("댓글이 삭제되었습니다."),

    // 댓글 스티커 (선물 아이콘)
    COMMENT_STICKER_FOUND("선물 아이콘 조회가 완료되었습니다."),
    COMMENT_STICKER_UPDATED("선물 아이콘이 변경되었습니다."),
    COMMENT_STICKER_DELETED("선물 아이콘이 삭제되었습니다."),

    // 랭킹
    SCHOOL_USER_RANKING_FOUND("학교별 사용자 수 랭킹 조회가 완료되었습니다."),
    SCHOOL_COMMENT_RANKING_FOUND("학교별 댓글 수 랭킹 조회가 완료되었습니다."),
    USER_COMMENT_RANKING_FOUND("개인별 댓글 수 랭킹 조회가 완료되었습니다."),

    // 공유 링크
    SHARE_LINK_CREATED("공유 링크가 생성되었습니다."),

    // 에셋 동기화
    ASSET_SYNC_COMPLETED("에셋 동기화가 완료되었습니다."),

    // 공지사항
    NOTICE_LIST_FOUND("공지사항 목록 조회가 완료되었습니다."),
    NOTICE_FOUND("공지사항 조회가 완료되었습니다."),
    NOTICE_CREATED("공지사항이 등록되었습니다."),
    NOTICE_UPDATED("공지사항이 수정되었습니다."),
    NOTICE_DELETED("공지사항이 삭제되었습니다."),
    BANNER_LIST_FOUND("배너 목록 조회가 완료되었습니다.");

    private final String message;
}
