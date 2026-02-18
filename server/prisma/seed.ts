import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient();
// process is available globally in Node.js, no import is required

/**
 * Keep this as the single source of truth for your curated tags.
 * - Keys are CATEGORY slugs
 * - Each has a label + list of FEATURES (slug + label)
 */
const TAG_TREE = {
  "nature-outdoors": {
    label: "Nature & Outdoors",
    features: [
      { slug: "hiking", label: "Hiking" },
      { slug: "snorkeling", label: "Snorkeling" },
      { slug: "swimming", label: "Swimming" },
      { slug: "kayaking", label: "Kayaking" },
      { slug: "beach", label: "Beach" },
      { slug: "waterfall", label: "Waterfall" },
      { slug: "lake-lagoon", label: "Lake / Lagoon" },
      { slug: "river", label: "River" },
      { slug: "forest-jungle", label: "Forest / Jungle" },
      { slug: "mountain", label: "Mountain" },
      { slug: "cave", label: "Cave" },
      { slug: "scenic-viewpoint", label: "Scenic viewpoint" },
    ],
  },

  "history-culture": {
    label: "History & Culture",
    features: [
      { slug: "fort", label: "Fort" },
      { slug: "castle", label: "Castle" },
      { slug: "ruins", label: "Ruins" },
      { slug: "museum", label: "Museum" },
      { slug: "historic-district", label: "Historic district" },
      { slug: "monument", label: "Monument" },
      { slug: "church-cathedral", label: "Church / Cathedral" },
      { slug: "indigenous-history", label: "Indigenous history" },
      { slug: "art-gallery", label: "Art gallery" },
      { slug: "cultural-center", label: "Cultural center" },
      { slug: "live-performance", label: "Live performance" },
      { slug: "market-plaza", label: "Market / Plaza" },
    ],
  },

  "food-drink": {
    label: "Food & Drink",
    features: [
      { slug: "restaurant", label: "Restaurant" },
      { slug: "street-food", label: "Street food" },
      { slug: "cafe-coffee", label: "Café / Coffee" },
      { slug: "bakery", label: "Bakery" },
      { slug: "bar", label: "Bar" },
      { slug: "brewery", label: "Brewery" },
      { slug: "local-cuisine", label: "Local cuisine" },
      { slug: "international-cuisine", label: "International cuisine" },
      { slug: "seafood", label: "Seafood" },
      { slug: "vegetarian-friendly", label: "Vegetarian-friendly" },
      { slug: "hidden-gem", label: "Hidden gem" },
      { slug: "scenic-dining", label: "Scenic dining" },
    ],
  },
};

async function main() {
  // 1) Upsert categories first
  const categoryBySlug = new Map();

  for (const [categorySlug, cfg] of Object.entries(TAG_TREE)) {
    const category = await prisma.tag.upsert({
      where: { slug: categorySlug },
      update: {
        label: cfg.label,
        type: "CATEGORY",
        parentCategoryId: null,
      },
      create: {
        slug: categorySlug,
        label: cfg.label,
        type: "CATEGORY",
        parentCategoryId: null,
      },
    });

    categoryBySlug.set(categorySlug, category);
  }

  // 2) Upsert features tied to each category
  for (const [categorySlug, cfg] of Object.entries(TAG_TREE)) {
    const category = categoryBySlug.get(categorySlug);
    if (!category) throw new Error(`Missing category for slug: ${categorySlug}`);

    for (const f of cfg.features) {
      await prisma.tag.upsert({
        where: { slug: f.slug },
        update: {
          label: f.label,
          type: "FEATURE",
          parentCategoryId: category.id,
        },
        create: {
          slug: f.slug,
          label: f.label,
          type: "FEATURE",
          parentCategoryId: category.id,
        },
      });
    }
  }

  console.log(
    `Seeded ${categoryBySlug.size} categories and ${Object.values(TAG_TREE).reduce(
      (sum, c) => sum + c.features.length,
      0
    )} features.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
