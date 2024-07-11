const jwt = require("jsonwebtoken");
const User = require("../model/user.js");

const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.redirect("/login");
    }
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.redirect("/login");
        }
        req.user = decoded;
        next();
    });
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ text: "Incorrect user or password" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ text: "Incorrect user or password" });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.SECRET,
            { expiresIn: "24h" }
        );
        res.json({ token });
    } catch (error) {
        res.status(500).json({ text: "Server error" });
    }
};

module.exports = {
    login,
    verifyToken,
};
