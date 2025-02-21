const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const adminRoutes = require("../routes/adminRoutes");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../config/db");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/admin", adminRoutes);

describe("Admin Controller", () => {
  let server;
  const PORT = 4001; // Use a different port to avoid conflicts

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

  const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  };

  test("Create admin request", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "uuid-1",
          username: "adminuser1",
          email: "adminuser1@example.com",
        },
      ],
    });

    const response = await request(app)
      .post("/admin/create-admin-request")
      .send({
        username: "adminuser1",
        email: "adminuser1@example.com",
        full_name: "Admin User",
        password: "adminpassword123",
      });
    expect(response.status).toBe(201);
    expect(response.body.adminRequest).toHaveProperty("id");
  });

  test("Validate admin request - valid", async () => {
    const hashedPassword = await bcrypt.hash("adminpassword123", 10);
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "uuid-1",
          username: "adminuser1",
          email: "adminuser1@example.com",
          full_name: "Admin User",
          password_hash: hashedPassword,
        },
      ],
    });

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "uuid-2",
          username: "adminuser1",
          email: "adminuser1@example.com",
          role: "admin",
        },
      ],
    });

    const token = generateToken("uuid-2", "admin"); // Generate a valid token for admin user

    const response = await request(app)
      .post("/admin/validate-admin-request")
      .set("Authorization", `Bearer ${token}`)
      .send({
        requestId: "uuid-1",
        isValid: true,
      });
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("admin");
  });

  test("Validate admin request - invalid", async () => {
    const hashedPassword = await bcrypt.hash("adminpassword123", 10);
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "uuid-1",
          username: "adminuser1",
          email: "adminuser1@example.com",
          full_name: "Admin User",
          password_hash: hashedPassword,
        },
      ],
    });

    const token = generateToken("uuid-2", "admin"); // Generate a valid token for admin user

    const response = await request(app)
      .post("/admin/validate-admin-request")
      .set("Authorization", `Bearer ${token}`)
      .send({
        requestId: "uuid-1",
        isValid: false,
      });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Admin request deleted successfully");
  });

  test("Get admin requests with pagination", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "uuid-1",
          username: "adminuser1",
          email: "adminuser1@example.com",
          full_name: "Admin User",
          password_hash: "hashedpassword",
          created_at: "2023-10-10T00:00:00.000Z",
        },
      ],
    });

    const token = generateToken("uuid-2", "admin"); // Generate a valid token for admin user

    const response = await request(app)
      .get("/admin/admin-requests?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.adminRequests).toHaveLength(1);
  });

  test("Change user to admin", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "uuid-2",
          username: "testuser2",
          email: "testuser2@example.com",
          role: "admin",
        },
      ],
    });

    const token = generateToken("uuid-1", "admin"); // Generate a valid token for admin user

    const response = await request(app)
      .put("/admin/change-to-admin")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: "uuid-2",
      });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("admin");
  });

  test("Change user to paid", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "uuid-2",
          username: "testuser3",
          email: "testuser3@example.com",
          role: "paid",
        },
      ],
    });

    const token = generateToken("uuid-1", "admin"); // Generate a valid token for admin user

    const response = await request(app)
      .put("/admin/change-to-paid")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: "uuid-2",
      });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("paid");
  });

  test("Change paid user to regular", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: "uuid-2",
          username: "testuser4",
          email: "testuser4@example.com",
          role: "regular",
        },
      ],
    });

    const token = generateToken("uuid-1", "admin"); // Generate a valid token for admin user

    const response = await request(app)
      .put("/admin/change-to-regular")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: "uuid-2",
      });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("regular");
  });
});
