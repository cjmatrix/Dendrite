import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
      "no-useless-assignment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "prefer-const": "off",
      "no-empty": "off",
      "no-async-promise-executor": "off",
      "preserve-caught-error": "off",
    },
  }
);

