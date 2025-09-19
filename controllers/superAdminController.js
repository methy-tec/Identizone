import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { SuperAdmin} from "../models/index.js";

export const register = async (req, res) => {
    try {
        const {username, nom_complet, numero_tel, adresse, password} = req.body;
        
        const existingUser = await SuperAdmin.findOne({ where : {username}});
        if (existingUser) return res.status(400).json({ message: 'Nom d\'utilisateur déjà utiliser'});

        const hashedPassword = await bcrypt.hash(password, 10);
        const superAdmin = await SuperAdmin.create({username, nom_complet, numero_tel, adresse, password: hashedPassword});

        res.status(201).json(superAdmin);
    } catch (err){
        res.status(500).json({message: err.message});
    }
}

export const login = async (req, res) =>{
    try{
        const {username, password} = req.body;
        
        const user = await SuperAdmin.findOne({ where: { username}});
        if (!user) return res.status(400).json({message: 'Utilisateur introuvable'});

        const hashedPassword = await bcrypt.hash(password, 10);

        const valid = await bcrypt.compare(password, hashedPassword);
        if (!valid) return res.status(400).json({ message: 'Mot de passse incorrect'});

        const token = jwt.sign({ id: user.id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '1h'});
        const refreshToken = jwt.sign({ id: user.id, role: user.role}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "2h"});
        res.json({token, refreshToken, user: {id: user.id, nom_complet: user.nom_complet, username: user.username, role: user.role}});

    }catch (err){
        res.status(500).json({ message: err.message})
    }
}
// Rafraîchir le token
export const refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Token manquant ❌" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role, habitatId: decoded.habitatId },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Refresh token invalide ❌", error: err.message });
  }
};