import { gomboDB, db } from "../firebase";
import { User, SecurityAlert } from "../types";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";

// In-memory rate limiting map for sliding window
const rateLimitMap = new Map<string, number[]>();

export class SecurityService {
  
  /**
   * FOUNDER ZERO TRUST IDENTIFIER
   */
  static readonly FOUNDER_EMAIL = "jhs.kmj7@gmail.com";
  static readonly FOUNDER_UID = "YOUR_FOUNDER_UID_HERE"; // NEED TO GET THIS UID

  /**
   * Verify if a user is the legitimate Founder (Zero-Trust Check)
   */
  static isFounder(user: any): boolean {
    if (!user) return false;
    
    // Check by UID if available
    if (user.uid === this.FOUNDER_UID) return true;

    // Check by email as fallback
    const email = typeof user === "string" ? user : user.email;
    return email?.toLowerCase() === this.FOUNDER_EMAIL;
  }

  /**
   * Verify if a user is an authorized Admin or Founder
   */
  static isAdmin(user: any): boolean {
    if (!user) return false;
    if (this.isFounder(user)) return true;
    
    if (typeof user === "object") {
      if (user.isFounder) return true;
      if (user.role === "admin" || user.role === "super_admin") return true;
      if (user.email && user.email.toLowerCase().endsWith("@afrigombo.com")) return true;
    }
    return false;
  }

  /**
   * Log a security or access breach event to Firestore security_logs
   */
  static async logSecurityEvent(event: {
    userId?: string;
    userEmail?: string;
    action: string;
    severity: "low" | "medium" | "high" | "critical";
    details: string;
    ip?: string;
    device?: string;
    result?: "allowed" | "blocked" | "flagged";
  }): Promise<void> {
    try {
      const logData = {
        userId: event.userId || "anonymous",
        userEmail: event.userEmail || "unknown",
        action: event.action,
        severity: event.severity,
        details: event.details,
        ip: event.ip || "127.0.0.1",
        device: event.device || (navigator ? navigator.userAgent : "mobile_app"),
        result: event.result || "blocked",
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "security_logs"), logData);
    } catch (e) {
      console.warn("🔒 [SECURITY_SERVICE] Error writing security log:", e);
    }
  }

  /**
   * Sliding window Rate Limiter
   * Blocks spam & automated attacks
   */
  static enforceRateLimit(userId: string, actionKey: string, maxRequests: number = 10, windowMs: number = 60000): { allowed: boolean; remaining: number; retryAfterSec?: number } {
    const key = `${userId}_${actionKey}`;
    const now = Date.now();
    const timestamps = rateLimitMap.get(key) || [];

    // Filter out timestamps outside window
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      const oldestInWindow = validTimestamps[0];
      const retryAfterSec = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    validTimestamps.push(now);
    rateLimitMap.set(key, validTimestamps);
    return { allowed: true, remaining: maxRequests - validTimestamps.length };
  }

  /**
   * Check if a sensitive system module is currently in Maintenance Mode
   */
  static async checkMaintenanceMode(moduleKey: "wallet" | "payments" | "premium" | "publishing" | "contracts" | "global"): Promise<{ isMaintenance: boolean; message?: string }> {
    try {
      const snap = await getDoc(doc(db, "settings", "maintenance"));
      if (snap.exists()) {
        const data = snap.data();
        if (data?.globalMode === true) {
          return { isMaintenance: true, message: data?.globalMessage || "Système AFRIGOMBO en maintenance globale de sécurité." };
        }
        if (data?.[moduleKey] === true) {
          return { isMaintenance: true, message: data?.[`${moduleKey}Message`] || `Le module ${moduleKey} est temporairement en maintenance sécurisée.` };
        }
      }
    } catch (err) {
      console.warn("⚠️ [SECURITY_SERVICE] Could not check maintenance mode online:", err);
    }
    return { isMaintenance: false };
  }

  /**
   * Anti-tampering scanner for sensitive chat & post content
   */
  static detectContactInfo(text: string): boolean {
    if (!text) return false;
    
    // Check for phone numbers
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g;
    // Check for emails
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    // Check for links/social media names
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const socialRegex = /(?:whatsapp|telegram|facebook|instagram|wa\.me|t\.me|ig|fb|insta)\s*:?\s*[\w.-]+/gi;
    // Mobile Money mentions
    const momoRegex = /(?:momo|orange money|om|moov money|flooz|wave)\s*:?\s*\d+/gi;
    
    const hasPhone = phoneRegex.test(text) && (text.match(/\d/g)?.length || 0) >= 8;
    return hasPhone || emailRegex.test(text) || linkRegex.test(text) || socialRegex.test(text) || momoRegex.test(text);
  }

  static async scanContent(userId: string, content: string, context: string): Promise<{ blocked: boolean; warning?: string }> {
    if (this.detectContactInfo(content)) {
      const alert: SecurityAlert = {
        userId,
        type: "content_detected",
        severity: "medium",
        details: `Coordonnées détectées dans ${context}: ${content.substring(0, 100)}...`,
        status: "open",
        createdAt: new Date().toISOString()
      };
      await gomboDB.publishSecurityAlert(alert);
      await this.adjustTrustScore(userId, -5, `Coordonnées partagées dans ${context}`);
      return { blocked: true, warning: "Le partage de coordonnées directes, numéros de téléphone ou liens de réseaux sociaux est interdit sur la plateforme pour votre sécurité." };
    }
    return { blocked: false };
  }

  static async adjustTrustScore(userId: string, delta: number, reason: string) {
    try {
      const profile = await gomboDB.getUserProfile(userId);
      if (profile) {
        const currentScore = profile.trustScore !== undefined ? profile.trustScore : 100;
        let newScore = currentScore + delta;
        if (newScore > 100) newScore = 100;
        if (newScore < 0) newScore = 0;
        
        await gomboDB.updateUserProfile(userId, { trustScore: newScore });
        await gomboDB.logUserActivity({
          userId,
          type: "trust_score_change",
          action: `Score ${delta > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(delta)} (${newScore}/100)`,
          details: reason,
          result: "success"
        });
      }
    } catch (e) {
      console.error("Error adjusting trust score:", e);
    }
  }

  static async checkFraudAndLimit(userId: string, actionType: string): Promise<{ allowed: boolean; reason?: string }> {
    const rateCheck = this.enforceRateLimit(userId, actionType, 15, 60000);
    if (!rateCheck.allowed) {
      await this.logSecurityEvent({
        userId,
        action: `rate_limit_exceeded_${actionType}`,
        severity: "medium",
        details: `Rate limit dépassé pour l'action ${actionType}. Réessai dans ${rateCheck.retryAfterSec}s`,
        result: "blocked"
      });
      return { allowed: false, reason: `Trop de requêtes. Veuillez patienter ${rateCheck.retryAfterSec} secondes.` };
    }
    return { allowed: true };
  }
}

