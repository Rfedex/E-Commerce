const express = require('express')
const router = express.Router()
const {
  authorizePermission,
  authenticateUser,
} = require('../middleware/authentication')
const {
  getAllOrders,
  getSingleOrder,
  getCurrentUsersOrders,
  createOrder,
  updateOrder,
} = require('../controllers/orderController')

router
  .route('/')
  .get(authenticateUser, authorizePermission('admin'), getAllOrders)
  .post(authenticateUser, createOrder)
router.route('/showAllMyOrders').get(authenticateUser, getCurrentUsersOrders)
router
  .route('/:id')
  .get(authenticateUser, getSingleOrder)
  .patch(authenticateUser, updateOrder)

module.exports = router
