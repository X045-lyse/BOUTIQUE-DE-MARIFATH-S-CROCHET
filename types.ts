
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Hauts' | 'Robes' | 'Accessoires' | 'Ensembles';
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Review {
  id: string;
  firstName: string;
  lastName: string;
  comment: string;
  rating: number;
  image?: string; // Base64 or URL
  date: string;
}
