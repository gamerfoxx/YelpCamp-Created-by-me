if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const catchAsync = require('./helpers/catchAsync');
const ExpressError = require('./helpers/expressError');
const Joi = require('joi');
const flash = require('connect-flash');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const mongoose = require('mongoose');
const Campground = require('./models/campground');
const Review = require('./models/review');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');


const campgroundsRoute = require('./routes/campgrounds');
const reviewsRoute = require('./routes/reviews');
const userRoute = require('./routes/users');

const MongoDBStore = require("connect-mongo");

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/my-yelp-camp';

// const dbUrl = process.env.DB_URL;
// const dbUrl = 'mongodb://localhost:27017/my-yelp-camp';


mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
//used to shorten the code a bit
db.on("error", console.error.bind(console, 'connection error'));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(methodOverride('_method'));
//defines the URL to override the default form method
app.use(express.static(path.join(__dirname, 'public')));
//Sets the default path for resources
app.use(express.urlencoded({ extended: true }));
//required to access the req.body
app.use(mongoSanitize({
    replaceWith:'_'
}));

const secret = process.env.SECRET || 'Thisisaterriblesecret';

const sessionConfig = {
    store: MongoDBStore.create({
        mongoUrl: dbUrl,
        secret: secret,
        touchAfter: 24 * 60 * 60,
      }),
    name: "This is my cookie name",
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure:true,
        // will only allow cookies to be updated on an HTTPS connection
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

//HOW TO ALLOW ONLY CERTAIN DOMAIN RESOURCES
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dnwgyxtp6/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);
//END OF HOW TO ALLOW ONLY CERTAIN DOMAIN RESOURCES

app.use(passport.initialize());
app.use(passport.session());
//passport.session MUST BE AFTER app.use(session(sessionConfig));
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    // console.log(req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next()
})

// app.get('/fakeUser', async (req, res) => {
//     const user = new User({ email: 'joey.revontulet@gmail.com', username: 'flare' })
//     const newUser = await User.register(user, 'fops');
//     res.send(newUser);
// })

app.use('/', userRoute);
app.use('/campgrounds', campgroundsRoute);
app.use('/campgrounds/:id/reviews', reviewsRoute);



app.get('/', (req, res) => {
    res.render('home')
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not found... Fuck', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "SOMETHING WENT WRONG!!!! AHHHHHHHHH";
    res.status(statusCode).render('error', { err });
})

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Serving on port ${port}`);
})