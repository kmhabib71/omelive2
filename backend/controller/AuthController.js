const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const checkAuthStatus = async (req, res) => {
  var isAuthenticated;
  console.log("Cookies :", req.cookies.omelive);
  if (req.cookies.omelive) {
    const token = req.cookies.omelive;
    if (!token) {
      return res.json({ isAuthenticated: false });
    }
    try {
      const decoded = jwt.verify(token, "your_secret_key");

      const userId = decoded.userId;
      const user = await User.findById(userId);

      if (user) {
        isAuthenticated = true;
      }
      res.json({ isAuthenticated, user });
    } catch (error) {
      console.log("Error from AutStatus: ", error);
    }
  } else {
    console.log("false");
    return res.json({ isAuthenticated: false });
  }
};
const signin = async (req, res) => {
  console.log("from signin: ", req.body);
  try {
    const { email, password } = req.body;

    const emailRegex = /^\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "INVALID_EMAIL", message: "Invalid Email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ error: "INVALID_PASSWORD", message: "Invalied Password" });
    }

    const token = jwt.sign({ userId: user._id }, "your_secret_key", {
      expiresIn: "7d",
    });

    res.cookie("omelive", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("token :", token);
    res.status(200).json({ message: "SignIn Successful", token: token });
  } catch (error) {
    return res.status(500).json({ error: "Failed to register user" });
  }
};
const register = async (req, res) => {
  console.log("from register: ", req.body);
  try {
    const { email, password } = req.body;

    const emailRegex = /^\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "INVALID_EMAIL", message: "Invalid Email" });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "INVALID_PASSWORD",
        message:
          "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("register: ", req.body);
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      email,
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, "your_secret_key", {
      expiresIn: "7d",
    });

    res.cookie("omelive", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("token :", token);
    res.status(200).json({ message: "Registration Successful", token: token });
  } catch (error) {
    return res.status(500).json({ error: "Failed to register user" });
  }
};
const logout = async (req, res) => {
  try {
    res.clearCookie("omelive", { httpOnly: true });
    res.status(200).json("Logout successfull");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateUserLanguage = async (req, res) => {
  const { userid } = req.params;
  const { language } = req.body;
  console.log("userid: ", userid);
  console.log("language: ", language);

  try {
    // Find the user by id and update their language
    try {
      const updatedItem = await User.findByIdAndUpdate(
        req.params.userid,
        req.body,
        {
          new: true,
        }
      );
      if (!updatedItem) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } catch (error) {
    // Log the error and send a 500 response
    console.error("Error changing language:", error);
    res.status(500).json({ message: "Error updating language" });
  }
};
const updateUserGender = async (req, res) => {
  const { userid } = req.params;
  const { gender } = req.body;

  try {
    // Find the user by id and update their language
    try {
      const updatedItem = await User.findByIdAndUpdate(
        req.params.userid,
        req.body,
        {
          new: true,
        }
      );
      if (!updatedItem) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } catch (error) {
    // Log the error and send a 500 response
    console.error("Error changing language:", error);
    res.status(500).json({ message: "Error updating language" });
  }
};
const updateUserCountry = async (req, res) => {
  try {
    // Find the user by id and update their language
    console.log("country: ", req.params.userid, req.body);
    try {
      const updatedItem = await User.findByIdAndUpdate(
        req.params.userid,
        req.body,
        {
          new: true,
        }
      );
      if (!updatedItem) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } catch (error) {
    // Log the error and send a 500 response
    console.error("Error changing language:", error);
    res.status(500).json({ message: "Error updating language" });
  }
};

module.exports = {
  register,
  signin,
  checkAuthStatus,
  logout,
  updateUserLanguage,
  updateUserGender,
  updateUserCountry,
};
