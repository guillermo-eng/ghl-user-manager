const GHL_BASE = "https://services.leadconnectorhq.com";
const VERSION = "2021-07-28";

// Auto-generate a secure random password
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pass = "";
  for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

// Andres Sanchez's scopes — applied to ALL new non-admin users
const STANDARD_USER_SCOPES = [
  "adPublishing.readonly",
  "adPublishing.write",
  "blogs.write",
  "calendars.readonly",
  "calendars.write",
  "calendars/events.write",
  "calendars/groups.write",
  "certificates.readonly",
  "certificates.write",
  "communities.write",
  "contacts.write",
  "contacts/bulkActions.write",
  "contentAI.write",
  "conversations.readonly",
  "conversations.write",
  "conversations/message.readonly",
  "conversations/message.write",
  "dashboard/stats.readonly",
  "gokollab.write",
  "invoices.readonly",
  "invoices.write",
  "invoices/schedule.readonly",
  "invoices/schedule.write",
  "invoices/template.readonly",
  "invoices/template.write",
  "locations/tags.readonly",
  "locations/tags.write",
  "marketing/affiliate.write",
  "medias.readonly",
  "medias.write",
  "native-integrations.readonly",
  "native-integrations.write",
  "opportunities.write",
  "opportunities/bulkActions.write",
  "opportunities/leadValue.readonly",
  "payments.write",
  "payments/records.write",
  "private-integration-location.readonly",
  "private-integration-location.write",
  "prospecting.readonly",
  "prospecting.write",
  "prospecting/reports.readonly",
  "reporting/adwords.readonly",
  "reporting/agent.readonly",
  "reporting/attributions.readonly",
  "reporting/facebookAds.readonly",
  "reporting/phone.readonly",
  "reporting/reports.readonly",
  "reporting/reports.write",
  "reputation/review.write",
  "socialplanner/account.readonly",
  "socialplanner/account.write",
  "socialplanner/category.readonly",
  "socialplanner/category.write",
  "socialplanner/csv.readonly",
  "socialplanner/csv.write",
  "socialplanner/facebook.readonly",
  "socialplanner/filters.readonly",
  "socialplanner/group.write",
  "socialplanner/hashtag.readonly",
  "socialplanner/hashtag.write",
  "socialplanner/linkedin.readonly",
  "socialplanner/medias.readonly",
  "socialplanner/medias.write",
  "socialplanner/metatag.readonly",
  "socialplanner/notification.readonly",
  "socialplanner/notification.write",
  "socialplanner/oauth.readonly",
  "socialplanner/oauth.write",
  "socialplanner/post.readonly",
  "socialplanner/post.write",
  "socialplanner/recurring.readonly",
  "socialplanner/recurring.write",
  "socialplanner/review.readonly",
  "socialplanner/review.write",
  "socialplanner/rss.readonly",
  "socialplanner/rss.write",
  "socialplanner/search.readonly",
  "socialplanner/setting.readonly",
  "socialplanner/setting.write",
  "socialplanner/snapshot.readonly",
  "socialplanner/snapshot.write",
  "socialplanner/stat.readonly",
  "socialplanner/tag.readonly",
  "socialplanner/tag.write",
  "socialplanner/twitter.readonly",
  "socialplanner/watermarks.readonly",
  "socialplanner/watermarks.write",
  "users/team-management.readonly",
  "users/team-management.write",
  "wordpress.read",
  "wordpress.write"
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const API_KEY     = process.env.GHL_API_KEY;
  const LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!API_KEY || !LOCATION_ID) {
    return res.status(500).json({ error: "Missing environment variables GHL_API_KEY or GHL_LOCATION_ID" });
  }

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    Version: VERSION,
    "Content-Type": "application/json",
  };

  try {

    // ── GET: list all users in the sub-account ──
    if (req.method === "GET") {
      const response = await fetch(`${GHL_BASE}/users/?locationId=${LOCATION_ID}`, { headers });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // ── POST: create a new user ──
    if (req.method === "POST") {
      const { firstName, lastName, email, phone, role } = req.body;
      const isAdmin = (role || "user") === "admin";

      const payload = {
        locationIds: [LOCATION_ID],
        firstName,
        lastName,
        email,
        phone:    phone || "",
        password: generatePassword(),
        role:     role || "user",
        type:     "account",
        // Admins: no scopes needed (GHL grants full access by role)
        // Standard users: always use Andres Sanchez's exact scope set
        ...(isAdmin ? {} : { scopes: STANDARD_USER_SCOPES }),
      };

      const response = await fetch(`${GHL_BASE}/users/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // ── DELETE: remove a user ──
    if (req.method === "DELETE") {
      const userId = req.query.userId;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const response = await fetch(`${GHL_BASE}/users/${userId}`, {
        method: "DELETE",
        headers,
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
