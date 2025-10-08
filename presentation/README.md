# GSE Frontend

A modern React application for visualizing Ghana Stock Exchange data with real-time updates and interactive charts.

## Features

- **Real-time Market Data**: Live stock prices and market information
- **Interactive Charts**: Price history visualization using Recharts
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Mode**: Built-in dark/light theme support
- **Professional UI**: Clean, modern interface with smooth animations
- **Market Summary**: Overview of market performance and statistics

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API communication
- **Lucide React** for icons

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp env.example .env
   ```

   Edit `.env` and set your API URL:

   ```
   VITE_API_URL=http://localhost:3000
   ```

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. **Build for production**:

   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Card, etc.)
│   ├── charts/         # Chart components
│   └── ...             # Feature-specific components
├── pages/              # Application pages
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx            # Main application component
```

## Components

### UI Components

- `Button` - Customizable button with variants
- `Card` - Container component with header/content structure
- `LoadingSpinner` - Loading states with overlay support

### Chart Components

- `PriceChart` - Interactive price history charts
- Supports both line and area chart types
- Responsive design with custom tooltips

### Feature Components

- `StockCard` - Individual stock display with price/change info
- `MarketSummary` - Market overview with statistics
- `Dashboard` - Main application page

## API Integration

The frontend communicates with the GSE backend API:

- `GET /api/stocks` - Fetch all stocks
- `GET /api/stocks/{symbol}` - Get specific stock details
- `GET /api/stocks/{symbol}/history` - Historical price data
- `GET /api/market/summary` - Market overview
- `POST /api/admin/refresh` - Trigger data refresh

## Styling

The application uses Tailwind CSS with custom design system:

- **Colors**: Primary blue theme with success/danger variants
- **Typography**: Inter font family
- **Animations**: Smooth transitions and hover effects
- **Dark Mode**: Automatic theme switching
- **Responsive**: Mobile-first responsive design

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

## Deployment

The built application can be deployed to any static hosting service:

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure the API URL is correctly configured

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Write reusable components
4. Add proper error handling
5. Test on multiple screen sizes
