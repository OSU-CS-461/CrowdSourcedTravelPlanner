import { ExperiencePutPostBodySchema, ExperiencePutPostBody } from "../../models/experience";

const BASE_VALID_EXP = (): ExperiencePutPostBody => ({
    title: "Bright Angel Trail",
    description: "A beautiful hike with incredible views of the Grand Canyon.",
    country: "US"
});


describe("Experience generic validation", () => {
    it("passes a correct baseline experience object", () => {
        const parsed = ExperiencePutPostBodySchema.safeParse(BASE_VALID_EXP());
        expect(parsed.success).toBeTruthy();
    });

    // ---- TITLE ----

    it("fails if title is missing", () => {
        const { title, ...data} = BASE_VALID_EXP();
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    })

    it("fails if title is too short", () => {
        const data = { ...BASE_VALID_EXP(), title: "Hi" };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });

    it("fails if title is too long", () => {
        const data = { ...BASE_VALID_EXP(), title: "A".repeat(201) };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });

    // ---- DESCRIPTION ----

    it("fails if description is missing", () => {
        const { description, ...data} = BASE_VALID_EXP();
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    })

    it("fails if description is too short", () => {
        const data = { ...BASE_VALID_EXP(), description: "Short desc" };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });

    // ---- COUNTRY ----

    it("fails if country is missing", () => {
        const { country, ...data } = BASE_VALID_EXP();
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });

    // ---- OTHER ----

    it("passes if optional fields are missing", () => {
        const { keywords, ...data } = BASE_VALID_EXP();
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeTruthy();
    });


    it("fails if keywords is not an array of strings", () => {
        const data = { ...BASE_VALID_EXP(), keywords: [false, 5] };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });
});


describe("Experience cascading dependencies", () => {
    // --- LATITUDE/LONGITUDE ---
    it("passes when both latitude and longitude are provided", () => {
        const data = { ...BASE_VALID_EXP(), latitude: 10, longitude: 20 };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeTruthy();
    });

    it("fails when only latitude is provided", () => {
        const data = { ...BASE_VALID_EXP(), latitude: 10 };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
        if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain("Latitude and longitude must both be provided together");
        }
    });

    it("fails when only longitude is provided", () => {
        const data = { ...BASE_VALID_EXP(), longitude: 20 };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });

    // --- POSTAL CODE DEPENDENCY ---
    it("fails if postalCode is provided but street is missing", () => {
        const data = { ...BASE_VALID_EXP(), postalCode: "12345" };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });

    it("passes if postalCode, street, city, and adminRegion are provided", () => {
        const data = { 
        ...BASE_VALID_EXP(), 
        postalCode: "12345", 
        street: "Main St", 
        city: "Springfield", 
        adminRegion: "IL" 
        };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeTruthy();
    });

    // --- STREET DEPENDENCY ---
    it("fails if street is provided but city is missing", () => {
        const data = { ...BASE_VALID_EXP(), street: "Main St" };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });

    it("passes if street, city, and adminRegion are provided", () => {
        const data = { ...BASE_VALID_EXP(), street: "Main St", city: "Springfield", adminRegion: "IL" };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeTruthy();
    });

    // --- CITY DEPENDENCY ---
    it("fails if city is provided but adminRegion is missing", () => {
        const data = { ...BASE_VALID_EXP(), city: "Springfield" };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeFalsy();
    });

    it("passes if city and adminRegion are provided", () => {
        const data = { ...BASE_VALID_EXP(), city: "Springfield", adminRegion: "IL" };
        const parsed = ExperiencePutPostBodySchema.safeParse(data);
        expect(parsed.success).toBeTruthy();
    });
});
