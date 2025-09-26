import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { sequelize } from "./models/index.js";

dotenv.config();

const app = express();

// 🔒 Sécurité middlewares
app.use(helmet());
app.use(cors({
  origin: "*", // 👈 ici ton front local
  credentials: true // 👈 autorise l’envoi des cookies / auth
}));


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/uploads", express.static("identizone"));
app.disable("x-powered-by");

// 📊 Logs
app.use(morgan("combined"));

// 🚦 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "⛔ Trop de requêtes, réessayez plus tard."
});
app.use(limiter);

// Import Routes
import superAdminRoutes from "./routes/superAdminRoutes.js";
import adminRoutes from "./routes/adminRoute.js";
import preAdminRoutes from "./routes/preAdminRoute.js";
import travailleurRoutes from "./routes/travailleurRoutes.js";
import familleRoutes from "./routes/familleRoutes.js";
import utilisateurRoute from "./routes/utilisateurRoute.js";

// Routes
app.use("/api/super", superAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/preadmin", preAdminRoutes);
app.use("/api/travailler", travailleurRoutes);
app.use("/api/familles", familleRoutes);
app.use("/api/users", utilisateurRoute);

// Route test
app.get("/", (req, res) => {
  res.send("Bienvenue sur Identi Zone API sécurisée !");
});

// Connexion DB + lancement serveur
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("📦 Base de données synchronisée");
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Serveur lancé sur http://localhost:${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion DB :", err);
  });
