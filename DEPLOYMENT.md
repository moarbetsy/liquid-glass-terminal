# Deployment Guide

Deploy the Liquid Glass Business Terminal to GitHub Pages with authentication protection.

## Quick Setup

### 1. Repository Setup

1. **Create repository** on GitHub as `moarbetsy/liquid-glass-dashboard`
2. **Repository name** is already configured in `vite.config.ts` as `/liquid-glass-dashboard/`

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow is already configured in `.github/workflows/deploy.yml`

### 3. Deploy

1. **Initialize git and push**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with GitHub Pages setup"
   git branch -M main
   git remote add origin https://github.com/moarbetsy/liquid-glass-dashboard.git
   git push -u origin main
   ```

2. **Check deployment status**:
   - Go to **Actions** tab in your repository
   - Watch the deployment workflow run
   - Once complete, your app will be available at:
     `https://moarbetsy.github.io/liquid-glass-dashboard/`

## Authentication Setup

### Default Credentials

The application comes with default login credentials:
- **Username**: `admin`
- **Password**: `admin`

### Adding New Users

1. **Generate password hash**:
   ```bash
   npm run generate-hash your-password
   ```

2. **Update LoginPage.tsx**:
   ```typescript
   const USERS: Record<string, string> = {
     'admin': '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
     'newuser': 'generated_hash_here'
   };
   ```

3. **Commit and push changes**:
   ```bash
   git add components/LoginPage.tsx
   git commit -m "Add new user credentials"
   git push origin main
   ```

### Security Considerations

- **HTTPS Required**: The crypto.subtle API requires HTTPS, which GitHub Pages provides
- **Client-Side**: Authentication is client-side only - suitable for internal tools
- **Password Hashing**: Uses SHA-256 for password storage
- **Session Persistence**: Login state is stored in localStorage

## Customization

### Repository Name

If you change your repository name after deployment:

1. Update `vite.config.ts` with the new name
2. Push changes to trigger redeployment

### Custom Domain

To use a custom domain:

1. Add a `CNAME` file to the `public` directory:
   ```
   yourdomain.com
   ```

2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings to use your custom domain

### Environment Variables

For different environments, you can use:

```typescript
// vite.config.ts
const base = process.env.NODE_ENV === 'production' 
  ? '/your-repo-name/'
  : '/'
```

## Troubleshooting

### Deployment Fails

1. **Check Actions tab** for error details
2. **Verify Node.js version** in workflow (currently set to 18)
3. **Check repository permissions** for GitHub Actions

### App Not Loading

1. **Verify base path** in `vite.config.ts` matches your repository name
2. **Check browser console** for 404 errors
3. **Ensure HTTPS** is being used (required for crypto.subtle)

### Login Issues

1. **Check browser console** for crypto.subtle errors
2. **Verify HTTPS** connection
3. **Clear localStorage** if needed: `localStorage.clear()`

## Manual Deployment

If you prefer manual deployment:

1. **Build for GitHub Pages**:
   ```bash
   npm run build:github
   ```

2. **Deploy dist folder** to your hosting provider

## Local Development

For local development with authentication:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` with full authentication features.

## Production Considerations

### Data Backup

Since the app uses localStorage:
- **Export data regularly** using the Settings page
- **Consider server-side storage** for production use
- **Implement data sync** if using multiple devices

### Performance

- **Enable gzip compression** on your server
- **Use CDN** for static assets if needed
- **Monitor bundle size** with `npm run build`

### Security

- **Change default passwords** immediately
- **Use strong passwords** for production
- **Consider server-side authentication** for sensitive data
- **Regular security updates** of dependencies

## Support

For deployment issues:
1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review the [GitHub Pages documentation](https://docs.github.com/en/pages)
3. Open an issue in this repository

---

**Happy deploying! 🚀**