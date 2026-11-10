# 📚 BookNook (Server)

The REST API behind BookNook, a small online library where users add books, borrow them and return them.

**Client Repository:** https://github.com/Minul-lab/booknook-client
**Live Site:** https://booknook-frontend-by-minul.vercel.app/
**Server Live URL:** https://booknook-server-by-minul.vercel.app/

---

## ✨ Features

- **REST API** built with Express.js and MongoDB.
- **JWT protection:** Private routes verify the token issued by Better Auth against the client's JWKS endpoint using `jose`.
- **Ownership checks:** Users can only read their own borrows and manage their own books.
- **Available copies:** Borrowing decreases `quantity` with `$inc`, and returning increases it again. The check and decrease run in one query, so copies never drop below 0.
- **No double borrow:** A unique index on `bookId` and `email` stops a user from borrowing the same book twice.
- **Newest first:** The latest books endpoint uses `sort` and `limit` to return the 6 newest books.

---

## 🛠️ Tech Stack

- Node.js and Express.js
- MongoDB (official driver)
- `jose` for JWT verification
- `cors` and `dotenv`

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Public | Health check |
| GET | `/all-books` | Public | Get all books |
| GET | `/latest-books` | Public | Get the 6 newest books |
| GET | `/all-books/:id` | JWT | Get one book |
| POST | `/add-book` | JWT | Add a book |
| PUT | `/all-books/:id` | JWT (owner) | Update a book |
| DELETE | `/all-books/:id` | JWT (owner) | Delete a book |
| GET | `/my-books/:email` | JWT (owner) | Get the books added by a user |
| POST | `/borrow` | JWT | Borrow a book |
| GET | `/borrow/:email` | JWT (owner) | Get a user's borrowed books |
| DELETE | `/borrow/:id` | JWT (owner) | Return a book |

Private routes expect this header:

```
Authorization: Bearer <token>
```

---

## 🗄️ Database

**Database:** `BookNook`

**`books` collection**

```json
{
  "title": "string",
  "author": "string",
  "quantity": 5,
  "category": "Fiction | Science | History | Kids | Others",
  "image": "image url",
  "description": "string",
  "submittedAt": "ISO date",
  "addedBy": { "name": "string", "email": "string" }
}
```

**`borrow` collection**

```json
{
  "bookId": "book _id as string",
  "title": "string",
  "image": "image url",
  "email": "borrower email",
  "borrowedAt": "ISO date"
}
```

A unique index on `{ bookId, email }` is created when the server starts.

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Minul-lab/booknook-server
cd booknook-server
npm install
```

### 2. Add environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
```

`CLIENT_URL` is the Next.js app. The server reads `${CLIENT_URL}/api/auth/jwks` to verify tokens, so it must match the client's address.

### 3. Run the server

```bash
npm run dev
```

The server runs on http://localhost:8000.

---

## 🌐 Deployment

Add `MONGODB_URI` and `CLIENT_URL` (your live client URL) as environment variables on your hosting platform. In MongoDB Atlas, allow network access from your host.
