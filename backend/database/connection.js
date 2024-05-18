const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.log("Error Connecting to MongoDB: ", error);
    throw error;
  }
};

module.exports = { connectDB };
