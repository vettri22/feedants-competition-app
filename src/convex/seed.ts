import { MutationCtx, mutation, query } from "./_generated/server";
import { ok, fail } from "./lib/api";

/**
 * Demo data seeder — idempotent, upsert-by-slug (no uncontrolled duplicates).
 * Creates the Feedants Classical Dance competition, judge, previous winners,
 * rewards, dates, tabs content, and demo user roles.
 *
 * DATES ARE RELATIVE TO SEED TIME so the demo is always live and exercises
 * the same overlapping-window structure as the assignment reference:
 *   registration: [now-45d … now+8d]   → REGISTRATION_OPEN, live countdown
 *   submission:   [now-2d  … now+25d]  → overlaps registration (reference
 *                                        behavior); upload CTA available to
 *                                        paid registrants
 *   results:       now+30d             → result date in the future
 *
 * `demoStatus` tells the client when to (re)seed: never seeded, or the demo
 * competition has fully concluded (result date passed) → refresh its dates.
 */
export const DEMO_SLUG = "feedants-classical-dance";

const DAY = 24 * 60 * 60 * 1000;

export const demoStatus = query({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    try {
      const comp = await ctx.db
        .query("competitions")
        .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
        .first();
      if (!comp) return ok({ seed: true });
      // Only refresh when the demo has fully concluded — never while live.
      return ok({ seed: comp.resultDate <= Date.now() });
    } catch (err) {
      return fail(err);
    }
  },
});

function demoDates(now: number) {
  return {
    registrationStart: now - 45 * DAY,
    submissionStart: now - 2 * DAY,
    registrationEnd: now + 8 * DAY,
    submissionEnd: now + 25 * DAY,
    resultDate: now + 30 * DAY,
  };
}

export const seedAll = mutation({
  args: {},
  handler: async (ctx: MutationCtx): Promise<unknown> => {
    // ─── Demo accounts (local development only) ───────────────────────────────
    // Convex Auth manages credential hashing; demo users are provisioned via
    // the app's signup flow (email OTP) and granted roles here if they exist.
    const adminEmail = "admin@feedants.local";
    const demoEmail = "demo@feedants.local";
    for (const [email, role, name] of [
      [adminEmail, "admin", "Feedants Admin"],
      [demoEmail, "user", "Demo Participant"],
    ] as const) {
      const existing = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();
      if (existing) {
        if (existing.role !== role) {
          await ctx.db.patch(existing._id, { role });
        }
        continue;
      }
      await ctx.db.insert("users", { email, role, name });
    }

    // ─── Feedants Classical Dance (reference data) ────────────────────────────
    // All dates/times are database-driven and relative to seeding time.
    const comp = {
      slug: DEMO_SLUG,
      title: "Feedants Classical Dance",
      titleLocalized: { ENG: "Feedants Classical Dance", HINDI: "फ़ीडैंट्स शास्त्रीय नृत्य" },
      category: "Dance",
      tags: ["Multi-Win"],
      prizePool: 1500,
      entryFee: 99,
      maxParticipants: 20,
      currentParticipants: 1,
      ...demoDates(Date.now()),
      judge: {
        name: "Manju Dubey",
        designation: "Professional Kathak Dancer",
        experience: "12+ Years of Experience",
      },
      introVideoUrl: undefined,
      description: {
        ENG: "This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.",
        HINDI: "यह सभी आयु वर्गों के लिए खुली ऑनलाइन शास्त्रीय नृत्य प्रतियोगिता है। कहीं से भी भाग लें और अपनी प्रतिभा दिखाएँ। पारंपरिक नृत्य के माध्यम से अपना जुनून व्यक्त करें।",
      },
      judgingParameters: [
        { name: { ENG: "Technique & Precision", HINDI: "तकनीक और सटीकता" }, weight: 30 },
        { name: { ENG: "Expression & Abhinaya", HINDI: "भाव अभिनय" }, weight: 25 },
        { name: { ENG: "Rhythm & Taal", HINDI: "ताल और लय" }, weight: 20 },
        { name: { ENG: "Costume & Presentation", HINDI: "वेशभूषा और प्रस्तुति" }, weight: 15 },
        { name: { ENG: "Overall Impression", HINDI: "समग्र प्रभाव" }, weight: 10 },
      ],
      rules: [
        { ENG: "One video submission per participant.", HINDI: "प्रति प्रतिभागी एक वीडियो प्रस्तुत करें।" },
        { ENG: "Performance must be a solo classical piece of 3–6 minutes.", HINDI: "प्रदर्शन 3–6 मिनट की एकल शास्त्रीय प्रस्तुति होनी चाहिए।" },
        { ENG: "Submit before the deadline; late entries are not judged.", HINDI: "समय-सीमा से पहले जमा करें; देर से की गई प्रविष्टियाँ नहीं देखी जाएँगी।" },
        { ENG: "Plagiarism or pre-recorded TV footage leads to disqualification.", HINDI: "साहित्यिक चोरी या टीवी फुटेज पर अपात्रता।" },
      ],
      eligibility: [
        { ENG: "Open to all age groups across India.", HINDI: "पूरे भारत के सभी आयु वर्गों के लिए खुला।" },
        { ENG: "Only paid participants are eligible for judging.", HINDI: "केवल भुगतान करने वाले प्रतिभागी ही निर्णय के पात्र हैं।" },
        { ENG: "Participants must have a valid UPI/bank account for prize disbursement.", HINDI: "पुरस्कार राशि के लिए वैध UPI/बैंक खाता आवश्यक।" },
      ],
      rewards: [
        { position: 1, label: "1st Winner", amount: 550 },
        { position: 2, label: "2nd Winner", amount: 300 },
        { position: 3, label: "3rd Winner", amount: 240 },
        { position: 4, label: "4th Winner", amount: 200 },
        { position: 5, label: "5th Winner", amount: 130 },
        { position: 6, label: "6th Winner", amount: 80 },
      ],
      disclaimer: {
        ENG: "Only contributions from paid participants will be considered for judging.",
        HINDI: "केवल भुगतान करने वाले प्रतिभागियों के योगदान पर ही निर्णय के लिए विचार किया जाएगा।",
      },
      refundPolicy: {
        ENG: "Full refund if the competition is cancelled or you cancel within 48 hours of payment.",
        HINDI: "प्रतियोगिता रद्द होने या भुगतान के 48 घंटों के भीतर रद्द करने पर पूर्ण धनवापसी।",
      },
      paymentProvider: "simulated",
      certificateEnabled: true,
      multiWin: true,
      previousWinners: [
        { name: "Riya Shah", rank: 1, rankLabel: "1st Winner" },
        { name: "Aarav Mehta", rank: 1, rankLabel: "1st Winner" },
        { name: "Neha Verma", rank: 2, rankLabel: "2nd Winner" },
        { name: "Ishita Chopra", rank: 3, rankLabel: "3rd Winner" },
      ],
      referralReward: 10,
      referralEnabled: true,
      languageSupport: ["ENG", "HINDI"] as ("ENG" | "HINDI")[],
    };

    const existingComp = await ctx.db
      .query("competitions")
      .withIndex("by_slug", (q) => q.eq("slug", comp.slug))
      .first();

    if (existingComp) {
      // Refresh lifecycle dates only — never reset live participant counts,
      // registrations, or payment state on a demo-date refresh.
      await ctx.db.patch(existingComp._id, demoDates(Date.now()));
      console.log("[seed] demo competition dates refreshed:", comp.slug);
      return { competitionId: existingComp._id, seeded: "dates-refreshed" };
    }

    const competitionId = await ctx.db.insert("competitions", comp);
    console.log("[seed] demo competition created:", comp.slug);
    return { competitionId, seeded: "created" };
  },
});
