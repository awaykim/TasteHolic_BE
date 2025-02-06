import express from "express";
import cookieParser from "cookie-parser";  // 추가
import cors from "cors";
import fs from "fs";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";

import {
  handleMyBarPost,
  handleMyBarGet,
  handleMyBarDelete,
} from "./controllers/mybar.controller.js";
import {
  createRecipe,
  getRecipeList,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  updateRecipeLike,
  updateCancelRecipeLike,
} from "./controllers/recipe.controller.js";
import { registerUser, loginUser, logoutUser, deleteUser, socialLogin } from "./services/user.service.js";


// BigInt 변환 설정
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const app = express();
const port = 3000;

app.use(cors()); // CORS 설정
app.use(express.json());

app.use((req, res, next) => {
  res.success = function (data) {
    // BigInt를 처리하는 방법
    const serializedData = JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    this.status(this.statusCode || 200).json({
      resultType: "SUCCESS",
      error: null,
      success: serializedData,
    });
    return this;
  };

  res.error = function ({ errorCode = "unknown", reason = null, data = null }) {
    this.status(this.statusCode || 500).json({
      resultType: "FAIL",
      error: { errorCode, reason, data },
      success: null,
    });
    return this;
  };

  next();
});

app.get("/", (req, res) => {
  res.send("TasteHolic Server");
});

app.post("/api/register", registerUser);
app.post("/api/login", loginUser);
app.post("/api/logout", logoutUser);
app.delete("/api/user", deleteUser);
app.post("/api/social-login", socialLogin);

// Swagger
// YAML 파일 로드
const swaggerDocument = yaml.load(fs.readFileSync("./swagger.yaml", "utf8"));

// Swagger UI 설정
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API
app.post("/api/v1/users/my-bar/post", handleMyBarPost);
app.get("/api/v1/users/my-bar/view", handleMyBarGet);
app.delete("/api/v1/users/my-bar/delete/:barId", handleMyBarDelete);

app.post("/api/v1/recipes", createRecipe);
app.get("/api/v1/recipes/", getRecipeList);
app.get("/api/v1/recipes/:recipeId", getRecipe);
app.patch("/api/v1/recipes/:recipeId", updateRecipe);
app.delete("/api/v1/recipes/:recipeId", deleteRecipe);
app.patch("/api/v1/recipes/:recipeId/like", updateRecipeLike);
app.patch("/api/v1/recipes/:recipeId/like/cancel", updateCancelRecipeLike);

// app.js
app.use((err, req, res, next) => {
  console.error("Caught error:", err);

  if (res.headersSent) {
    return next(err); // 헤더가 이미 전송되었으면 다음 미들웨어로 넘김
  }

  // JSON 형식으로 에러 응답
  res.status(err.statusCode || 500).json({
    resultType: "FAIL",
    error: {
      errorCode: err.errorCode || "unknown",
      reason: err.reason || err.message || null,
      data: err.data || null,
    },
    success: null,
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Swagger 설정
try {
  const swaggerPath = path.resolve(__dirname, "../swagger.yaml");
  if (!fs.existsSync(swaggerPath)) {
    throw new Error(`Swagger 파일이 존재하지 않습니다: ${swaggerPath}`);
  }
  const swaggerDocument = yaml.load(fs.readFileSync(swaggerPath, "utf8"));
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log("Swagger 설정 완료: /swagger 에서 확인 가능");
} catch (error) {
  console.error("Swagger 설정 중 오류 발생:", error.message);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening on port ${port}`);
});
