import { useState, useEffect } from "react";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ME } from "../utils/queries";
import { REMOVE_BOOK } from "../utils/mutations";
import Auth from "../utils/auth";
import { removeBookId } from "../utils/localStorage";

const SavedBooks = () => {
  const [userData, setUserData] = useState({});
  const { loading, error, data } = useQuery(GET_ME);
  const [removeBookMutation] = useMutation(REMOVE_BOOK);

  useEffect(() => {
    if (data) {
      setUserData(data.me);
    }
  }, [data]);

  console.log("userData.savedBooks:", userData.savedBooks);


  // create function that accepts the book's mongo _id value as param and deletes the book from the database
  const handleDeleteBook = async (bookId) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      // Execute the removeBook mutation with the bookId
      await removeBookMutation({ variables: { bookId } });

      // Update userData with the result of the mutation using a callback function
    setUserData(prevUserData => {
      const updatedUserData = { ...prevUserData };
      updatedUserData.savedBooks = updatedUserData.savedBooks.filter(
        (book) => book.bookId !== bookId
      );
      return updatedUserData;
    });
    
      // upon success, remove book's id from localStorage
      removeBookId(bookId);
    } catch (err) {
      console.error('Cannot do that!!', err);
    }
  };

  // if data isn't here yet, say so
  if (loading) return <h2>Loading...</h2>;
  if (error) {
    console.error("Error fetching user data:", error);
    return <h2>Error fetching user data</h2>;
  }

  return (
    <>
      <div className="text-light bg-dark p-5" fluid="true">
        <Container>
          <h1>Viewing saved books!</h1>
        </Container>
      </div>
      <Container>
        <h2 className="pt-5">
          {userData && userData.savedBooks && userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? "book" : "books"
              }:`
            : "You have no saved books!"}
        </h2>
        <Row>
          {userData &&
            userData.savedBooks &&
            userData.savedBooks.map((book) => {
              return (
                <Col key={book.bookId}  md="4">
                  <Card border="dark">
                    {book.image ? (
                      <Card.Img
                        src={book.image}
                        alt={`The cover for ${book.title}`}
                        variant="top"
                      />
                    ) : null}
                    <Card.Body>
                      <Card.Title>{book.title}</Card.Title>
                      <p className="small">Authors: {book.authors}</p>
                      <Card.Text>{book.description}</Card.Text>
                      <Button
                        className="btn-block btn-danger"
                        onClick={() => handleDeleteBook(book.bookId)}
                      >
                        Delete this Book!
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;