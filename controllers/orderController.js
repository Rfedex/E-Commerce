const Product = require('../models/Product')
const Order = require('../models/Order')
const CustomError = require('../errors')
const { StatusCodes } = require('http-status-codes')
const { checkPermissions } = require('../utils')

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = 'Some Random string'
  return { client_secret, amount }
}

const getAllOrders = async (req, res) => {
  const orders = await Order.find({})
  res.status(StatusCodes.OK).json({ orders, count: orders.length })
}
const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params
  const order = await Order.findOne({ _id: orderId })
  if (!order) {
    throw new CustomError.NotFoundError(`No order with order id ${orderId}`)
  }
  checkPermissions({ requestUser: req.user, user: order.user })
  res.status(StatusCodes.OK).json({ order })
}

const getCurrentUsersOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId })
  res.status(StatusCodes.OK).json({ orders, count: orders.length })
}
const createOrder = async (req, res) => {
  const { tax, shippingFee, items: cartItems } = req.body
  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError(`No cart items are provided`)
  }
  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError(`Please provide tax and shipping fee`)
  }
  let orderItems = []
  let subTotal = 0

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.product })
    if (!dbProduct) {
      throw new CustomError.NotFoundError(`No product with id ${item.product}`)
    }
    const { name, image, price, _id } = dbProduct
    const singleOrderItem = {
      name,
      image,
      price,
      amount: item.amount,
      product: _id,
    }
    //add items to orderItem
    orderItems = [...orderItems, singleOrderItem]
    //calculate subtotal
    subTotal += price * item.amount
  }
  const total = tax + shippingFee + subTotal
  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: 'usd',
  })

  const order = await Order.create({
    orderItems,
    tax,
    shippingFee,
    subTotal,
    total,
    user: req.user.userId,
    clientSecret: paymentIntent.client_secret,
  })

  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret })
}
const updateOrder = async (req, res) => {
  const { id: orderId } = req.params
  const { paymentIntentId } = req.body
  const order = await Order.findOne({ _id: orderId })
  if (!order) {
    throw new CustomError.NotFoundError(`No order with order id ${orderId}`)
  }

  checkPermissions({ requestUser: req.user, user: order.user })
  order.paymentIntentId = paymentIntentId
  order.status = 'paid'

  order.save()
  res.status(StatusCodes.OK).json({ order })
}

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUsersOrders,
  createOrder,
  updateOrder,
}
