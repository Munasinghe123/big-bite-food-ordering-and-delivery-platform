
const resturantModel = require('../Models/ResturantModel')

const registerResturant = async (req, res) => {

    try {
        const { name, location, resturantPhoto } = req.body;

        console.log(req.body);

        if (!name || !location || !resturantPhoto) {
            console.log("Provide all the required fields");
            return res.status(404).json({ message: "Provide all the required fields" });
        }

        const exixtingName = await resturantModel.findOne({ resturantName: name, resturantLocation: location });
        if (exixtingName) {
            console.log("Resturant already exixsts!");
            return res.status(404).json({ message: "Resturant already exixsts!" });
        }

        const newResturant = new resturantModel({ name, location, resturantPhoto, paymentStatus })

        const registeredResturant = await newResturant.save();

        res.status(200).json({ message: "Resturant registered successfully", registeredResturant });

    } catch (err) {
        res.status(500).json({ message: "Resturant registration error", error: err.message });
        console.log(err);
    }
}

module.exports = { registerResturant }