const { User } = require("../models");
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return await User.findOne({ _id: context.user._id }).populate(
          "savedBooks"
        );
      }
      throw new AuthenticationError("You are not authenticated.");
    },
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Invalid email or password.");
      }

      const correctPassword = await user.isCorrectPassword(password);
      if (!correctPassword) {
        throw new AuthenticationError("Invalid email or password.");
      }

      const token = signToken(user);
      return { token, user };
    },
    addUser: async (parent, { username, email, password }) => {
      try {
        const user = await User.create({ username, email, password });
        const token = signToken(user);
        return { token, user };
      } catch (err) {
        if (err.code === 11000 && err.keyPattern.email) {
          throw new UserInputError("Email already exists");
        }
        throw new UserInputError("Failed to create user");
      }
    },
    saveBook: async (parent, { input }, context) => {
      // Check if user is authenticated
      if (!context.user) {
        throw new AuthenticationError("You must be logged in save a book");
      }
      try {
        // Find the user by ID
        const user = await User.findById(context.user._id);
        if (!user) {
          throw new Error("User not found");
        }

        // Add the new book to the user's savedBooks array
        user.savedBooks.push(input);

        // Save the updated user object
        const updatedUser = await user.save();
        return updatedUser;
      } catch (err) {
        throw new Error("Failed to save book");
      }
    },
    removeBook: async (_, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError(
          "You must be logged in to perform this action"
        );
      }
      try {
        // Find the user and update the savedBooks array to remove the book
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );

        if (!updatedUser) {
          throw new Error("Updated user not found");
        }

        return updatedUser;
      } catch (err) {
        throw new Error(`Failed to remove book: ${err.message}`);
      }
    },
  },
};

module.exports = resolvers;