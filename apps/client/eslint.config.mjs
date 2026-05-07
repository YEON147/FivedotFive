import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /** 브라우저·서버 스팸 방지 — 실제 출력은 `lib/dev-log.ts`만 */
      "no-console": "error",
    },
  },
  {
    files: ["lib/dev-log.ts"],
    rules: {
      "no-console": "off",
    },
  },
  /** 공개 위시 슬러그: slug 변경 시 캐시·페이지 상태 리셋 등 effect 내 setState가 필수 (`[`는 glob 문자 클래스라 이스케이프) */
  {
    files: ["app/wishlist/\\[slug\\]/page.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
