export type DirectoryEntry = {
  id: string;
  name: string;
  initials: string;
  color: string;
  detail?: string;
  online?: boolean;
};

export const mockFriends: DirectoryEntry[] = [
  { id: "minh-anh", name: "Minh Anh", initials: "MA", color: "#FCE7F3", detail: "Đang hoạt động", online: true },
  { id: "quang-huy", name: "Quang Huy", initials: "QH", color: "#DCFCE7", detail: "Ngoại tuyến" },
  { id: "thao-nguyen", name: "Thảo Nguyễn", initials: "TN", color: "#F3E8FF", detail: "Ngoại tuyến" },
];

export const mockGroups: DirectoryEntry[] = [
  { id: "team-design", name: "Nhóm Thiết kế", initials: "NT", color: "#E0E7FF", detail: "Nhóm chat" },
  { id: "gia-dinh", name: "Gia đình", initials: "GĐ", color: "#FEF3C7", detail: "Nhóm chat" },
  { id: "product-team", name: "Product Team", initials: "PT", color: "#CFFAFE", detail: "Nhóm chat" },
];
