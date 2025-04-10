const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { email, password } = req.body;
  // For simplicity, assume any email/password is valid
  const user = { email };
  const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ accessToken });
};
