# EasyPanel Monitor

A privacy-friendly monitoring dashboard for EasyPanel servers built with Next.js and shadcn/ui.

## Features

- **Privacy-First**: All server credentials are stored locally in your browser's localStorage
- **Multi-Server Support**: Monitor multiple EasyPanel instances from a single dashboard
- **Real-Time Monitoring**: View CPU, memory, and network usage for all containers
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- An EasyPanel server with API access

### Installation

#### Option 1: Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd easypanel-monitor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option 2: Docker Deployment

1. **Production deployment with Docker:**
```bash
# Build and run the production container
docker build -t easypanel-monitor .
docker run -p 3000:3000 easypanel-monitor
```

2. **Using Docker Compose (recommended):**
```bash
# Production deployment
docker-compose up -d

# Development with hot reload
docker-compose --profile dev up -d
```

3. **One-line deployment:**
```bash
# Quick production deployment
docker run -d -p 3000:3000 --name easypanel-monitor --restart unless-stopped easypanel-monitor
```

### Building for Production

```bash
npm run build
npm start
```

## Docker Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for production builds
- `NEXT_TELEMETRY_DISABLED`: Set to `1` to disable Next.js telemetry
- `PORT`: Port to run the application (default: 3000)
- `HOSTNAME`: Hostname to bind to (default: 0.0.0.0)

### Docker Compose Services

- **easypanel-monitor**: Production service with optimized build
- **easypanel-monitor-dev**: Development service with hot reload (use `--profile dev`)

### Reverse Proxy Setup

The docker-compose.yml includes Traefik labels for easy reverse proxy setup:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.easypanel-monitor.rule=Host(`monitor.yourdomain.com`)"
  - "traefik.http.routers.easypanel-monitor.tls=true"
  - "traefik.http.routers.easypanel-monitor.tls.certresolver=letsencrypt"
```

Update `monitor.yourdomain.com` to your actual domain.

## Usage

### Adding a Server

1. Click "Add EasyPanel Server" on the dashboard
2. Enter your EasyPanel server details:
   - **Hostname**: Your EasyPanel URL (e.g., `https://panel.example.com`)
   - **Username/Email**: Your EasyPanel login email
   - **Password**: Your EasyPanel password
3. Click "Add Server"

The app will authenticate with your EasyPanel server and store the access token locally.

### Monitoring Servers

- View all your servers on the main dashboard with basic stats
- Click on any server hostname to open detailed monitoring
- Use the refresh button to update monitoring data
- Remove servers using the trash icon

### Privacy & Security

- **Local Storage Only**: All credentials and tokens are stored in your browser's localStorage
- **No External Services**: No data is sent to third-party services
- **Direct API Calls**: The app communicates directly with your EasyPanel servers
- **No Server-Side Storage**: This is a client-side only application



## Deployment Options

### 1. Docker (Recommended)
```bash
docker-compose up -d
```

### 2. Node.js
```bash
npm run build
npm start
```

### 3. Static Export
```bash
npm run build
# Serve the 'out' directory with any static file server
```

### 4. Vercel/Netlify
Deploy directly from your Git repository.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include your EasyPanel version and browser details

## Roadmap

- [x] Auto-refresh monitoring data
- [x] Dark/light theme toggle
- [x] Auth using API key
- [x] Historical data charts
- [ ] Alert notifications
- [ ] Server health status indicators 