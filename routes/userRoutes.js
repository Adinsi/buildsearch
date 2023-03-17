const router = require("express").Router();
const authControler = require("../controler/authControler");
const uploadControler = require("../controler/uploadControler");
const UserControler = require("../controler/UserControler");
const authMiddelware = require("../middleware/auth.middleware");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./client/build/image");
  },
  filename: (req, file, cb) => {
    cb(null, `${req.body.name}.jpg`);
  },
});
const upload = multer({ storage: storage });

// Auth
router.post("/upload", upload.single("image"), uploadControler.uploadProfil); //ok
router.put("/forget-password", authControler.forgetPassword); //ok
router.put("/reset/:id/verify/:token", authControler.resetPassword); //ok
router.get("/jwt", authMiddelware.verifyToken, authControler.getUser); //ok
router.post("/logout", authControler.logOut); //ok
router.post("/register", authControler.signUp); //ok
router.get(
  "/active/:id/verify/:token",
  authMiddelware.verifyLink,
  authControler.getUser
);
router.post("/login", authControler.signIn); //ok
router.get("/:id", UserControler.userInfo); //ok
// router.post("/upload", upload.single("file"), uploadControler.uploadProfil); //ok
router.put("/:id", UserControler.UpdateUser); //ok
router.delete("/:id", UserControler.deleteUser); //ok

//user DB
router.get("/", UserControler.getAllUsers);

//Mettre a jour le tablaeu des utilisateurs
router.patch("/follow/:id", UserControler.follow);

router.patch("/unfollow/:id", UserControler.unfollow);

router.get("/refresh", authControler.RefreshToken, authControler.getUser);

module.exports = router;
