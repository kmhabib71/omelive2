const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    name: {
      type: String,
    },
    userLanguage: {
      type: String,
    },
    userGender: {
      type: String,
    },
    userCountry: {
      type: String,
    },
  },
  {
    timeseries: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
