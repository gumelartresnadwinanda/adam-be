# Adam Backend (adam-be)

Welcome to the backend service for the Adam project. This service handles authentication and user management.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [License](#license)

## Features

- User registration and login
- User profile management
- Password update
- Role-based access control (admin, paid, regular)
- Activity logging
- JWT-based authentication
- Cookie-based session management

## Technologies

- Node.js
- Express.js
- PostgreSQL
- JWT (JSON Web Tokens)
- bcrypt.js
- Jest (for testing)
- Supertest (for API testing)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/adam-be.git
   cd adam-be
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Set up the PostgreSQL database and configure the connection in `config/db.js`.

## Environment Variables

Create a `.env` file in the root directory based on the `.env.example` file and add the necessary environment variables:

```bash
cp .env.example .env
```

## Running the Server

Start the server using the following command:

```bash
yarn start
```

The server will run on the port specified in the `.env` file (default is 3000).

## API Endpoints

### Authentication Routes

- **POST /auth/register**: Register a new user
- **POST /auth/login**: Login a user
- **POST /auth/logout**: Logout a user
- **PUT /auth/edit**: Edit user details
- **PUT /auth/update-password**: Update user password

## Testing

Run the tests using Jest:

```bash
yarn test
```

## License

This project is licensed under the MIT License.
