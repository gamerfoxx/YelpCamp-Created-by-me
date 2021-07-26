const mongoose = require('mongoose');
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/my-yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
//used to shorten the code a bit
db.on("error", console.error.bind(console, 'connection error'));
db.once("open", () => {
    console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 200; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '60917fdaad45c31a4cce634f',
            title: `${sample(descriptors)} ${sample(places)}`,
            price,
            geometry: {
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ],
                type: 'Point'
            },
            description: `Lorem ipsum, dolor sit amet consectetur adipisicing elit. Praesentium recusandae est animi nesciunt, non dolorem quos autem eaque eum labore illum dolor molestias, nihil voluptatibus dignissimos cupiditate. Similique, consequuntur adipisci.`,
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            images: [
                {
                    url: 'https://res.cloudinary.com/dnwgyxtp6/image/upload/v1620245587/YelpCamp/vpov1ocmcyju0andkweg.jpg',
                    filename: 'YelpCamp/vpov1ocmcyju0andkweg'
                },
                {
                    url: 'https://res.cloudinary.com/dnwgyxtp6/image/upload/v1620245588/YelpCamp/cpja2sdn2uxzpchso3ow.jpg',
                    filename: 'YelpCamp/cpja2sdn2uxzpchso3ow'
                }
            ],

        })
        await camp.save();
    }
}
seedDB().then(() => {
    mongoose.connection.close();
})