import { gomboDB } from "../firebase";
import { User, SecurityAlert } from "../types";

export class SecurityService {
  
  static detectContactInfo(text: string): boolean {
    if (!text) return false;
    
    // Check for phone numbers (local format, international format, spaced numbers)
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g;
    
    // Check for emails
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    
    // Check for links/social media names
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const socialRegex = /(?:whatsapp|telegram|facebook|instagram|wa\.me|t\.me|ig|fb|insta)\s*:?\s*[\w.-]+/gi;
    
    // Mobile Money mentions
    const momoRegex = /(?:momo|orange money|om|moov money|flooz|wave)\s*:?\s*\d+/gi;
    
    // Very naive check - if it finds numbers with 8-10 digits usually it's a phone
    const hasPhone = phoneRegex.test(text) && text.match(/\d/g)?.length >= 8;
    
    return hasPhone || emailRegex.test(text) || linkRegex.test(text) || socialRegex.test(text) || momoRegex.test(text);
  }

  static async scanContent(userId: string, content: string, context: string): Promise<{ blocked: boolean; warning?: string }> {
    if (this.detectContactInfo(content)) {
      // Log alert
      const alert: SecurityAlert = {
        userId,
        type: "content_detected",
        severity: "medium",
        details: `Coordonnées détectées dans ${context}: ${content.substring(0, 100)}...`,
        status: "open",
        createdAt: new Date().toISOString()
      };
      await gomboDB.publishSecurityAlert(alert);
      
      // Decrease trust score
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
        
        // Log the change
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
}

  static async analyzeMultiAccountRisk(userId: string): Promise<number> {
    try {
      // Find activities for this user to get their device/browser/IP
      const profile = await gomboDB.getUserProfile(userId);
      if (!profile) return 0;
      
      let riskScore = 0;
      
      // We would normally query user_activities where device/ip matches and userId != userId
      // Here we just return a simulated check or you'd use a real query
      // This is a placeholder for the actual Firestore query
      return riskScore;
    } catch (e) {
      return 0;
    }
  }

  static async checkFraudAndLimit(userId: string, actionType: string): Promise<{ allowed: boolean, reason?: string }> {
    // Example rate limiting
    return { allowed: true };
  }
