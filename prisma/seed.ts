import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Authentifactor multi-tenant database...");

  // ── Tenants ────────────────────────────────────────────────

  const tom = await db.tenant.create({
    data: {
      name: "Taste of Motherland",
      slug: "taste-of-motherland",
      customDomain: "tmfoods.co.uk",
      primaryColor: "#064E3B",
      accentColor: "#F59E0B",
      tagline: "Authentic African Foods Delivered to Your Door",
      currency: "GBP",
      localHubLat: 51.5074,
      localHubLng: -0.1278,
      localRadiusKm: 25,
      freeShippingMinimum: 35,
      defaultMetaTitle: "Taste of Motherland — Authentic African Foods",
      defaultMetaDescription:
        "Shop 500+ authentic African groceries, spices, drinks and beauty products delivered across the UK.",
      heroBannerTitle: "The taste of home, delivered fresh.",
      heroBannerSubtitle: "From Garri to Egusi, Palm Oil to Suya Spice — authentic African foods at your doorstep",
      mobileAppEnabled: true,
      mobileAppBrandName: "Taste of Motherland",
    },
  });

  const toksmimi = await db.tenant.create({
    data: {
      name: "Toks Mimi Foods",
      slug: "toks-mimi",
      primaryColor: "#7C3AED",
      accentColor: "#EC4899",
      tagline: "Premium African Cuisine, Delivered to Your Door",
      currency: "GBP",
      localHubLat: 51.5074,
      localHubLng: -0.1278,
      localRadiusKm: 25,
      defaultMetaTitle: "Toks Mimi Foods — Premium African Cuisine in the UK",
      defaultMetaDescription:
        "Authentic West African foods delivered across the UK. Fresh ingredients for your favourite dishes.",
      heroBannerTitle: "Premium African Cuisine",
      heroBannerSubtitle: "Authentic ingredients delivered across the UK",
      mobileAppEnabled: true,
      mobileAppBrandName: "Taste of Motherland",
    },
  });

  // ── Users ──────────────────────────────────────────────────

  const adminHash = await bcrypt.hash("admin123456", 12);
  const customerHash = await bcrypt.hash("customer123", 12);

  const superAdmin = await db.user.create({
    data: {
      email: "admin@authentifactor.com",
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "Authentifactor",
      isSuperAdmin: true,
    },
  });

  // Super admin on both tenants
  await db.tenantUser.createMany({
    data: [
      { userId: superAdmin.id, tenantId: tom.id, role: "ADMIN" as const },
      { userId: superAdmin.id, tenantId: toksmimi.id, role: "ADMIN" },
    ],
  });

  const chioma = await db.user.create({
    data: {
      email: "chioma@example.com",
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
            longitude: 3.426,
            isDefault: true,
          },
        ],
      },
    },
  });

  await db.tenantUser.create({
    data: { userId: chioma.id, tenantId: tom.id, role: "CUSTOMER" },
  });

  const toks = await db.user.create({
    data: {
      email: "toks@example.com",
      passwordHash: customerHash,
      firstName: "Toks",
      lastName: "Adeyemi",
      phone: "+447700900123",
      addresses: {
        create: [
          {
            label: "Home",
            firstName: "Toks",
            lastName: "Adeyemi",
            line1: "42 Brixton Road",
            city: "London",
            state: "Greater London",
            postcode: "SW9 8EF",
            country: "GB",
            latitude: 51.4613,
            longitude: -0.1156,
            isDefault: true,
          },
        ],
      },
    },
  });

  await db.tenantUser.create({
    data: { userId: toks.id, tenantId: toksmimi.id, role: "CUSTOMER" },
  });

  // ── Taste of Motherland Warehouses ─────────────────────────────────

  const lagosWarehouse = await db.warehouse.create({
    data: {
      tenantId: tom.id,
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
      tenantId: tom.id,
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

  const londonWarehouseNP = await db.warehouse.create({
    data: {
      tenantId: tom.id,
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

  // ── Taste of Motherland Products (16) ──────────────────────────────

  const npProducts = await Promise.all([
    // 0: Garri
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "GRO-GAR-001",
        name: "Premium White Garri",
        slug: "premium-white-garri",
        description:
          "Fine-grain white garri, perfect for eba and drinking garri. Sourced from Ogun State cassava farms.",
        category: "GROCERIES",
        price: 5.99,
        weightKg: 2.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["staple", "cassava", "nigerian"],
        images: ["/images/garri.svg"],
      },
    }),
    // 1: Ofada Rice
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "GRO-RIC-001",
        name: "Ofada Rice (Local) 5kg",
        slug: "ofada-rice-5kg",
        description:
          "Authentic Ofada rice from Ogun State. Unpolished, aromatic, and perfect with Ofada stew.",
        category: "GROCERIES",
        price: 12.99,
        weightKg: 5.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["staple", "rice", "nigerian", "organic"],
        images: ["/images/ofada-rice.svg"],
      },
    }),
    // 2: Honey Beans
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "GRO-BEA-001",
        name: "Honey Beans (Oloyin) 2kg",
        slug: "honey-beans-2kg",
        description:
          "Sweet Nigerian honey beans. Cook faster than regular beans. Great for porridge or moi-moi.",
        category: "GROCERIES",
        price: 7.49,
        weightKg: 2.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["staple", "beans", "protein"],
        images: ["/images/honey-beans.svg"],
      },
    }),
    // 3: Pounded Yam
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "GRO-YAM-001",
        name: "Fresh Pounded Yam Flour 1kg",
        slug: "pounded-yam-flour-1kg",
        description:
          "Instant pounded yam flour (Poundo Iyan). Just add hot water for smooth, stretchy pounded yam.",
        category: "GROCERIES",
        price: 4.49,
        weightKg: 1.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["staple", "yam", "swallow"],
        images: ["/images/pounded-yam.svg"],
      },
    }),
    // 4: Egusi
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "GRO-EGU-001",
        name: "Ground Egusi (Melon Seeds) 500g",
        slug: "ground-egusi-500g",
        description:
          "Freshly ground egusi seeds for making delicious Egusi soup. Rich and nutty flavor.",
        category: "GROCERIES",
        price: 8.99,
        weightKg: 0.5,
        isPerishable: false,
        isSubscribable: true,
        tags: ["soup", "seeds", "nigerian"],
        images: ["/images/egusi.svg"],
      },
    }),
    // 5: Palm Oil
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "GRO-PLO-001",
        name: "Devon King's Palm Oil 2L",
        slug: "palm-oil-2l",
        description:
          "Pure, natural palm oil. Essential for Nigerian soups and stews. No additives.",
        category: "GROCERIES",
        price: 9.99,
        weightKg: 2.2,
        isPerishable: false,
        isFragile: true,
        tags: ["oil", "cooking", "essential"],
        images: ["/images/palm-oil.svg"],
      },
    }),
    // 6: Indomie
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "GRO-IND-001",
        name: "Indomie Instant Noodles (Box of 40)",
        slug: "indomie-box-40",
        description:
          "Nigeria's favorite instant noodles. Chicken flavor. Box of 40 packs.",
        category: "GROCERIES",
        price: 24.99,
        weightKg: 3.0,
        isPerishable: false,
        isSubscribable: true,
        tags: ["noodles", "instant", "popular"],
        images: ["/images/indomie.svg"],
      },
    }),
    // 7: Catfish
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "GRO-FRZ-001",
        name: "Fresh Frozen Catfish 1kg",
        slug: "frozen-catfish-1kg",
        description:
          "Farm-raised catfish, cleaned and frozen. Perfect for pepper soup or grilling.",
        category: "GROCERIES",
        price: 11.99,
        weightKg: 1.0,
        isPerishable: true,
        tags: ["fish", "protein", "frozen"],
        images: ["/images/catfish.svg"],
      },
    }),
    // 8: Suya Spice
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "SPI-SUY-001",
        name: "Yaji Suya Spice 200g",
        slug: "yaji-suya-spice-200g",
        description:
          "Authentic suya spice blend with ground peanuts, cayenne, and traditional spices. The real thing.",
        category: "SPICES",
        price: 3.99,
        weightKg: 0.2,
        isPerishable: false,
        tags: ["spice", "suya", "bbq", "nigerian"],
        images: ["/images/suya-spice.svg"],
      },
    }),
    // 9: Ogiri
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "SPI-OGI-001",
        name: "Ogiri Locust Beans 100g",
        slug: "ogiri-locust-beans-100g",
        description:
          "Traditional fermented locust bean seasoning. Adds deep umami flavor to soups.",
        category: "SPICES",
        price: 2.49,
        weightKg: 0.1,
        isPerishable: true,
        tags: ["seasoning", "fermented", "traditional"],
        images: ["/images/ogiri.svg"],
      },
    }),
    // 10: Cameroon Pepper
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "SPI-CAM-001",
        name: "Cameroon Pepper (Ground) 150g",
        slug: "cameroon-pepper-150g",
        description:
          "Fiery Cameroon pepper, finely ground. Adds serious heat to any dish. Use sparingly!",
        category: "SPICES",
        price: 3.49,
        weightKg: 0.15,
        isPerishable: false,
        tags: ["pepper", "hot", "spicy"],
        images: ["/images/cameroon-pepper.svg"],
      },
    }),
    // 11: Crayfish
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "SPI-CRA-001",
        name: "Crayfish (Ground) 200g",
        slug: "ground-crayfish-200g",
        description:
          "Dried and ground crayfish. Essential for Egusi, Okra soup, and most Nigerian soups.",
        category: "SPICES",
        price: 4.99,
        weightKg: 0.2,
        isPerishable: false,
        tags: ["seafood", "seasoning", "essential"],
        images: ["/images/crayfish.svg"],
      },
    }),
    // 12: Maltina
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "DRK-MLT-001",
        name: "Maltina Malt Drink (6-Pack)",
        slug: "maltina-6-pack",
        description:
          "Classic Nigerian malt drink. Rich, sweet, and refreshing. Pack of 6 bottles.",
        category: "DRINKS",
        price: 6.99,
        weightKg: 2.1,
        isPerishable: false,
        isFragile: true,
        tags: ["malt", "non-alcoholic", "drink"],
        images: ["/images/maltina.svg"],
      },
    }),
    // 13: Zobo
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "DRK-ZOB-001",
        name: "Zobo Drink Mix 500g",
        slug: "zobo-drink-mix-500g",
        description:
          "Dried hibiscus flowers for making traditional Zobo drink. Just boil, spice, and chill.",
        category: "DRINKS",
        price: 3.99,
        weightKg: 0.5,
        isPerishable: false,
        isSubscribable: true,
        tags: ["traditional", "hibiscus", "zobo"],
        images: ["/images/zobo.svg"],
      },
    }),
    // 14: Shea Butter
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "BTY-SHE-001",
        name: "Raw Shea Butter 500g",
        slug: "raw-shea-butter-500g",
        description:
          "Unrefined raw shea butter from Northern Nigeria. For skin, hair, and body moisturizing.",
        category: "BEAUTY",
        price: 6.49,
        weightKg: 0.5,
        isPerishable: false,
        tags: ["skincare", "natural", "moisturizer"],
        images: ["/images/shea-butter.svg"],
      },
    }),
    // 15: Dudu Osun
    db.product.create({
      data: {
        tenantId: tom.id,
        sku: "BTY-BLS-001",
        name: "African Black Soap (Dudu Osun) 150g",
        slug: "dudu-osun-black-soap",
        description:
          "Traditional Dudu Osun black soap. Handmade with shea butter, honey, and cam wood.",
        category: "BEAUTY",
        price: 2.49,
        weightKg: 0.15,
        isPerishable: false,
        tags: ["soap", "natural", "skincare"],
        images: ["/images/dudu-osun.svg"],
      },
    }),
  ]);

  // ── Taste of Motherland Inventory Batches ──────────────────────────

  const now = new Date();
  const npInventoryData = npProducts.flatMap((product) => {
    const expiryDate = product.isPerishable
      ? new Date(
          now.getTime() +
            (Math.random() > 0.5 ? 20 : 60) * 24 * 60 * 60 * 1000
        )
      : null;

    return [
      {
        tenantId: tom.id,
        productId: product.id,
        warehouseId: lagosWarehouse.id,
        quantity: Math.floor(Math.random() * 100) + 20,
        batchNumber: `B${Date.now().toString(36).slice(-4).toUpperCase()}-LOS`,
        expiryDate,
      },
      {
        tenantId: tom.id,
        productId: product.id,
        warehouseId: abujaWarehouse.id,
        quantity: Math.floor(Math.random() * 50) + 5,
        batchNumber: `B${Date.now().toString(36).slice(-4).toUpperCase()}-ABJ`,
        expiryDate,
      },
      {
        tenantId: tom.id,
        productId: product.id,
        warehouseId: londonWarehouseNP.id,
        quantity: Math.floor(Math.random() * 30) + 2,
        batchNumber: `B${Date.now().toString(36).slice(-4).toUpperCase()}-LON`,
        expiryDate,
      },
    ];
  });

  await db.inventoryBatch.createMany({ data: npInventoryData });

  // ── Taste of Motherland Recipes ────────────────────────────────────

  await db.recipe.create({
    data: {
      tenantId: tom.id,
      title: "Classic Jollof Rice",
      slug: "classic-jollof-rice",
      description:
        "The king of Nigerian dishes. Smoky, spicy, and absolutely delicious party-style Jollof rice.",
      prepTime: 30,
      cookTime: 45,
      servings: 6,
      image: "/images/recipes/jollof-rice.svg",
      instructions: `## Ingredients\n- 3 cups Ofada rice\n- 1 can tomato paste\n- Fresh tomatoes, peppers, onions\n- Palm oil\n- Crayfish, seasoning\n\n## Steps\n1. Blend tomatoes, peppers, and onions\n2. Heat palm oil, fry onions until golden\n3. Add tomato paste, fry for 5 minutes\n4. Add blended tomato mix, cook for 20 minutes\n5. Add washed rice, stock, and seasoning\n6. Cover tightly and cook on low heat for 40 minutes\n7. Stir occasionally and let the bottom get slightly crispy (the famous "party jollof" bottom)`,
      items: {
        create: [
          {
            productId: npProducts[1].id,
            quantity: 1,
            measurement: "5kg bag",
          },
          {
            productId: npProducts[5].id,
            quantity: 1,
            measurement: "2L bottle",
          },
          {
            productId: npProducts[11].id,
            quantity: 1,
            measurement: "200g pack",
          },
          {
            productId: npProducts[10].id,
            quantity: 1,
            measurement: "150g pack",
          },
        ],
      },
    },
  });

  await db.recipe.create({
    data: {
      tenantId: tom.id,
      title: "Egusi Soup with Spinach",
      slug: "egusi-soup-spinach",
      description:
        "Rich and hearty Egusi soup loaded with spinach and assorted meats. A Nigerian household staple.",
      prepTime: 20,
      cookTime: 40,
      servings: 4,
      image: "/images/recipes/egusi-soup.svg",
      instructions: `## Steps\n1. Blend egusi seeds with a little water\n2. Heat palm oil, add onions\n3. Add egusi paste, stir-fry for 5 minutes\n4. Add stock, crayfish, and seasoning\n5. Simmer for 15 minutes\n6. Add chopped spinach and cook for 5 more minutes\n7. Serve with pounded yam or garri`,
      items: {
        create: [
          {
            productId: npProducts[4].id,
            quantity: 1,
            measurement: "500g",
          },
          {
            productId: npProducts[5].id,
            quantity: 1,
            measurement: "2 tablespoons",
          },
          {
            productId: npProducts[11].id,
            quantity: 1,
            measurement: "2 tablespoons",
          },
          {
            productId: npProducts[0].id,
            quantity: 1,
            measurement: "2kg bag",
          },
        ],
      },
    },
  });

  // ── Taste of Motherland Shipping Rules (GBP) ───────────────────────

  await db.shippingRule.createMany({
    data: [
      {
        tenantId: tom.id,
        name: "Standard UK (Light)",
        method: "STANDARD",
        minWeightKg: 0,
        maxWeightKg: 5,
        baseCost: 3.99,
        perKgCost: 0,
        estimatedDays: 5,
      },
      {
        tenantId: tom.id,
        name: "Standard UK (Medium)",
        method: "STANDARD",
        minWeightKg: 5,
        maxWeightKg: 15,
        baseCost: 5.99,
        perKgCost: 0.5,
        estimatedDays: 5,
      },
      {
        tenantId: tom.id,
        name: "Standard UK (Heavy)",
        method: "STANDARD",
        minWeightKg: 15,
        maxWeightKg: 50,
        baseCost: 7.99,
        perKgCost: 0.75,
        estimatedDays: 7,
      },
      {
        tenantId: tom.id,
        name: "Express UK",
        method: "EXPRESS",
        minWeightKg: 0,
        maxWeightKg: 20,
        baseCost: 7.99,
        perKgCost: 0,
        estimatedDays: 2,
      },
      {
        tenantId: tom.id,
        name: "Local Van Delivery",
        method: "LOCAL_VAN",
        minWeightKg: 0,
        maxWeightKg: 100,
        baseCost: 4.99,
        perKgCost: 0.25,
        estimatedDays: 1,
      },
      {
        tenantId: tom.id,
        name: "Local Fresh Delivery",
        method: "LOCAL_FRESH",
        minWeightKg: 0,
        maxWeightKg: 20,
        baseCost: 2.99,
        perKgCost: 0,
        estimatedDays: 0,
        perKgCost: 500,
        estimatedDays: 3,
      },
    ],
  });

  // ── Taste of Motherland Flash Sale ─────────────────────────────────

  const catfish = npProducts.find((p) => p.sku === "GRO-FRZ-001")!;
  await db.flashSale.create({
    data: {
      tenantId: tom.id,
      productId: catfish.id,
      discountPercent: 25,
      reason: "Near expiry — must sell!",
      startsAt: now,
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  // ── Toks Mimi Warehouse ────────────────────────────────────

  const tmWarehouse = await db.warehouse.create({
    data: {
      tenantId: toksmimi.id,
      name: "London Depot",
      code: "LON-TM",
      address: "Unit 12, Tottenham Industrial Park",
      city: "London",
      state: "Greater London",
      country: "GB",
      latitude: 51.5942,
      longitude: -0.0722,
    },
  });

  // ── Toks Mimi Products (5) ─────────────────────────────────
  // Prices in GBP pence

  const tmProducts = await Promise.all([
    // 0: Jollof Rice Seasoning Mix
    db.product.create({
      data: {
        tenantId: toksmimi.id,
        sku: "TM-SPI-001",
        name: "Jollof Rice Seasoning Mix 250g",
        slug: "jollof-rice-seasoning-mix-250g",
        description:
          "Our signature jollof seasoning blend. Just add to rice with tomato paste for perfect jollof every time.",
        category: "SPICES",
        price: 6.99,
        weightKg: 0.25,
        isPerishable: false,
        tags: ["jollof", "seasoning", "spice"],
        images: ["/images/tm/jollof-seasoning.svg"],
      },
    }),
    // 1: Premium Egusi Seeds
    db.product.create({
      data: {
        tenantId: toksmimi.id,
        sku: "TM-GRO-001",
        name: "Premium Egusi Seeds 1kg",
        slug: "premium-egusi-seeds-1kg",
        description:
          "Hand-selected melon seeds for rich, authentic Egusi soup. Ground fresh on demand.",
        category: "GROCERIES",
        price: 12.00,
        weightKg: 1.0,
        isPerishable: false,
        tags: ["egusi", "soup", "seeds"],
        images: ["/images/tm/egusi-seeds.svg"],
      },
    }),
    // 2: Plantain Chips (Spicy)
    db.product.create({
      data: {
        tenantId: toksmimi.id,
        sku: "TM-GRO-002",
        name: "Plantain Chips (Spicy) 200g",
        slug: "plantain-chips-spicy-200g",
        description:
          "Crispy, spicy plantain chips made from ripe plantains. A perfect snack or side.",
        category: "GROCERIES",
        price: 4.50,
        weightKg: 0.2,
        isPerishable: false,
        tags: ["snack", "plantain", "spicy"],
        images: ["/images/tm/plantain-chips.svg"],
      },
    }),
    // 3: Chin Chin Snack Pack
    db.product.create({
      data: {
        tenantId: toksmimi.id,
        sku: "TM-GRO-003",
        name: "Chin Chin Snack Pack 300g",
        slug: "chin-chin-snack-pack-300g",
        description:
          "Crunchy, sweet chin chin made with love. The perfect Nigerian snack for any occasion.",
        category: "GROCERIES",
        price: 5.00,
        weightKg: 0.3,
        isPerishable: false,
        tags: ["snack", "chin-chin", "sweet"],
        images: ["/images/tm/chin-chin.svg"],
      },
    }),
    // 4: African Black Soap Bar
    db.product.create({
      data: {
        tenantId: toksmimi.id,
        sku: "TM-BTY-001",
        name: "African Black Soap Bar 200g",
        slug: "african-black-soap-bar-200g",
        description:
          "Handmade African black soap with shea butter and cocoa pod ash. Gentle on all skin types.",
        category: "BEAUTY",
        price: 6.00,
        weightKg: 0.2,
        isPerishable: false,
        tags: ["soap", "skincare", "natural"],
        images: ["/images/tm/black-soap.svg"],
      },
    }),
  ]);

  // ── Toks Mimi Inventory ────────────────────────────────────

  await db.inventoryBatch.createMany({
    data: tmProducts.map((product) => ({
      tenantId: toksmimi.id,
      productId: product.id,
      warehouseId: tmWarehouse.id,
      quantity: Math.floor(Math.random() * 80) + 15,
      batchNumber: `TM-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    })),
  });

  // ── Toks Mimi Shipping Rules ───────────────────────────────
  // Prices in GBP pence

  await db.shippingRule.createMany({
    data: [
      {
        tenantId: toksmimi.id,
        name: "Standard UK",
        method: "STANDARD",
        minWeightKg: 0,
        maxWeightKg: 30,
        baseCost: 399,
        perKgCost: 0,
        estimatedDays: 5,
      },
      {
        tenantId: toksmimi.id,
        name: "Express UK",
        method: "EXPRESS",
        minWeightKg: 0,
        maxWeightKg: 30,
        baseCost: 799,
        perKgCost: 0,
        estimatedDays: 2,
      },
      {
        tenantId: toksmimi.id,
        name: "Free over £35",
        method: "STANDARD",
        minWeightKg: 0,
        maxWeightKg: 30,
        baseCost: 0,
        perKgCost: 0,
        estimatedDays: 5,
      },
    ],
  });

  // ── SEO Settings ───────────────────────────────────────────

  await db.seoSettings.createMany({
    data: [
      {
        tenantId: tom.id,
        pageType: "home",
        pageSlug: null,
        metaTitle: "Taste of Motherland — Authentic African Foods Delivered Fresh",
        metaDescription:
          "Shop 500+ authentic African groceries, spices, drinks and beauty products delivered across the UK.",
        canonicalUrl: "https://tmfoods.co.uk",
        jsonLd: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: "Taste of Motherland",
          description:
            "Authentic African foods delivered fresh to your doorstep.",
          url: "https://tmfoods.co.uk",
        }),
      },
      {
        tenantId: toksmimi.id,
        pageType: "home",
        pageSlug: null,
        metaTitle:
          "Toks Mimi Foods — Premium African Cuisine Delivered in the UK",
        metaDescription:
          "Authentic West African foods delivered across the UK. Fresh ingredients for your favourite dishes.",
        canonicalUrl: "https://tmfoods.co.uk",
        jsonLd: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: "Toks Mimi Foods",
          description:
            "Premium African cuisine ingredients delivered across the UK.",
          url: "https://tmfoods.co.uk",
        }),
      },
    ],
  });

  // ── Onboarding Progress ────────────────────────────────────

  await db.onboardingProgress.createMany({
    data: [
      {
        tenantId: tom.id,
        branding: true,
        domain: true,
        warehouse: true,
        inventory: true,
        shipping: true,
        seo: true,
        adminUsers: true,
        completedAt: now,
      },
      {
        tenantId: toksmimi.id,
        branding: true,
        domain: true,
        warehouse: true,
        inventory: true,
        shipping: true,
        seo: true,
        adminUsers: true,
        completedAt: now,
      },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("   Tenants: Taste of Motherland, Toks Mimi Foods");
  console.log("   Super Admin: admin@authentifactor.com / admin123456");
  console.log("   TOM Customer: chioma@example.com / customer123");
  console.log("   TM Customer: toks@example.com / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
