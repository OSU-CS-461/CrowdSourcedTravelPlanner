import * as z from "zod";

export const ExperiencePutPostBodySchema = z.object({
  // ---- REQUIRED ---  
  title: z.string().min(3).max(200),            
  description: z.string().min(20).max(5000),    
  country: z.string().length(2),  // ISO code                   
  
  // ---- OPTIONAL ---
  adminRegion: z.string().optional(),    
  city: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),     
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  thumbnail: z.string().optional(),   
  keywords: z.array(z.string()).optional(),
})
.refine(
  (data) => {
    // Latitude/Longitude dependency:
    // if either is provided, both must be provided
    const latProvided = data.latitude !== undefined;
    const lonProvided = data.longitude !== undefined;
    return (latProvided && lonProvided) || (!latProvided && !lonProvided);
  },
  { message: "Latitude and longitude must both be provided together", path: ["latitude", "longitude"] }
)
.refine(
  (data) => {
    // if postalCode is provided, street, city, and adminRegion must also be provided
    if (data.postalCode !== undefined) {
      return (data.street !== undefined) &&
             (data.city !== undefined) &&
             (data.adminRegion !== undefined);
    }
    return true;
  },
  { message: "Postal code requires city, street, and adminRegion", path: ["postalCode", "street", "city", "adminRegion"] }
)
.refine(
  (data) => {
    // if street is provided, city and adminRegion must also be provided
    if (data.street !== undefined) {
      return (data.city !== undefined && data.adminRegion !== undefined);
    }
    return true;
  }
)
.refine(
  (data) => {
    // if city is provided, adminRegion must also be provided
    if (data.city !== undefined && data.city !== null) {
      return data.adminRegion !== undefined;
    }
    return true;
  },
  { message: "Street requires city and adminRegion; city requires adminRegion", path: ["street", "city", "adminRegion"] }
)

export const ExperiencePatchBodySchema = z.object({           
  thumbnail: z.string().optional(),   
  keywords: z.array(z.string()).optional(),
  descriptionEdit: z.string().optional()
})


export const ExperienceListQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  sortBy: z.enum(["avgRating", "dateCreated", "reviewCount", "title"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  title: z.string().optional(),
  country: z.string().length(2).optional(),
  adminRegion: z.string().optional(),
  city: z.string().optional(),
  tags: z.string().optional(),
})



export type ExperiencePutPostBody = z.infer<typeof ExperiencePutPostBodySchema>;
export type ExperiencePatchBody = z.infer<typeof ExperiencePatchBodySchema>;
export type ExperienceListQuery = z.infer<typeof ExperienceListQuerySchema>;