import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const NOTIFICATION_SERVICE_URL = Deno.env.get("NOTIFICATION_SERVICE_URL") || "https://buzz.agripath.co";

interface NotificationServiceResponse {
  sent?: number | boolean;
  emailId?: string;
  sid?: string;
  type?: string;
  results?: Array<{
    type: string;
    status: string;
    sid?: string;
  }>;
  success?: boolean;
  updated?: number;
  redirectUrl?: string;
}

interface SupabaseNotification {
  id?: string;
  title: string;
  body: string;
  type: "Email" | "SMS" | "InApp" | "Push" | "All";
  user_id?: string;
  project_id?: string;
  read_at?: string | null;
  clicked_at?: string | null;
  sms_delivery_status?: string | null;
  sms_delivery_id?: string | null;
  created_at?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Route handling
    let response: Response;
    let notificationData: SupabaseNotification | null = null;

    // Health check
    if (path === "/health" && method === "GET") {
      const healthResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/health`);
      const healthData = await healthResponse.json();
      return new Response(JSON.stringify(healthData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Root endpoint
    if (path === "/" && method === "GET") {
      const rootResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/`);
      const rootData = await rootResponse.text();
      return new Response(rootData, {
        headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Send Email to All Users (Bulk)
    if (path === "/email/bulk/all" && method === "POST") {
      const body = await req.json();
      const apiResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/email/bulk/all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const apiData: NotificationServiceResponse = await apiResponse.json();

      // Store in Supabase if successful
      if (apiData.sent && apiData.sent > 0) {
        await supabase.from("notifications").insert({
          title: body.subject || "Bulk Email",
          body: body.html || body.text || "",
          type: "Email",
          status: "Published",
          target_audience: "All Users",
          created_by: userId || "00000000-0000-0000-0000-000000000000",
          published_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify(apiData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Send Email to Specific User
    if (path.match(/^\/email\/user\/([^\/]+)$/) && method === "POST") {
      const match = path.match(/^\/email\/user\/([^\/]+)$/);
      const targetUserId = match?.[1];
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await req.json();
      const apiResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/email/user/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const apiData: NotificationServiceResponse = await apiResponse.json();

      // Store in Supabase
      if (apiData.sent) {
        const { data: notification } = await supabase.from("notifications").insert({
          title: body.subject || "Email Notification",
          body: body.html || body.text || "",
          type: "Email",
          status: "Published",
          created_by: userId || "00000000-0000-0000-0000-000000000000",
          published_at: new Date().toISOString(),
        }).select().single();

        if (notification) {
          await supabase.from("users_notifications").insert({
            user_id: targetUserId,
            notifications_id: notification.id,
            title: body.subject || "Email Notification",
            body: body.html || body.text || "",
            type: "Email",
            status: "Published",
          });
        }
      }

      return new Response(JSON.stringify(apiData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Send Email to Project Investors
    if (path.match(/^\/email\/project\/([^\/]+)$/) && method === "POST") {
      const match = path.match(/^\/email\/project\/([^\/]+)$/);
      const projectId = match?.[1];
      if (!projectId) {
        return new Response(JSON.stringify({ error: "Project ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await req.json();
      const apiResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/email/project/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const apiData: NotificationServiceResponse = await apiResponse.json();

      // Store in Supabase
      if (apiData.sent && apiData.sent > 0) {
        const { data: notification } = await supabase.from("notifications").insert({
          title: body.subject || "Project Update",
          body: body.html || body.text || "",
          type: "Email",
          status: "Published",
          category: "Investment",
          created_by: userId || "00000000-0000-0000-0000-000000000000",
          published_at: new Date().toISOString(),
        }).select().single();

        // Get project investors and create user notifications
        if (notification) {
          const { data: investors } = await supabase
            .from("investments")
            .select("user_id")
            .eq("project_id", projectId)
            .eq("status", "Complete");

          if (investors && investors.length > 0) {
            const userNotifications = investors.map((inv) => ({
              user_id: inv.user_id,
              notifications_id: notification.id,
              title: body.subject || "Project Update",
              body: body.html || body.text || "",
              type: "Email" as const,
              status: "Published" as const,
            }));

            await supabase.from("users_notifications").insert(userNotifications);
          }
        }
      }

      return new Response(JSON.stringify(apiData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Send SMS to Specific User
    if (path.match(/^\/sms\/user\/([^\/]+)$/) && method === "POST") {
      const match = path.match(/^\/sms\/user\/([^\/]+)$/);
      const targetUserId = match?.[1];
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await req.json();
      const apiResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/sms/user/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const apiData: NotificationServiceResponse = await apiResponse.json();

      // Store in Supabase
      if (apiData.sent && apiData.sid) {
        const { data: notification } = await supabase.from("notifications").insert({
          title: "SMS Notification",
          body: body.message || "",
          type: "SMS",
          status: "Published",
          created_by: userId || "00000000-0000-0000-0000-000000000000",
          published_at: new Date().toISOString(),
        }).select().single();

        if (notification) {
          await supabase.from("users_notifications").insert({
            user_id: targetUserId,
            notifications_id: notification.id,
            title: "SMS Notification",
            body: body.message || "",
            type: "SMS",
            status: "Published",
            sms_delivery_id: apiData.sid,
            sms_delivery_status: "sent",
          });
        }
      }

      return new Response(JSON.stringify(apiData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Send In-App Notification
    if (path.match(/^\/inapp\/user\/([^\/]+)$/) && method === "POST") {
      const match = path.match(/^\/inapp\/user\/([^\/]+)$/);
      const targetUserId = match?.[1];
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await req.json();
      const apiResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/inapp/user/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const apiData: NotificationServiceResponse = await apiResponse.json();

      // Store in Supabase
      if (apiData.sent) {
        const { data: notification } = await supabase.from("notifications").insert({
          title: body.title || "In-App Notification",
          body: body.body || "",
          type: "InApp",
          status: "Published",
          created_by: userId || "00000000-0000-0000-0000-000000000000",
          published_at: new Date().toISOString(),
        }).select().single();

        if (notification) {
          await supabase.from("users_notifications").insert({
            user_id: targetUserId,
            notifications_id: notification.id,
            title: body.title || "In-App Notification",
            body: body.body || "",
            type: "InApp",
            status: "Published",
          });
        }
      }

      return new Response(JSON.stringify(apiData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Send Push Notification
    if (path.match(/^\/push\/user\/([^\/]+)$/) && method === "POST") {
      const match = path.match(/^\/push\/user\/([^\/]+)$/);
      const targetUserId = match?.[1];
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await req.json();
      const apiResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/push/user/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const apiData: NotificationServiceResponse = await apiResponse.json();

      // Store in Supabase
      if (apiData.sent) {
        const { data: notification } = await supabase.from("notifications").insert({
          title: body.title || "Push Notification",
          body: body.body || "",
          type: "Push",
          status: "Published",
          created_by: userId || "00000000-0000-0000-0000-000000000000",
          published_at: new Date().toISOString(),
        }).select().single();

        if (notification) {
          await supabase.from("users_notifications").insert({
            user_id: targetUserId,
            notifications_id: notification.id,
            title: body.title || "Push Notification",
            body: body.body || "",
            type: "Push",
            status: "Published",
          });
        }
      }

      return new Response(JSON.stringify(apiData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Send All Notification Types
    if (path.match(/^\/all\/user\/([^\/]+)$/) && method === "POST") {
      const match = path.match(/^\/all\/user\/([^\/]+)$/);
      const targetUserId = match?.[1];
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await req.json();
      const apiResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/all/user/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const apiData: NotificationServiceResponse = await apiResponse.json();

      // Store in Supabase for each successful notification type
      if (apiData.results) {
        const { data: notification } = await supabase.from("notifications").insert({
          title: body.title || "Multi-channel Notification",
          body: body.body || "",
          type: "All",
          status: "Published",
          created_by: userId || "00000000-0000-0000-0000-000000000000",
          published_at: new Date().toISOString(),
        }).select().single();

        if (notification) {
          await supabase.from("users_notifications").insert({
            user_id: targetUserId,
            notifications_id: notification.id,
            title: body.title || "Multi-channel Notification",
            body: body.body || "",
            type: "All",
            status: "Published",
          });
        }
      }

      return new Response(JSON.stringify(apiData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Get User Notification Status
    if (path.match(/^\/status\/([^\/]+)$/) && method === "GET") {
      const match = path.match(/^\/status\/([^\/]+)$/);
      const targetUserId = match?.[1];
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Get from Supabase
      const { data: userNotifications, error } = await supabase
        .from("users_notifications")
        .select(`
          id,
          notifications_id,
          user_id,
          title,
          body,
          type,
          status,
          read_at,
          clicked_at,
          sms_delivery_status,
          created_at
        `)
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const total = userNotifications?.length || 0;
      const read = userNotifications?.filter((n) => n.read_at !== null).length || 0;
      const clicked = userNotifications?.filter((n) => n.clicked_at !== null).length || 0;
      const delivered = userNotifications?.filter((n) => n.sms_delivery_status === "delivered" || n.read_at !== null).length || 0;

      return new Response(JSON.stringify({
        total,
        read,
        clicked,
        delivered,
        notifications: userNotifications || [],
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Get Notification Analytics
    if (path === "/analytics" && method === "GET") {
      const startDate = url.searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = url.searchParams.get("endDate") || new Date().toISOString();

      // Get analytics from Supabase
      const { data: notifications, error } = await supabase
        .from("users_notifications")
        .select("type, read_at, clicked_at, sms_delivery_status, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const total = notifications?.length || 0;
      const read = notifications?.filter((n) => n.read_at !== null).length || 0;
      const clicked = notifications?.filter((n) => n.clicked_at !== null).length || 0;
      const smsTotal = notifications?.filter((n) => n.type === "SMS").length || 0;
      const smsDelivered = notifications?.filter((n) => n.type === "SMS" && n.sms_delivery_status === "delivered").length || 0;

      const breakdown = {
        SMS: notifications?.filter((n) => n.type === "SMS").length || 0,
        Email: notifications?.filter((n) => n.type === "Email").length || 0,
        InApp: notifications?.filter((n) => n.type === "InApp").length || 0,
        Push: notifications?.filter((n) => n.type === "Push").length || 0,
      };

      return new Response(JSON.stringify({
        period: { start: startDate, end: endDate },
        totals: {
          total,
          read,
          clicked,
          smsDelivered,
          smsTotal,
        },
        rates: {
          readRate: total > 0 ? Math.round((read / total) * 100) : 0,
          clickRate: total > 0 ? Math.round((clicked / total) * 100) : 0,
          smsDeliveryRate: smsTotal > 0 ? Math.round((smsDelivered / smsTotal) * 100) : 0,
        },
        breakdown,
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Mark Notification as Read
    if (path.match(/^\/([^\/]+)\/read$/) && method === "POST") {
      const match = path.match(/^\/([^\/]+)\/read$/);
      const notificationId = match?.[1];
      if (!notificationId) {
        return new Response(JSON.stringify({ error: "Notification ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await req.json();
      const targetUserId = body.userId;

      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Update in Supabase
      const { data, error } = await supabase
        .from("users_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("notifications_id", notificationId)
        .eq("user_id", targetUserId)
        .select();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        updated: data?.length || 0,
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Track Notification Click
    if (path.match(/^\/([^\/]+)\/click$/) && method === "GET") {
      const match = path.match(/^\/([^\/]+)\/click$/);
      const notificationId = match?.[1];
      if (!notificationId) {
        return new Response(JSON.stringify({ error: "Notification ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const targetUserId = url.searchParams.get("userId");
      const redirectUrl = url.searchParams.get("redirect") || "https://app.agripath.co";

      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Update clicked_at in Supabase
      await supabase
        .from("users_notifications")
        .update({ clicked_at: new Date().toISOString() })
        .eq("notifications_id", notificationId)
        .eq("user_id", targetUserId);

      return new Response(JSON.stringify({
        redirectUrl,
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Twilio SMS Status Webhook
    if (path === "/webhook/twilio" && method === "POST") {
      const body = await req.json();
      const messageSid = body.MessageSid;
      const messageStatus = body.MessageStatus;

      // Update SMS delivery status in Supabase
      if (messageSid) {
        await supabase
          .from("users_notifications")
          .update({ sms_delivery_status: messageStatus })
          .eq("sms_delivery_id", messageSid);
      }

      return new Response(JSON.stringify({
        success: true,
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 404 for unmatched routes
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

