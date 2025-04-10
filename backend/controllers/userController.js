const Users = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const user = await Users.create({ ...req.body });
    const token = user.createJWT();
    res.status(200).json({ user: { name: user.name }, token });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Please provide email and password" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: "Account does not exist" });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ msg: "Invalid password" });
    }

    const token = user.createJWT();
    res.status(200).json({ user: { name: user.name }, token });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong, please try again" });
  }
};

module.exports = { registerUser, loginUser };
