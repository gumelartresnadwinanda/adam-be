const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const authRoutes = require("../routes/authRoutes");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

jest.mock("../config/db");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/auth", authRoutes);

describe("Auth Controller", () => {
  let server;
  const PORT = 4002; // Use a different port to avoid conflicts

  beforeAll((done) => {
    server = app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Register new user", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: "testuser1", email: "testuser1@example.com" }],
    });

    const response = await request(app).post("/auth/register").send({
      username: "testuser1",
      email: "testuser1@example.com",
      full_name: "Test User",
      password: "password123",
    });
    expect(response.status).toBe(201);
    expect(response.body.user).toHaveProperty("id");
  });

  test("Login user", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          username: "testuser2",
          email: "testuser2@example.com",
          password_hash: hashedPassword,
        },
      ],
    });

    const response = await request(app).post("/auth/login").send({
      email: "testuser2@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
  });

  test("Logout user", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 3,
          username: "testuser3",
          email: "testuser3@example.com",
          password_hash: hashedPassword,
        },
      ],
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "testuser3@example.com",
      password: "password123",
    });

    const token = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Logged out successfully");
  });

  test("Edit user details", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 4,
          username: "testuser4",
          email: "testuser4@example.com",
          password_hash: hashedPassword,
        },
      ],
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "testuser4@example.com",
      password: "password123",
    });

    const token = loginResponse.body.accessToken;

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 4,
          username: "testuser4",
          email: "testuser4@example.com",
          full_name: "Updated Test User",
        },
      ],
    });

    const response = await request(app)
      .put("/auth/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        full_name: "Updated Test User",
      });
    expect(response.status).toBe(200);
    expect(response.body.user.full_name).toBe("Updated Test User");
  });

  test("Update user password", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          username: "testuser5",
          email: "testuser5@example.com",
          password_hash: hashedPassword,
        },
      ],
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "testuser5@example.com",
      password: "password123",
    });

    const token = loginResponse.body.accessToken;

    // Mock the response for finding the user by ID
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          username: "testuser5",
          email: "testuser5@example.com",
          password_hash: hashedPassword,
        },
      ],
    });

    // Mock the response for updating the password
    pool.query.mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app)
      .put("/auth/update-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "password123",
        newPassword: "newpassword123",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Password updated successfully");
  });
});
