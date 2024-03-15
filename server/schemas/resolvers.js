const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const userResolvers = {
  Query: {
    // Get a single user by their id or username
    getSingleUser: async (_, { id, username }) => {
      const foundUser = await User.findOne({
        $or: [{ _id: id }, { username: username }],
      });

      if (!foundUser) {
        throw new AuthenticationError('Cannot find a user with this id or username!');
      }

      return foundUser;
    },
  },
  Mutation: {
    // Create a user, sign a token, and send it back
    createUser: async (_, { input }) => {
      const user = await User.create(input);

      if (!user) {
        throw new AuthenticationError('Something went wrong during user creation!');
      }

      const token = signToken(user);
      return { token, user };
    },
    // Login a user, sign a token, and send it back
    login: async (_, { input }) => {
      const user = await User.findOne({ $or: [{ username: input.username }, { email: input.email }] });

      if (!user) {
        throw new AuthenticationError("Can't find this user!");
      }

      const correctPw = await user.isCorrectPassword(input.password);

      if (!correctPw) {
        throw new AuthenticationError('Wrong password!');
      }

      const token = signToken(user);
      return { token, user };
    },
    // Save a book to a user's `savedBooks` field
    saveBook: async (_, { input }, { user }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new AuthenticationError('Failed to save the book!');
      }
    },
    // Remove a book from `savedBooks`
    deleteBook: async (_, { bookId }, { user }) => {
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $pull: { savedBooks: { bookId: bookId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new AuthenticationError("Couldn't find user with this id!");
      }

      return updatedUser;
    },
  },
};

module.exports = userResolvers;