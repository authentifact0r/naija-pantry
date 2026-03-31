import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NaijaPantry database...");

  // ── Warehouses ──────────────────────────────────────────
  const lagosWarehouse = await db.warehouse.create({
    data: {
      name: "Lagos Central",
      code: "LOS",
      address: "12 Warehouse Road, Apapa",
      city: "Lagos",
      state: "Lagos",
      country: "NG",
      latitude: 6.4474,
      longitude: 3.3903,
    },
  });

  const abujaWarehouse = await db.warehouse.create({
    data: {
      name: "Abuja Hub",
      code: "ABJ",
      address: "Plot 45 Industrial Layout, Gwagwalada",
      city: "Abuja",
      state: "FCT",
      country: "NG",
      latitude: 9.0579,
      longitude: 7.4951,
    },
  });

  const londonWarehouse = await db.warehouse.create({
    data: {
      name: "London Depot",
      code: "LON",
      address: "Unit 7, Meridian Trading Estate",
      city: "London",
      state: "Greater London",
      country: "GB",
      latitude: 51.5074,
      longitude: -0.1278,
    },
  });

  // ── Admin User ──────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123456", 12);
  const admin = await db.user.create({
    data: {
      email: "admin@naijapantry.com",
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "NaijaPantry",
      role: "ADMIN",
    },
  });

  // ── Test Customer ───────────────────────────────────────
  const customerHash = await bcrypt.hash("customer123", 12);
  const customer = await db.user.create({
    data: {
      email: "customer@example.com",
      passwordHash: customerHash,
      firstName: "Chioma",
      lastName: "Okafor",
      phone: "+2348012345678",
      addresses: {
        create: [
          {
            label: "Home",
            firstName: "Chioma",
            lastName: "Okafor",
            line1: "15 Admiralty Way",
            city: "Lagos",
            state: "Lagos",
            postcode: "100001",
            country: "NG",
            latitude: 6.4313,
            longitude: 3.4260,
            isDefault: true,
          },
        ],
      },
    },
  });

  // ── Products ────────────────────────────────────────────
  const products = await Promise.all([
    // GROCERIES
    db.product.create({
      data: {
        sku: "GRO-GAR-001",
        name: "Premium White Garri",
        slug: "premium-white-garri",
        description: "Fine-grain white garri, perfect for eba and drinking garri. Sourced from Ogun State cassava farms.",
        category: "GROCERIES",
        price: 2500,
        weightKg: 2.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["staple", "cassava", "nigerian"],
        images: ["/images/garri.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "GRO-RIC-001",
        name: "Ofada Rice (Local) 5kg",
        slug: "ofada-rice-5kg",
        description: "Authentic Ofada rice from Ogun State. Unpolished, aromatic, and perfect with Ofada stew.",
        category: "GROCERIES",
        price: 8500,
        weightKg: 5.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["staple", "rice", "nigerian", "organic"],
        images: ["/images/ofada-rice.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "GRO-BEA-001",
        name: "Honey Beans (Oloyin) 2kg",
        slug: "honey-beans-2kg",
        description: "Sweet Nigerian honey beans. Cook faster than regular beans. Great for porridge or moi-moi.",
        category: "GROCERIES",
        price: 3200,
        weightKg: 2.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["staple", "beans", "protein"],
        images: ["/images/honey-beans.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "GRO-YAM-001",
        name: "Fresh Pounded Yam Flour 1kg",
        slug: "pounded-yam-flour-1kg",
        description: "Instant pounded yam flour (Poundo Iyan). Just add hot water for smooth, stretchy pounded yam.",
        category: "GROCERIES",
        price: 1800,
        weightKg: 1.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["staple", "yam", "swallow"],
        images: ["/images/pounded-yam.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "GRO-EGU-001",
        name: "Ground Egusi (Melon Seeds) 500g",
        slug: "ground-egusi-500g",
        description: "Freshly ground egusi seeds for making delicious Egusi soup. Rich and nutty flavor.",
        category: "GROCERIES",
        price: 3500,
        weightKg: 0.5,
        isPerishable: false,
        isSubscribable: true,
        tags: ["soup", "seeds", "nigerian"],
        images: ["/images/egusi.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "GRO-PLO-001",
        name: "Devon King's Palm Oil 2L",
        slug: "palm-oil-2l",
        description: "Pure, natural palm oil. Essential for Nigerian soups and stews. No additives.",
        category: "GROCERIES",
        price: 4500,
        weightKg: 2.2,
        isPerishable: false,
        isFragile: true,
        tags: ["oil", "cooking", "essential"],
        images: ["/images/palm-oil.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "GRO-IND-001",
        name: "Indomie Instant Noodles (Box of 40)",
        slug: "indomie-box-40",
        description: "Nigeria's favorite instant noodles. Chicken flavor. Box of 40 packs.",
        category: "GROCERIES",
        price: 12000,
        weightKg: 3.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["noodles", "instant", "popular"],
        images: ["/images/indomie.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "GRO-FRZ-001",
        name: "Fresh Frozen Catfish 1kg",
        slug: "frozen-catfish-1kg",
        description: "Farm-raised catfish, cleaned and frozen. Perfect for pepper soup or grilling.",
        category: "GROCERIES",
        price: 5500,
        weightKg: 1.0,
        isPerishable: true,
        tags: ["fish", "protein", "frozen"],
        images: ["/images/catfish.jpg"],
      },
    }),

    // SPICES
    db.product.create({
      data: {
        sku: "SPI-SUY-001",
        name: "Yaji Suya Spice 200g",
        slug: "yaji-suya-spice-200g",
        description: "Authentic suya spice blend with ground peanuts, cayenne, and traditional spices. The real thing.",
        category: "SPICES",
        price: 1500,
        weightKg: 0.2,
        isPerishable: false,
        tags: ["spice", "suya", "bbq", "nigerian"],
        images: ["/images/suya-spice.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "SPI-OGI-001",
        name: "Ogiri Locust Beans 100g",
        slug: "ogiri-locust-beans-100g",
        description: "Traditional fermented locust bean seasoning. Adds deep umami flavor to soups.",
        category: "SPICES",
        price: 800,
        weightKg: 0.1,
        isPerishable: true,
        tags: ["seasoning", "fermented", "traditional"],
        images: ["/images/ogiri.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "SPI-CAM-001",
        name: "Cameroon Pepper (Ground) 150g",
        slug: "cameroon-pepper-150g",
        description: "Fiery Cameroon pepper, finely ground. Adds serious heat to any dish. Use sparingly!",
        category: "SPICES",
        price: 1200,
        weightKg: 0.15,
        isPerishable: false,
        tags: ["pepper", "hot", "spicy"],
        images: ["/images/cameroon-pepper.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "SPI-CRA-001",
        name: "Crayfish (Ground) 200g",
        slug: "ground-crayfish-200g",
        description: "Dried and ground crayfish. Essential for Egusi, Okra soup, and most Nigerian soups.",
        category: "SPICES",
        price: 2000,
        weightKg: 0.2,
        isPerishable: false,
        tags: ["seafood", "seasoning", "essential"],
        images: ["/images/crayfish.jpg"],
      },
    }),

    // DRINKS
    db.product.create({
      data: {
        sku: "DRK-MLT-001",
        name: "Maltina Malt Drink (6-Pack)",
        slug: "maltina-6-pack",
        description: "Classic Nigerian malt drink. Rich, sweet, and refreshing. Pack of 6 bottles.",
        category: "DRINKS",
        price: 3000,
        weightKg: 2.1,
        isPerishable: false,
        isFragile: true,
        tags: ["malt", "non-alcoholic", "drink"],
        images: ["/images/maltina.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "DRK-ZOB-001",
        name: "Zobo Drink Mix 500g",
        slug: "zobo-drink-mix-500g",
        description: "Dried hibiscus flowers for making traditional Zobo drink. Just boil, spice, and chill.",
        category: "DRINKS",
        price: 1500,
        weightKg: 0.5,
        isPerishable: false,
        isSubscribable: true,
        tags: ["traditional", "hibiscus", "zobo"],
        images: ["/images/zobo.jpg"],
      },
    }),

    // BEAUTY
    db.product.create({
      data: {
        sku: "BTY-SHE-001",
        name: "Raw Shea Butter 500g",
        slug: "raw-shea-butter-500g",
        description: "Unrefined raw shea butter from Northern Nigeria. For skin, hair, and body moisturizing.",
        category: "BEAUTY",
        price: 2500,
        weightKg: 0.5,
        isPerishable: false,
        tags: ["skincare", "natural", "moisturizer"],
        images: ["/images/shea-butter.jpg"],
      },
    }),
    db.product.create({
      data: {
        sku: "BTY-BLS-001",
        name: "African Black Soap (Dudu Osun) 150g",
        slug: "dudu-osun-black-soap",
        description: "Traditional Dudu Osun black soap. Handmade with shea butter, honey, and cam wood.",
        category: "BEAUTY",
        price: 800,
        weightKg: 0.15,
        isPerishable: false,
        tags: ["soap", "natural", "skincare"],
        images: ["/images/dudu-osun.jpg"],
      },
    }),
  ]);

  // ── Inventory Batches ───────────────────────────────────
  const now = new Date();
  const inventoryData = products.flatMap((product) => {
    const expiryDate = product.isPerishable
      ? new Date(now.getTime() + (Math.random() > 0.5 ? 20 : 60) * 24 * 60 * 60 * 1000)
      : null;

    return [
      {
        productId: product.id,
        warehouseId: lagosWarehouse.id,
        quantity: Math.floor(Math.random() * 100) + 20,
        batchNumber: `B${Date.now().toString(36).slice(-4).toUpperCase()}-LOS`,
        expiryDate,
      },
      {
        productId: product.id,
        warehouseId: abujaWarehouse.id,
        quantity: Math.floor(Math.random() * 50) + 5,
        batchNumber: `B${Date.now().toString(36).slice(-4).toUpperCase()}-ABJ`,
        expiryDate,
      },
      {
        productId: product.id,
        warehouseId: londonWarehouse.id,
        quantity: Math.floor(Math.random() * 30) + 2,
        batchNumber: `B${Date.now().toString(36).slice(-4).toUpperCase()}-LON`,
        expiryDate,
      },
    ];
  });

  await db.inventoryBatch.createMany({ data: inventoryData });

  // ── Recipes ─────────────────────────────────────────────
  const jollofRecipe = await db.recipe.create({
    data: {
      title: "Classic Jollof Rice",
      slug: "classic-jollof-rice",
      description: "The king of Nigerian dishes. Smoky, spicy, and absolutely delicious party-style Jollof rice.",
      prepTime: 30,
      cookTime: 45,
      servings: 6,
      image: "/images/recipes/jollof-rice.jpg",
      instructions: `## Ingredients\n- 3 cups Ofada rice\n- 1 can tomato paste\n- Fresh tomatoes, peppers, onions\n- Palm oil\n- Crayfish, seasoning\n\n## Steps\n1. Blend tomatoes, peppers, and onions\n2. Heat palm oil, fry onions until golden\n3. Add tomato paste, fry for 5 minutes\n4. Add blended tomato mix, cook for 20 minutes\n5. Add washed rice, stock, and seasoning\n6. Cover tightly and cook on low heat for 40 minutes\n7. Stir occasionally and let the bottom get slightly crispy (the famous "party jollof" bottom)`,
      items: {
        create: [
          { productId: products[1].id, quantity: 1, measurement: "5kg bag" }, // Ofada Rice
          { productId: products[5].id, quantity: 1, measurement: "2L bottle" }, // Palm Oil
          { productId: products[11].id, quantity: 1, measurement: "200g pack" }, // Crayfish
          { productId: products[10].id, quantity: 1, measurement: "150g pack" }, // Cameroon Pepper
        ],
      },
    },
  });

  await db.recipe.create({
    data: {
      title: "Egusi Soup with Spinach",
      slug: "egusi-soup-spinach",
      description: "Rich and hearty Egusi soup loaded with spinach and assorted meats. A Nigerian household staple.",
      prepTime: 20,
      cookTime: 40,
      servings: 4,
      image: "/images/recipes/egusi-soup.jpg",
      instructions: `## Steps\n1. Blend egusi seeds with a little water\n2. Heat palm oil, add onions\n3. Add egusi paste, stir-fry for 5 minutes\n4. Add stock, crayfish, and seasoning\n5. Simmer for 15 minutes\n6. Add chopped spinach and cook for 5 more minutes\n7. Serve with pounded yam or garri`,
      items: {
        create: [
          { productId: products[4].id, quantity: 1, measurement: "500g" }, // Egusi
          { productId: products[5].id, quantity: 1, measurement: "2 tablespoons" }, // Palm Oil
          { productId: products[11].id, quantity: 1, measurement: "2 tablespoons" }, // Crayfish
          { productId: products[0].id, quantity: 1, measurement: "2kg bag" }, // Garri (to serve with)
        ],
      },
    },
  });

  // ── Shipping Rules ──────────────────────────────────────
  await db.shippingRule.createMany({
    data: [
      { name: "Standard (Light)", method: "STANDARD", minWeightKg: 0, maxWeightKg: 5, baseCost: 1500, perKgCost: 0, estimatedDays: 5 },
      { name: "Standard (Medium)", method: "STANDARD", minWeightKg: 5, maxWeightKg: 15, baseCost: 1500, perKgCost: 200, estimatedDays: 5 },
      { name: "Standard (Heavy)", method: "STANDARD", minWeightKg: 15, maxWeightKg: 50, baseCost: 1500, perKgCost: 350, estimatedDays: 7 },
      { name: "Express (Light)", method: "EXPRESS", minWeightKg: 0, maxWeightKg: 10, baseCost: 3500, perKgCost: 0, estimatedDays: 2 },
      { name: "Express (Heavy)", method: "EXPRESS", minWeightKg: 10, maxWeightKg: 30, baseCost: 3500, perKgCost: 300, estimatedDays: 3 },
      { name: "Local Van", method: "LOCAL_VAN", minWeightKg: 0, maxWeightKg: 100, baseCost: 2000, perKgCost: 100, estimatedDays: 1 },
      { name: "Local Fresh Delivery", method: "LOCAL_FRESH", minWeightKg: 0, maxWeightKg: 20, baseCost: 1000, perKgCost: 0, estimatedDays: 0 },
      { name: "DHL Premium", method: "DHL", minWeightKg: 0, maxWeightKg: 30, baseCost: 8000, perKgCost: 500, estimatedDays: 3 },
    ],
  });

  // ── Flash Sale (near-expiry catfish) ────────────────────
  const catfish = products.find((p) => p.sku === "GRO-FRZ-001")!;
  await db.flashSale.create({
    data: {
      productId: catfish.id,
      discountPercent: 25,
      reason: "Near expiry — must sell!",
      startsAt: now,
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  console.log("✅ Seed complete!");
  console.log("   Admin: admin@naijapantry.com / admin123456");
  console.log("   Customer: customer@example.com / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
