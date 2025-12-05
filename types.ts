export enum Category {
  VideoCreation = "Video Creation",
  AudioMusic = "Audio & Music",
  ImageGeneration = "Image Generation",
  AITools = "AI Tools & Models",
  Automation = "Automation & Productivity",
  Programming = "Programming & Development",
  Business = "Business & Marketing",
  Education = "Education & Learning",
  Science = "Science & Technology",
  Health = "Health & Wellness",
  Finance = "Finance & Investing",
  Psychology = "Psychology & Personal Growth",
  Legal = "Legal & Government",
  News = "News & Media",
  Lifestyle = "Lifestyle & Hobbies",
  Travel = "Travel & Tourism",
  Food = "Food & Cooking",
  Home = "Home & DIY",
  Shopping = "Shopping & Products",
  Sports = "Sports & Fitness",
  RealEstate = "Real Estate",
  Parenting = "Parenting & Family",
  History = "History & Culture",
  Religion = "Religion & Philosophy",
  Miscellaneous = "Miscellaneous"
}

export interface LinkItem {
  id: string; // Unique ID for keying/deleting
  url: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  tags: string[];
  notes: string;
  favorite: boolean;
  created_at: string;
  // Stage 1 Fields
  intent: string;
  linkType: string; // 'video' | 'article' | 'app/tool' | 'tutorial' | 'product page' | 'other'
  pricing: string; // 'Free' | 'Freemium' | 'Paid' | 'Unknown'
  confidenceScore: number;
  isPendingReview: boolean;
  isOpened?: boolean;
}

export interface AIClassificationResponse {
  title: string;
  category: string;
  subcategory: string;
  description: string;
  tags: string; // Comma separated string from AI
  intent: string;
  linkType: string;
  pricing: string;
  confidenceScore: number;
}

export type ScreenName = 'HOME' | 'CATEGORIES' | 'CAT_DETAIL' | 'LINK_DETAIL' | 'SEARCH' | 'PENDING_REVIEW' | 'PRO_UPGRADE' | 'UNOPENED_LIST';