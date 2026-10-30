import type { Chat } from '../types/chat'

export const mockChats: Chat[] = [
  { id: 'minh-anh', name: 'Minh Anh', avatar: 'MA', avatarColor: '#FCE7F3', lastMessage: 'Chi\u1EC1u nay m\u00ECnh g\u1EB7p nh\u00E9!', time: '10:42', unreadCount: 2, online: true },
  { id: 'team-design', name: 'Nh\u00F3m Thi\u1EBFt k\u1EBF', avatar: 'NT', avatarColor: '#E0E7FF', lastMessage: 'Tu\u1EA5n: M\u00ECnh \u0111\u00E3 c\u1EADp nh\u1EADt b\u1EA3n m\u1EABu.', time: '09:58', unreadCount: 5 },
  { id: 'quang-huy', name: 'Quang Huy', avatar: 'QH', avatarColor: '#DCFCE7', lastMessage: 'C\u1EA3m \u01A1n b\u1EA1n nhi\u1EC1u nha!', time: 'H\u00F4m qua' },
  { id: 'gia-dinh', name: 'Gia \u0111\u00ECnh', avatar: 'G\u0110', avatarColor: '#FEF3C7', lastMessage: 'M\u1EB9: Cu\u1ED1i tu\u1EA7n v\u1EC1 \u0103n c\u01A1m nh\u00E9 con', time: 'H\u00F4m qua', unreadCount: 1 },
  { id: 'thao-nguyen', name: 'Th\u1EA3o Nguy\u1EC5n', avatar: 'TN', avatarColor: '#F3E8FF', lastMessage: '\u0110\u00E3 g\u1EEDi m\u1ED9t \u1EA3nh', time: 'T.2' },
  { id: 'product-team', name: 'Product Team', avatar: 'PT', avatarColor: '#CFFAFE', lastMessage: 'L\u1ECBch h\u1ECDp tu\u1EA7n n\u00E0y \u0111\u00E3 \u0111\u01B0\u1EE3c g\u1EEDi.', time: 'T.2' },
]
