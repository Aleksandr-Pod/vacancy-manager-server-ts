const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const httpErrors = require("http-errors");
const { validationResult } = require("express-validator");
const { secret } = require("../config/config");
const UserModel = require("../dbMongo/models/UserModel");

const generateAccessToken = (id) => {
  const payload = {
    id,
  };
  return jwt.sign(payload, secret, { expiresIn: "24h" });
};

module.exports.registration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw httpErrors(400, "ошибка при валидации");
  }
  const { username, password, email } = req.body;
  const candidate = await UserModel.findOne({ email });
  if (candidate) {
    throw httpErrors(400, "пользователь с таким именем уже существует");
  }

  const hashPassword = bcrypt.hashSync(password, 7);
  const user = new UserModel({
    username,
    password: hashPassword,
    email,
    userToken: null,
  });
  await user.save();
  return res.json({ message: "Пользователь успешно зарегестрирован" });
};

module.exports.login = async (req, res) => {
  const { username, password, email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw httpErrors(400, `пользователь ${username} не найден `);
  }
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    throw httpErrors(400, "введен не верный пароль");
  }
  const token = generateAccessToken(user._id);

  user.userToken = token;
  await user.save();

  return res.json({ user }); //user
};

module.exports.logout = async (req, res) => {
  const userToken = req.headers.authorization.split(" ");
  const user = await UserModel.findOne({ userToken });
  user.userToken = null;
  await user.save();
  return res.json({ message: "User logOut" });
};

module.exports.getUser = async (req, res) => {
  const getUsers = await UserModel.find();
  res.status(200).send({ data: getUsers });
};
