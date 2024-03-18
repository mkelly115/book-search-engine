import { useState, useEffect } from "react";
import { Container, Col, Form, Button, Card, Row } from "react-bootstrap";

import Auth from "../utils/auth";
import { searchGoogleBooks } from "../utils/API";
import { saveBookIds, getSavedBookIds } from "../utils/localStorage";

import { useMutation } from "@apollo/client";
import { SAVE_BOOK } from "../utils/mutations";

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState("");

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

   useEffect(() => {
    // Save savedBookIds to localStorage whenever it changes
    return () => saveBookIds(savedBookIds)
  }, [savedBookIds]); // Add savedBookIds to the dependency array
    
  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const response = await searchGoogleBooks(searchInput);
      console.log('response: ', response)

      if (!response.ok) {
        throw new Error("something went wrong!");
      }

      const { items } = await response.json();

      const bookData = items.map((book) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ["No author to display"],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || "",
      }));  

      setSearchedBooks(bookData);

      console.log("bookData: ", bookData);
      console.log("search input: ", searchInput);

      setSearchInput("");
    } catch (err) {
      console.error(err);
    }
  };

  // create function to handle saving a book to our database
  const [saveBookMutation] = useMutation(SAVE_BOOK);

  const handleSaveBook = async (bookId) => {
// Find the book with the given bookId in searchedBooks array
const bookToSave = searchedBooks.find((book) => book.bookId === bookId);

// If bookToSave is null or undefined, the book with the given bookId was not found
if (!bookToSave) {
  console.error(`Book with ID ${bookId} not found.`);
  return;
}

    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    // Check if token exists
    if (!token) {
      console.error("No token available. User not authenticated.");
      return;
    }

    console.log("token: ", token);
    console.log("bookId: ", bookId);
    console.log("savedBookIds: ", savedBookIds);

    try {
      // Execute saveBookMutation with the bookId and token
      const { data } = await saveBookMutation({
        variables: {
          input: {
            ...bookToSave, // Pass all properties of the book to save
          },
        },
        // Pass token in the request headers
        context: { headers: { authorization: `Bearer ${token}` } },
      });
      console.log("data: ", data);
      console.log("bookId#2: ", bookId);

      // Check if book was successfully saved
      if (data && data.saveBook) {
        // Update state with the newly saved book ID
        setSavedBookIds([...savedBookIds, bookId]);
        console.log("Book saved successfully:", data.saveBook);
      } else {
        console.log("book didn't save");
      }
    } catch (err) {
      // Log the specific error message received from the server
      console.error("Error saving book:", err.message);
    }
  };

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a book"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className="pt-5">
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : "Search for a book to begin"}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            return (
              <Col md="4" key={book.bookId}>
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
                    {Auth.loggedIn() && (
                      <Button
                        disabled={savedBookIds?.some(
                          (savedBookId) => savedBookId === book.bookId
                        )}
                        className="btn-block btn-info"
                        onClick={() => handleSaveBook(book.bookId)}
                      >
                        {savedBookIds?.some(
                          (savedBookId) => savedBookId === book.bookId
                        )
                          ? "This book has already been saved!"
                          : "Save this Book!"}
                      </Button>
                    )}
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

export default SearchBooks;