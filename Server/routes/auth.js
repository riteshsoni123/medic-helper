const express = require("express");
const User = require("../models/Doctor");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { ValidatorsImpl } = require("express-validator/src/chain");
const res = require("express/lib/response");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findOne } = require("../models/Doctor");
const fetchuser = require("../middleware/Fetchuser");
const JWT_SECRET = "helloworld";
// ROUTE 1: creating a user using POST : "/api/auth/createuser"
// No LOGIN required
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 5 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "password must be of minimum 5 characters").isLength({
      min: 5,
    }),
  ],
  //validating input got by server, if input is in correct format, then user is created.
  //if any error is there, the return bas request and all the errrors.
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // checking if user with same email already exists or not
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry, user already exist with this email" });
      }
      // if user is aleardy not exist, then create  a new user
      const salt = await bcrypt.genSalt(10);

      const secpass = await bcrypt.hash(req.body.password, salt);
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secpass,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);

      // console.log(jwtData);
      // res.json({ status: "created" });
      res.json({ authtoken });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error!!!");
    }
  }
);

// ROUTE 2: Logging in  a user using POST : "/api/auth/login"
// No LOGIN required
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "password can not be blanked.").exists(),
  ],
  //validating input got by server, if input is in correct format, then user is created.
  //if any error is there, the return bas request and all the errrors.
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res
          .status(400)
          .json({ error: "please, try to login with correct credentials" });
      }
      const password_compare = await bcrypt.compare(password, user.password);
      if (!password_compare) {
        return res
          .status(400)
          .json({ error: "please, try to login with correct credentials" });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      res.send({ authtoken });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error!!!");
    }
  }
);

// ROUTE 3: getting details of a loggedin user using POST: "api/auth/getuser".
// Login Required
router.post(
  "/getuser",
  fetchuser,
  //validating input got by server, if input is in correct format, then user is created.
  //if any error is there, the return bas request and all the errrors.
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("-password");
      res.send(user);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error!!!");
    }
  }
);
module.exports = router;