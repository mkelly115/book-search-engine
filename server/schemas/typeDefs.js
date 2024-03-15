const typeDefs = `
type User {
    _id: ID!
    username: String!
    email: String!
    bookCount: Int
    savedBooks: [Book]
}

type Book {
    bookId: ID!
    authors: [String]
    description: String!
    title: String!
    image: String
    link: String
}

type Auth {
    token: ID!
    user: User
}

type Query {
    me: User
}

type Mutation {
    login(email: String!, password: String!): Auth
    addUser(usename: String!, email: String!, password: String!): Auth
    SaveBook(
        bookId: ID!
        authors: [String]
        description: String!
        title: String!
        image: String
        link: String
    ): User
    removerBook(bookId: ID!): User
}
`;

module.exports = typeDefs