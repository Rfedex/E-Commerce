const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const {
  attachCookiesToResponse,
  isTokenValid,
  createTokenUser,
} = require('../utils')

const register = async (req, res) => {
  const { email, name, password } = req.body
  const emailExist = await User.findOne({ email })
  if (emailExist) {
    throw new CustomError.BadRequestError(`Email already exists`)
  }

  const isFirst = (await User.countDocuments({})) === 0
  const role = isFirst ? 'admin' : 'user'
  const user = await User.create({ name, email, password, role })

  const tokenUser = createTokenUser({ user })
  attachCookiesToResponse({ res, payload: tokenUser })

  return res.status(StatusCodes.CREATED).json({ user: tokenUser })
}
const login = async (req, res) => {
  console.log(typeof req.body)
  const { email, password } = req.body
  if (!email || !password) {
    throw new CustomError.BadRequestError(`Please provide email and password`)
  }
  const user = await User.findOne({ email })
  if (!user) {
    throw new CustomError.UnauthenticatedError(`Invalid credentials`)
  }
  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    throw new CustomError.UnauthenticatedError(`Invalid Credentials`)
  }

  const tokenUser = createTokenUser({ user })
  attachCookiesToResponse({ res, payload: tokenUser })

  return res.status(StatusCodes.OK).json({ user: tokenUser })
}
const logout = async (req, res) => {
  res.cookie('token', 'loggedout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  })

  res.status(StatusCodes.OK).json({ msg: `You're now logged out!!` })
}

module.exports = { register, login, logout }
