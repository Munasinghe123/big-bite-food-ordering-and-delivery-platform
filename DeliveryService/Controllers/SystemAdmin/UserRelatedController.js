const userModel = require('../../Models/UserModel');

const getAllUsers = async (req, res) => {

    try {

        const allUsers = await userModel.find();

        if (!allUsers) {
            return res.status(404).json({ message: "No users" })
        }
        res.status(200).json({ message: "All users", allUsers });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Unable fetch all users", error: err.message })
    }
}

module.exports = { getAllUsers }