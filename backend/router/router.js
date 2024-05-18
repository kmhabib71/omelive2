const express = require("express");
const router = express.Router();
const {
  updateUserCountry,
  updateUserGender,
  updateUserLanguage,
  checkAuthStatus,
  logout,
  signin,
  register,
} = require("../controller/AuthController");

router.post("/api/auth/register", register);
router.post("/api/auth/signin", signin);
router.get("/api/auth/logout", logout);
router.get("/api/auth/status", checkAuthStatus);
router.put("/api/language/:userid", updateUserLanguage);
router.put("/api/gender/:userid", updateUserGender);
router.put("/api/country/:userid", updateUserCountry);
console.log("from router");
module.exports = router;
