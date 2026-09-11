import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { getEffectiveGomboId, getGomboIdStatusInfo } from "./gomboIdHelper";

export interface CertificateData {
  artistName: string;
  realName?: string;
  gomboId: string;
  statusLabel: string;
  verificationLevel: string;
  trustScore: number;
  issueDate: string;
  commune: string;
  category: string;
  avatarUrl?: string;
  verificationUrl: string;
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      },
      errorCorrectionLevel: "H"
    });
  } catch (err) {
    console.error("Failed to generate QR code data URL", err);
    return "";
  }
}

export function extractCertificateData(user: any): CertificateData {
  const gomboId = getEffectiveGomboId(user);
  const statusInfo = getGomboIdStatusInfo(user);
  
  const artistName = (
    user?.artisticName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.name ||
    "Artiste d'Excellence"
  ).trim();

  const realName = (user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`).trim();
  const isApproved = user?.kycStatus === "approved";
  
  const issueDate = user?.kycApprovedDate || user?.kycSubmittedDate || new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const commune = user?.commune || "Abidjan, Côte d'Ivoire";
  const category = user?.instrument || (Array.isArray(user?.instruments) ? user.instruments.join(" • ") : "") || "Musique & Performance Artistique";
  const trustScore = isApproved ? (user?.gomboId?.scoreConfiance ?? user?.trustScore ?? 98) : 50;

  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://afrigombo.ci";
  const verificationUrl = `${origin}/verification/${gomboId}`;

  return {
    artistName,
    realName: realName !== artistName ? realName : undefined,
    gomboId,
    statusLabel: isApproved ? "Artiste Certifié" : statusInfo.statusLabel,
    verificationLevel: statusInfo.verificationLevel,
    trustScore,
    issueDate,
    commune,
    category,
    avatarUrl: user?.avatarUrl,
    verificationUrl
  };
}

/**
 * Generate a PDF Certificate
 */
export async function downloadCertificatePdf(data: CertificateData): Promise<void> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4" // 297mm x 210mm
  });

  const width = 297;
  const height = 210;

  // Background deep luxury dark
  doc.setFillColor(13, 13, 15);
  doc.rect(0, 0, width, height, "F");

  // Subtle Outer Gold Border
  doc.setDrawColor(212, 175, 55); // #D4AF37
  doc.setLineWidth(1.5);
  doc.rect(8, 8, width - 16, height - 16);

  // Inner Thin Accent Border
  doc.setDrawColor(160, 130, 40);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, width - 24, height - 24);

  // Top Title Bar / Institution
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RÉPUBLIQUE DU SHOWBIZ • ALLIANCE DES TALENTS D'AFRIQUE DE L'OUEST", width / 2, 22, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.setFont("helvetica", "normal");
  doc.text("COMMISSION NATIONALE D'HOMOLOGATION & DU PATRIMOINE MUSICAL", width / 2, 27, { align: "center" });

  // Main Certificate Heading
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICAT D'EXCELLENCE ARTISTIQUE", width / 2, 42, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "italic");
  doc.text("GOMBO ID OFFICIAL RECOGNITION", width / 2, 48, { align: "center" });

  // Divider Line
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(width / 2 - 60, 52, width / 2 + 60, 52);

  // Preamble Text
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Le Haut Conseil d'Attribution certifie que l'artiste identifié ci-dessous a satisfait aux protocoles",
    width / 2,
    62,
    { align: "center" }
  );
  doc.text(
    "de conformité et détient le titre officiel de membre certifié de la plateforme AFRIGOMBO.",
    width / 2,
    67,
    { align: "center" }
  );

  // Artist Name Banner (Golden Centerpiece)
  doc.setFillColor(25, 25, 30);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.roundedRect(width / 2 - 80, 75, 160, 24, 3, 3, "FD");

  doc.setFontSize(18);
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.text(data.artistName.toUpperCase(), width / 2, 87, { align: "center" });

  if (data.realName) {
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    doc.text(`Identité civile : ${data.realName}`, width / 2, 94, { align: "center" });
  }

  // Two columns: Left Details / Right QR Code + Seal
  const leftX = 25;
  const startY = 112;
  const lineSpacing = 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.text("IDENTIFIANT GOMBO ID :", leftX, startY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(data.gomboId, leftX + 52, startY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.text("NIVEAU DE GARANTIE :", leftX, startY + lineSpacing);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(data.verificationLevel, leftX + 52, startY + lineSpacing);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.text("STATUT DU TITULAIRE :", leftX, startY + lineSpacing * 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 240, 160); // green
  doc.text(data.statusLabel, leftX + 52, startY + lineSpacing * 2);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.text("DISCIPLINE & SECTEUR :", leftX, startY + lineSpacing * 3);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(data.category, leftX + 52, startY + lineSpacing * 3);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.text("PÔLE GÉOGRAPHIQUE :", leftX, startY + lineSpacing * 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(data.commune, leftX + 52, startY + lineSpacing * 4);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 175, 55);
  doc.text("DATE DE DÉLIVRANCE :", leftX, startY + lineSpacing * 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text(data.issueDate, leftX + 52, startY + lineSpacing * 5);

  // QR Code insertion on the right
  try {
    const qrDataUrl = await generateQrCodeDataUrl(data.verificationUrl);
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", width - 68, 110, 42, 42);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(212, 175, 55);
      doc.text("SCANNER POUR VÉRIFIER", width - 47, 157, { align: "center" });

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 160);
      doc.text("Intégrité cryptographique", width - 47, 161, { align: "center" });
    }
  } catch (err) {
    console.warn("QR code embed failed in PDF", err);
  }

  // Official Footer & Seal Notice
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(20, 178, width - 20, 178);

  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Document officiel infalsifiable délivré par AFRIGOMBO. Valable auprès des festivals, hôtels, salles et promoteurs de spectacles.",
    width / 2,
    185,
    { align: "center" }
  );

  doc.setFontSize(7);
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.text("SCEAU D'AUTHENTICITÉ & DE SOUVERAINETÉ ARTISTIQUE • CÔTE D'IVOIRE", width / 2, 191, { align: "center" });

  const cleanName = data.artistName.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
  const cleanId = data.gomboId.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
  const filename = `Certificat_Gombo_ID_${cleanName}_${cleanId}.pdf`;

  doc.save(filename);
}

/**
 * Generate a PNG Certificate via HTML5 Canvas
 */
export async function downloadCertificatePng(data: CertificateData): Promise<void> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // High Resolution Canvas (1920 x 1080)
  canvas.width = 1920;
  canvas.height = 1080;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
  bgGrad.addColorStop(0, "#0a0a0c");
  bgGrad.addColorStop(0.5, "#121216");
  bgGrad.addColorStop(1, "#070709");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Outer Gold Border
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, 1840, 1000);

  // Inner Accent Border
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 1800, 960);

  // Corner Ornaments
  const drawCorner = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(0, 0);
    ctx.lineTo(40, 0);
    ctx.stroke();
    ctx.restore();
  };

  drawCorner(75, 75, 0);
  drawCorner(1845, 75, Math.PI / 2);
  drawCorner(1845, 1005, Math.PI);
  drawCorner(75, 1005, -Math.PI / 2);

  // Top Institution
  ctx.textAlign = "center";
  ctx.font = "bold 20px 'Cinzel', serif, system-ui";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText("RÉPUBLIQUE DU SHOWBIZ • ALLIANCE DES TALENTS D'AFRIQUE DE L'OUEST", 960, 120);

  ctx.font = "14px system-ui";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText("COMMISSION NATIONALE D'HOMOLOGATION & DU PATRIMOINE MUSICAL", 960, 150);

  // Main Heading
  ctx.font = "bold 44px 'Cinzel', Georgia, serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("CERTIFICAT D'EXCELLENCE ARTISTIQUE", 960, 220);

  ctx.font = "italic 18px Georgia, serif";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText("GOMBO ID OFFICIAL RECOGNITION & TRUST CREDENTIAL", 960, 255);

  // Divider
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(660, 280);
  ctx.lineTo(1260, 280);
  ctx.stroke();

  // Preamble
  ctx.font = "18px system-ui";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillText(
    "Par ce présent titre officiel, le consortium d'accréditation certifie la conformité artistique de :",
    960,
    330
  );

  // Artist Centerpiece Card
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(460, 365, 1000, 120, 16);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 48px system-ui";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText(data.artistName.toUpperCase(), 960, 435);

  if (data.realName) {
    ctx.font = "16px system-ui";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(`Identité civile : ${data.realName}`, 960, 465);
  }

  // Left Details Table
  ctx.textAlign = "left";
  const startX = 220;
  const valX = 540;
  const startY = 560;
  const gapY = 48;

  const rows = [
    ["IDENTIFIANT GOMBO ID :", data.gomboId, "#FFFFFF"],
    ["NIVEAU DE GARANTIE :", data.verificationLevel, "#FFFFFF"],
    ["STATUT DU TITULAIRE :", data.statusLabel, "#34D399"],
    ["DISCIPLINE & SECTEUR :", data.category, "#FFFFFF"],
    ["PÔLE GÉOGRAPHIQUE :", data.commune, "#FFFFFF"],
    ["DATE DE DÉLIVRANCE :", data.issueDate, "#D4AF37"]
  ];

  rows.forEach(([label, val, color], idx) => {
    ctx.font = "bold 18px system-ui";
    ctx.fillStyle = "#D4AF37";
    ctx.fillText(label, startX, startY + idx * gapY);

    ctx.font = "bold 20px system-ui";
    ctx.fillStyle = color;
    ctx.fillText(val, valX, startY + idx * gapY);
  });

  // Right Side: QR Code
  try {
    const qrDataUrl = await generateQrCodeDataUrl(data.verificationUrl);
    if (qrDataUrl) {
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.src = qrDataUrl;
      });

      // Background plate for QR code
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(1440, 540, 240, 240, 12);
      ctx.fill();

      ctx.drawImage(qrImg, 1450, 550, 220, 220);

      ctx.textAlign = "center";
      ctx.font = "bold 15px system-ui";
      ctx.fillStyle = "#D4AF37";
      ctx.fillText("SCANNER POUR VÉRIFIER", 1560, 815);

      ctx.font = "13px system-ui";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("Vérification publique instantanée", 1560, 835);
    }
  } catch (err) {
    console.warn("QR code render failed on canvas", err);
  }

  // Footer Divider
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 920);
  ctx.lineTo(1800, 920);
  ctx.stroke();

  // Footer
  ctx.textAlign = "center";
  ctx.font = "14px system-ui";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText(
    "Document officiel certifié par AFRIGOMBO. Valable auprès de tous les établissements partenaires d'Afrique de l'Ouest.",
    960,
    955
  );

  ctx.font = "bold 15px system-ui";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText("SCEAU D'AUTHENTICITÉ & DE SOUVERAINETÉ ARTISTIQUE • CÔTE D'IVOIRE", 960, 985);

  // Trigger download
  const cleanName = data.artistName.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
  const cleanId = data.gomboId.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
  const filename = `Certificat_Gombo_ID_${cleanName}_${cleanId}.png`;

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
