const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const {
  createTokenUser,
  attachCookiesToResponse,
  checkPermissions,
} = require('../utils')

const getAllUsers = async (req, res) => {
  console.log(req.user)
  const users = await User.find({ role: 'user' }).select('-password')
  res.status(StatusCodes.OK).json({ users })
}
const getSingleUser = async (req, res) => {
  const { id: userId } = req.params
  const user = await User.findOne({ _id: userId }).select('-password')
  if (!user) {
    throw new CustomError.NotFoundError(`No user with user id : ${userId}`)
  }
  checkPermissions({ requestUser: req.user, user })
  res.status(StatusCodes.OK).json({ user })
}
const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user })
}
const updateUser = async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) {
    throw new CustomError.BadRequestError(`Please provide name and email`)
  }

  const user = await User.findOneAndUpdate(
    { _id: req.user.userId },
    { name, email },
    { new: true, runValidators: true }
  )

  const tokenUser = createTokenUser({ user })
  attachCookiesToResponse({ res, payload: tokenUser })
  res.status(StatusCodes.OK).json({ user: tokenUser })
}
const updateUserPassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new CustomError.BadRequestError(`Please provide password details`)
  }

  if (newPassword != confirmPassword) {
    throw new CustomError.BadRequestError(
      `The confirm password should match with the new password provided`
    )
  }

  const user = await User.findOne({ _id: req.user.userId })
  const isPasswordMatch = await user.comparePassword(currentPassword)
  if (!isPasswordMatch) {
    throw new CustomError.UnauthenticatedError(
      `The current password does not match the actual password`
    )
  }
  user.password = newPassword
  await user.save()
  res.status(StatusCodes.OK).json({ msg: 'Password changed successfully!' })
}

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
}
