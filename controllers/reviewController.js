const Product = require('../models/Product')
const Review = require('../models/Review')
const CustomError = require('../errors')
const { StatusCodes } = require('http-status-codes')
const { checkPermissions } = require('../utils')

const getAllReviews = async (req, res) => {
  const review = await Review.find({}).populate({
    path: 'product',
    select: 'name company price',
  })
  res.status(StatusCodes.OK).json({ review, count: review.length })
}
const createReview = async (req, res) => {
  const { product: productId } = req.body
  req.body.user = req.user.userId
  if (!productId) {
    throw new CustomError.BadRequestError(`Please provide product`)
  }
  const isValidproduct = await Product.findOne({ _id: productId })
  if (!isValidproduct) {
    throw new CustomError.NotFoundError(
      `No product with product id : ${productId}`
    )
  }
  const reviewAlreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId,
  })

  if (reviewAlreadySubmitted) {
    throw new CustomError.BadRequestError(
      `Review is already submitted for this product by the user`
    )
  }
  const review = await Review.create(req.body)
  res.status(StatusCodes.OK).json({ review })
}
const getSingleReview = async (req, res) => {
  const { id: reviewId } = req.params
  const review = await Review.findOne({ _id: reviewId })
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
  }
  res.status(StatusCodes.OK).json({ review })
}
const updateReview = async (req, res) => {
  const { title, comment, rating } = req.body
  const { id: reviewId } = req.params
  const review = await Review.findOne({ _id: reviewId })
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
  }
  checkPermissions({ requestUser: req.user, user: review.user })
  review.title = title
  review.comment = comment
  review.rating = rating
  await review.save()
  res.status(StatusCodes.OK).json({ review })
}
const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params
  const review = await Review.findOne({ _id: reviewId })
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
  }
  checkPermissions({ requestUser: req.user, user: review.user })
  await review.remove()
  res.status(StatusCodes.OK).json({ msg: 'Review deleted sucessfully' })
}

const getSingleProductReviews = async (req, res) => {
  const { id: productId } = req.params
  const reviews = await Review.find({ product: productId })
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length })
}

module.exports = {
  getAllReviews,
  getSingleReview,
  createReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
}
