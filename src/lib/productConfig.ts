import type { ProductConfig } from '../types';

export const PRODUCT_CONFIG: ProductConfig = {
  "Ti": { 
    "sizes": { "1g": 30, "2g": 60, "3.5g": 130, "7g": 200, "14g": 300, "28g": 450, "100g": 1800, "500g": 4900, "1kg": 8000 }, 
    "allowCustom": "g" 
  },
  "GH": { 
    "sizes": { "5ml": 10, "20ml": 40, "60ml": 100, "100ml": 180, "1000ml": 1400 }, 
    "allowCustom": "ml" 
  },
  "Vi": { 
    "sizes": { 
      "Blue 100mg": 6, 
      "Purple 100mg": 8, 
      "Red 150mg": 10, 
      "Black 200mg": 10, 
      "Levi 60mg": 12, 
      "Kam Jelly 100mg": 10 
    } 
  },
  "Ci": { 
    "sizes": { 
      "20mg": 8, 
      "60mg": 10, 
      "80mg": 12 
    } 
  },
  "Sp": { "sizes": { "unit": 3 } },
  "E": { "sizes": { "unit": 8 } },
  "Md": { "sizes": { "unit": 8, "1g": 70 }, "allowCustom": "g" },
  "We": { "sizes": { "0.5g": 5, "3.5g": 20, "28g": 90 }, "allowCustom": "g" },
  "Ha": { "sizes": { "1g": 10 }, "allowCustom": "g" },
  "Ket": { "sizes": { "0.33g": 40, "1g": 90, "28g": 750 }, "allowCustom": "g" },
  "Coco": { "sizes": { "0.5g": 50, "1g": 90, "3.5g": 280, "28g": 1200 }, "allowCustom": "g" },
  "Mu": { "sizes": { "3.5g": 25, "28g": 150 }, "allowCustom": "g" },
  "Pop": { "sizes": { "30ml": 55, "60ml": 75 } },
  "Pi": { "sizes": { "unit": 5 } },
  "Li": { "sizes": { "unit": 10 } },
  "Bo": { "sizes": { "unit": 30 } }
};