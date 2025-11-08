// src/__tests__/api/experiences.test.ts
import request from "supertest";
import { app } from "../../index"; // adjust if your app export path is different

describe("Experiences API", () => {
  let createdExperienceId: string;

  // --- CREATE EXPERIENCE ---
  describe("POST /experiences", () => {
    it("should create a new experience with valid data", async () => {
      const newExperience = {
        title: "Seaside Village Festival",
        description: "A lively coastal celebration in Nice featuring local food, handmade crafts…",
        admin_region: "Provence-Alpes-Côte d’Azur",
        country: "France",
        city: "Nice",
        postal_code: "06000",
        street: "15 Promenade des Anglais",
        latitude: 43.6955,
        longitude: 7.2656,
        thumbnail_image: "https://cdn.app.com/experiences/9f3d8b1a2c4ed/thumb.jpg",
        tags: ["festival", "crafts", "food"],
        initial_rating: 5
      };

      const res = await request(app)
        .post("/experiences")
        .send(newExperience)
        .expect(201);

      expect(res.body.experience_id).toBeDefined();
      expect(res.body.title).toBe(newExperience.title);
      createdExperienceId = res.body.experience_id; // save for later tests
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteExperience = { title: "Missing description" };
      await request(app)
        .post("/experiences")
        .send(incompleteExperience)
        .expect(400);
    });
  });

  // --- LIST EXPERIENCES ---
  describe("GET /experiences", () => {
    it("should retrieve a list of experiences", async () => {
      const res = await request(app)
        .get("/experiences")
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("should allow filtering by title", async () => {
      const res = await request(app)
        .get("/experiences")
        .query({ title: "Seaside Village Festival" })
        .expect(200);

      expect(res.body.some((e: any) => e.title === "Seaside Village Festival")).toBe(true);
    });
  });

  // --- GET SINGLE EXPERIENCE ---
  describe("GET /experiences/:experience_id", () => {
    it("should retrieve the created experience by ID", async () => {
      const res = await request(app)
        .get(`/experiences/${createdExperienceId}`)
        .expect(200);

      expect(res.body.experience_id).toBe(createdExperienceId);
      expect(res.body.title).toBe("Seaside Village Festival");
    });

    it("should return 404 for non-existent ID", async () => {
      await request(app)
        .get("/experiences/nonexistentid")
        .expect(404);
    });
  });

  // --- GET EXPERIENCE IMAGES ---
  describe("GET /experiences/:experience_id/photos", () => {
    it("should return an array of images for the experience", async () => {
      const res = await request(app)
        .get(`/experiences/${createdExperienceId}/photos`)
        .expect(200);

      expect(res.body.experience_id).toBe(createdExperienceId);
      expect(Array.isArray(res.body.images)).toBe(true);
    });
  });

  // --- UPDATE EXPERIENCE ---
  describe("PATCH /experiences/:experience_id", () => {
    it("should update allowed fields of an existing experience", async () => {
      const updateData = { description: "Updated description with more details." };

      const res = await request(app)
        .patch(`/experiences/${createdExperienceId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.description).toBe(updateData.description);
    });

    it("should return 400 if update contains invalid data", async () => {
      const invalidData = { tags: "not-an-array" };
      await request(app)
        .patch(`/experiences/${createdExperienceId}`)
        .send(invalidData)
        .expect(400);
    });
  });
});
