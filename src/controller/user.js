const jwt = require("jsonwebtoken");
const User = require("../model/user.js");

const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.redirect("/login");
    }
    jwt.verify(token, "5ebe2294ecd0e0f08eab7690d2a6ee69", (err, decoded) => {
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
            "5ebe2294ecd0e0f08eab7690d2a6ee69",
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
