import { MutationCtx, mutation } from "./_generated/server";

/**
 * npm run seed equivalent — idempotent, upsert-by-slug (no uncontrolled
 * duplicates). Creates demo admin/user, the Feedants Classical Dance
 * competition, judge, previous winners, rewards, dates, tabs content.
 *
 * Also safe to re-run: competitions are matched by slug; demo users by email.
 */
export const seedAll = mutation({
  args: {},
  handler: async (ctx: MutationCtx): Promise<unknown> => {
    // ─── Demo accounts (local development only) ───────────────────────────────
    // Passwords in the assignment: Demo@12345 / Admin@12345 — Convex Auth
    // manages credential hashing; demo users are provisioned via the app's
    // signup flow (email OTP) and granted roles here if they exist.
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
    // All dates/times are database-driven; epoch values are demo data only.
    const DAY = 24 * 60 * 60 * 1000;

    // IST = UTC+5:30 → reference IST times converted to UTC epochs.
    const submissionStart = Date.parse("2026-08-05T22:30:00Z"); // 6 Aug 26 04:00 AM IST
    const submissionEnd = Date.parse("2026-08-30T18:25:00Z"); // 30 Aug 26 11:55 PM IST
    const registrationEnd = Date.parse("2026-08-10T18:20:00Z"); // 10 Aug 26 11:50 PM IST
    const resultDate = Date.parse("2026-09-01T18:20:00Z"); // 1 Sept 26 11:50 PM IST
    const registrationStart = submissionStart - 45 * DAY;

    const comp = {
      slug: "feedants-classical-dance",
      title: "Feedants Classical Dance",
      titleLocalized: { ENG: "Feedants Classical Dance", HINDI: "फ़ीडैंट्स शास्त्रीय नृत्य" },
      category: "Dance",
      tags: ["Multi-Win"],
      prizePool: 1500,
      entryFee: 99,
      maxParticipants: 20,
      currentParticipants: 1,
      registrationStart,
      registrationEnd,
      submissionStart,
      submissionEnd,
      resultDate,
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
      await ctx.db.patch(existingComp._id, comp);
      console.log("[seed] competition updated:", comp.slug);
      return { competitionId: existingComp._id, seeded: "updated" };
    }
    const competitionId = await ctx.db.insert("competitions", comp);
    console.log("[seed] competition created:", comp.slug);
    return { competitionId, seeded: "created" };
  },
});
