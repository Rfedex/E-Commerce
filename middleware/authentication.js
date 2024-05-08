const CustomError = require('../errors')
const { isTokenValid } = require('../utils')

const authenticateUser = async (req, res, next) => {
  const token = req.signedCookies.token
  if (!token) {
    throw new CustomError.UnauthenticatedError(`Authentication Invalid`)
  } else {
    try {
      const payload = isTokenValid({ token })
      req.user = {
        name: payload.name,
        userId: payload.userId,
        role: payload.role,
      }
      next()
    } catch (error) {
      throw new CustomError.UnauthenticatedError(`Authentication Invalid`)
    }
  }
}

const authorizePermission = (...roles) => {
  return function (req, res, next) {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        `Unauthorized to access this route`
      )
    }
    next()
  }
}

module.exports = { authenticateUser, authorizePermission }
