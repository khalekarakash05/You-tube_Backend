# YouTube Backend API - User Routes

This project implements a small part of the backend for a YouTube-like application, focusing on user-related features such as account management, authentication, and user profile updates.

## Features

### User Authentication
- **Register User**: Users can create an account with their avatar and cover image.
- **Login User**: Authenticate existing users and provide access tokens.
- **Logout User**: Securely log out users.
- **Refresh Access Token**: Obtain a new access token using a valid refresh token.

### User Account Management
- **Change Password**: Users can update their current password securely.
- **Update Account Details**: Allows users to modify account information.
- **Update Avatar**: Users can upload a new avatar image.
- **Update Cover Image**: Users can upload a new cover image.

### User Information
- **Get Current User**: Fetch the currently logged-in user's information.
- **Get User Channel Profile**: Retrieve a user's channel profile by username.
- **Get Watch History**: Fetch the logged-in user's watch history.

## Routes Overview

| HTTP Method | Endpoint             | Middleware    | Description                                   |
|-------------|----------------------|---------------|-----------------------------------------------|
| `POST`      | `/register`          | `upload`      | Register a new user with avatar and cover image. |
| `POST`      | `/login`             | None          | Log in an existing user.                     |
| `POST`      | `/logout`            | `verifyJWT`   | Log out the current user.                    |
| `POST`      | `/refresh-token`     | None          | Refresh the user's access token.             |
| `POST`      | `/change-password`   | `verifyJWT`   | Change the current user's password.          |
| `GET`       | `/current-user`      | `verifyJWT`   | Fetch the current user's details.            |
| `PATCH`     | `/update-account`    | `verifyJWT`   | Update account information.                  |
| `PATCH`     | `/avatar`            | `verifyJWT`, `upload` | Update the user's avatar.                   |
| `PATCH`     | `/cover-image`       | `verifyJWT`, `upload` | Update the user's cover image.              |
| `GET`       | `/c/:username`       | `verifyJWT`   | Fetch a user's channel profile by username.  |
| `GET`       | `/history`           | `verifyJWT`   | Retrieve the user's watch history.           |

## Installation

To run this backend part locally, follow the steps below:

1. Clone the repository:
   ```bash
   git clone https://github.com/khalekarakash05/You-tube_Backend.git

2. Install dependencies:
   ```bash
   npm install
   
3. Add a .env file with the following environment variables:
   ```bash
   PORT =
   DATABASE_URL =
   CORS_ORIGIN =
   ACCESS_TOKEN_SECRET=
   ACCESS_TOKEN_EXPIRY=
   REFRESH_TOKEN_SECRET=
   REFRESH_TOKEN_EXPIRY=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=

4. Start the server:
   ```bash
   npm start

5. Your server will start at http://localhost:<PORT>/

## Middleware Used
# Multer:

- Handles file uploads for avatar and coverImage.
- Configured with fields for file validation.

# JWT Verification:
- Secures endpoints to ensure only authenticated users can access them.

