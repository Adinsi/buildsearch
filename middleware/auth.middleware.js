const User = require("../models/user");
const jwt = require("jsonwebtoken");
global._ = require("underscore");
// Vérifiez si l'émail est valide pour l'authentification
module.exports.verifyLink = async (req, res) => {
  let token;
  try {
    token = await User.findOne({
      token: req.params.token,
      userId: req.params.id,
    });

    if (!token)
      return res.status(400).json({
        message:
          "Le lien est invalide ou a été déjà cliquer lors d'une précédente opération, veuillez vous connecter maintenant.",
      });

    await token.updateOne({
      verified: true,
      token: "",
      userId: "",
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur interne du serveur" + error,
    });
  }
  const tokenVerify = jwt.sign({ id: token._id }, process.env.TOKEN_SECRETE, {
    expiresIn: "3d",
  });
  res.cookie(String(token._id), tokenVerify, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 1000 * 1000),
    httpOnly: true,
    sameSite: "lax",
  });
  return res.status(200).json({
    message: "Votre email est bien vérifié, veuillez vous connecter maintenant",
  });
};
// Vérifiez le token d'authentification
module.exports.verifyToken = async (req, res, next) => {
  const cookies = req.headers.cookie;
  const token = cookies?.split("=")[1];
  try {
    if (!token) {
      return res
        .status(404)
        .json({ message: "Vous n'avez pas de token d'authentification" });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        "Erreur interne du serveur, veuillez vérifiez votre connexion internet",
    });
  }

  jwt.verify(String(token), process.env.TOKEN_SECRETE, (err, user) => {
    if (err) {
      return res.status(400).json({ message: "Votre Token est invalide." });
    }

    req.id = user?.id;
  });

  next();
};
