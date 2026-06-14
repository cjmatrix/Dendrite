export interface IContentHash {
  _id: string;
  contentHash: string;
  fileUrl: string;
  status: "active" | "expired";
  expireAt: Date | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
