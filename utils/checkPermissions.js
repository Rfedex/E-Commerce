const CustomError = require('../errors')
const checkPermissions = ({ requestUser, user }) => {
  if (requestUser.userId != user._id && requestUser.role != 'admin') {
    throw new CustomError.UnauthorizedError(
      `You're not authorized to access the details`
    )
  }
}

module.exports = checkPermissions
