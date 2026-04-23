package com.ssafy.oh_jjeom_oh.domain.auth.service;

import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class NicknameService {
    private final String[] adjs = {"꿈꾸는", "사랑스러운", "멋진", "똑똑한", "상큼한", "포근한", "빛나는"}; // 넉넉히 추가
    private final String[] nouns = {"다람쥐", "토끼", "강아지", "고양이", "카피바라", "펭귄", "쿼카"}; // 넉넉히 추가
    private final Random random = new Random();

    public String generateRandomNickname() {
        String adj = adjs[random.nextInt(adjs.length)];
        String noun = nouns[random.nextInt(nouns.length)];

        return adj + noun;
    }
}