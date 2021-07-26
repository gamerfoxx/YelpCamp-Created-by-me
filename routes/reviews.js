const express = require('express');
const router = express.Router({ mergeParams: true });
//mergeParams: true is required to be able to access the ID of the campground
const catchAsync = require('../helpers/catchAsync');
const ExpressError = require('../helpers/expressError');
const Review = require('../models/review');
const Campground = require('../models/campground');
const { reviewSchema } = require('../schemas.js');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware.js');
const reviews = require('../controllers/reviewController');

router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview))

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview))

module.exports = router;