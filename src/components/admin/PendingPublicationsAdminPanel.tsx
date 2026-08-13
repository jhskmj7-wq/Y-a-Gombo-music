import React from "react";
import AdminPublicationsManager from "./AdminPublicationsManager";

export interface ModeratedPublication {
  id: string;
  collectionName: "social_posts" | "gombos" | "posts";
  title: string;
  authorName: string;
  authorId: string;
  budget?: number;
  createdAt: string;
  status: string;
  visible?: boolean;
  commune?: string;
  type?: string;
  isFlagged?: boolean;
  reportsCount?: number;
  reportReason?: string;
}

interface PendingPublicationsAdminPanelProps {
  currentUser?: any;
}

export const PendingPublicationsAdminPanel: React.FC<PendingPublicationsAdminPanelProps> = ({
  currentUser
}) => {
  return <AdminPublicationsManager currentUser={currentUser} />;
};

export default PendingPublicationsAdminPanel;
