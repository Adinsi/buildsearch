const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { timeStamp } = require("console");
const validator = require("validator");
global._ = require("underscore");

// INSCRIPTION D'UN UTULISATEUR AVEC CES COORDONNEES
module.exports.signUp = async (req, res) => {
  const { nom, prenom, email, quartier, activite, tel, password } = req.body;
  if (!validator.isEmail(email))
    return res.status(400).send({ error: "Invalid Email adress" });

  if (!validator.isLength(password, { min: 8 }))
    return res.status(400).send({
      error: "Votre mot de passe doit contenir au moins 8 caractères",
    });
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return res.status(500).json({
      message: `Erreur interne du serveur ${err}, veuillez vérifiez votre connexion internet"`,
    });
  }

  if (existingUser) {
    return res.status(400).json({
      message: "L'utilisateur avec cet email existe déjà ! connectez vous",
    });
  }
  // Crypter le mot de passe de l'utilisateur avec bcrypt
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = new User({
    nom,
    prenom,
    email,
    quartier,
    activite,
    tel,
    password: hashedPassword,
    token: crypto.randomBytes(14).toString("hex"),
    posts: [],
    verified: false,
    userId: crypto.randomBytes(14).toString("hex"),
  });

  try {
    await user.save();
    const url = `${process.env.CLIENT_URL}/verify/${user.userId}/activate/${user.token}`;

    await sendEmail(
      user.email,
      "Validation de votre email sur SearchMeri",
      `
       <div style="background-color: #FFFFFF;margin:auto;font-family:'Montserrat', sans-serif;@import url('https://fonts.cdnfonts.com/css/montserrat');max-height: 400px;width: 100%;text-align: center;"  class="container">
    <h1>Bienvenue sur SearchMeri</h1>
    <p>Appuyez sur le bouton ci-dessous pour confirmer votre adresse e-mail. Si vous n'avez pas créé de compte avec , vous pouvez supprimer cet e-mail en toute sécurité.</p>
    <br/>
    <p>Ce lien <b> expire dans un délai de 1h</b></p>
    <button style="background-color: #1A82E2;border:none;padding:15px;border-radius: 10px;cursor:pointer;">  <a style="color: black;" href=${url}> Cliquez sur ce lien pour finaliser l'inscription</a></button>
    <p>Si cela ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur : ${url}</p> 

  </div> 
      `
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur interne du serveur : " + error });
  }
  return res.status(201).json({ message: `L'utilisateur créer avec success` });
};

// CONNECTEZ AU SITE AVEC CES COORDONNEES APRES AVOIR VERIFIEZ LE MAIL
module.exports.signIn = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return res.status(500).json({
      message: `Erreur interne du serveur ${error}, veuillez vérifiez votre connexion internet" `,
    });
  }
  if (!existingUser) {
    return res.status(401).json({
      message:
        "Cet émail n'existe pas dans notre base de donnée, Inscrivez-vous ! ",
    });
  }
  // comparer le mot de la bd au mot de passe saisie lors de la connexion
  const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({
      message:
        "Le mot de passe ou l'émail est invalide, veuillez bien saisir vos cordonnées",
    });
  }

  // Si le compte n'est pas encore approuvé, on lui renvoie un autre mail de confirmation
  if (!existingUser.verified) {
    const url = `${process.env.CLIENT_URL}/verify/${existingUser.userId}/activate/${existingUser.token}`;
    await sendEmail(
      existingUser.email,
      "Terminez votre inscription",
      `
       <div style="background-color: #FFFFFF;margin:auto;font-family:'Montserrat', sans-serif;@import url('https://fonts.cdnfonts.com/css/montserrat');max-height: 400px;width: 100%;text-align: center;"  class="container">
    <h1>Confirmez votre adresse email</h1>
    <p>Appuyez sur le bouton ci-dessous pour confirmer votre adresse e-mail. Si vous n'avez pas créé de compte avec , vous pouvez supprimer cet e-mail en toute sécurité.</p>
    <p>Ce lien <b> expire dans un délai de 1h</b></p>
    <button style="background-color: #1A82E2;border:none;padding:15px;border-radius: 10px;cursor:pointer;">  <a style="color: black;" href=${url}> Cliquez sur ce lien pour finaliser l'inscription</a></button>
    <p>Si cela ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur : ${url}</p> 

  </div> 
      `
    );

    return res.status(400).json({
      message: "Un nouvel email vous a été renvoyé, vérifiez votre boîte mail",
    });
  }
  const token = jwt.sign({ id: existingUser._id }, process.env.TOKEN_SECRETE, {
    expiresIn: "3d",
  });

  res.cookie(String(existingUser._id), token, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 1000 * 1000),
    httpOnly: true,
    sameSite: "lax",
  });

  return res
    .status(200)
    .json({ message: "Connection réussie", user: existingUser, token });
};

// REFRESH TOKEN
module.exports.RefreshToken = async (req, res, next) => {
  const cookies = req.headers.cookie;
  const preventToken = cookies?.split("=")[1];
  if (!preventToken) {
    return res.status(404).json({ message: "Vous n'avez pas de token" });
  }
  jwt.verify(String(preventToken), process.env.TOKEN_SECRETE, (err, user) => {
    if (err) {
      return res.status(400).json({ message: "Authentification échoué" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user._id}`] = "";
    const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRETE, {
      expiresIn: "7d",
    });

    // console.log("REGEBERATED TOKEN\n", token);

    res.cookie(String(user._id), token, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 30),
      httpOnly: true,
      sameSite: "lax",
    });
    req.id = user.id;
    next();
  });
};

//RECUPERER LES INFOS DE L'UTILISATEUR
module.exports.getUser = async (req, res) => {
  const userId = req.id;
  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (error) {
    return new Error(error);
  }
  try {
    if (user) {
      return res.status(200).json({ user });
    }
  } catch (error) {
    res.status(404).json({ message: "L'utilisateur n'existe pas" });
  }
};

//cHANGER LE MOT DE PASSE EN VERIFIANT SI L'EMAIL EXISTE
module.exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return new Error(error);
  }
  if (!existingUser) {
    return res.status(400).json({
      message:
        "Cet émail n'existe pas dans notre base de donnée, Inscrivez-vous ! ",
    });
  }

  const resetLink = crypto.randomBytes(14).toString("hex");
  const resetId = crypto.randomBytes(14).toString("hex");

  await existingUser.updateOne({ resetLink, resetId });
  try {
    const url = `${process.env.CLIENT_URL}/reset/${resetId}/verify/${resetLink}`;

    await sendEmail(
      existingUser.email,
      "Changer votre mot de passe",
      `
       <div style="background-color: #FFFFFF;margin:auto;font-family:'Montserrat', sans-serif;@import url('https://fonts.cdnfonts.com/css/montserrat');max-height: 400px;width: 100%;text-align: center;"  class="container">
    <h1>Confirmez votre adresse e-mail pour changer votre mot de passe</h1>
    <p>Appuyez sur le bouton ci-dessous pour confirmer votre adresse e-mail. Si vous n'avez pas créé de compte avec , vous pouvez supprimer cet e-mail en toute sécurité.</p>
    <p>Ce lien <b> expire dans un délai de 1h</b></p>
    <button style="background-color: #1A82E2;border:none;padding:15px;border-radius: 10px;cursor:pointer;">  <a style="color: black;" href=${url}> Cliquez sur ce lien pour changer votre mot de passe</a></button>
    <p>Si cela ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur : ${url}</p> 

  </div> 
      `
    );
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }

  res.status(200).json({ message: existingUser });
};
//METTRE UN NOUVEAU MOT DE PASSE SI L'EMAIL EXISTE
module.exports.resetPassword = async (req, res) => {
  const { newPass } = req.body;
  let exinstinguser;
  try {
    exinstinguser = await User.findOne({
      resetId: req.params.id,
      resetLink: req.params.token,
    });

    if (!exinstinguser)
      return res.status(400).json({
        message:
          "Votre lien de vérification à problablement expirer ou a déja été cliquer. Veuillez recommencer le processus de changement du mot de passe.",
      });

    const hashedPassword = bcrypt.hashSync(newPass, 10);
    await exinstinguser.updateOne({
      resetLink: "",
      resetId: "",
      password: hashedPassword,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur interne du serveur" + error,
    });
  }

  if (exinstinguser) {
    res.status(200).json({
      message:
        "Votre mot de passe changé a été changer, connectez-vous maintenant !",
    });
  }
};
//DECONNECTER L'UTILISATEUR DU SITE EN SUPPRIMANT LE COOKIE
module.exports.logOut = async (req, res) => {
  const cookies = req.headers.cookie;
  const preventToken = cookies?.split("=")[1];
  if (!preventToken) {
    return res
      .status(404)
      .json({ message: "Vous n'avez pas de token d'uthentification" });
  }
  jwt.verify(String(preventToken), process.env.TOKEN_SECRETE, (err, user) => {
    if (err) {
      return res.status(400).json({ message: "Authentification échoué" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user._id}`] = "";
    return res.status(200).json({ message: "Déconnexion réussie" });
  });
};
