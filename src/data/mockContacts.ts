import type { ContactEntry } from "../types/contact";

export const mockFriends: ContactEntry[] = [
  { id: "minh-anh", name: "Minh Anh", initials: "MA", color: "#FCE7F3", detail: "Đang hoạt động", online: true },
  { id: "quang-huy", name: "Quang Huy", initials: "QH", color: "#DCFCE7", detail: "Ngoại tuyến" },
  { id: "thao-nguyen", name: "Thảo Nguyễn", initials: "TN", color: "#F3E8FF", detail: "Ngoại tuyến" },
];

export const mockGroups: ContactEntry[] = [
  { id: "team-design", name: "Nhóm Thiết kế", initials: "NT", color: "#E0E7FF", detail: "Nhóm chat" },
  { id: "gia-dinh", name: "Gia đình", initials: "GĐ", color: "#FEF3C7", detail: "Nhóm chat" },
  { id: "product-team", name: "Product Team", initials: "PT", color: "#CFFAFE", detail: "Nhóm chat" },
];
